import { Question } from '@/types/Question';
import { FormValues } from '@/components/training/types/FormValues';
import { UnclearQuestionsService } from '@/services/UnclearQuestionsService';
import { supabase } from '@/integrations/supabase/client';

export const filterQuestions = async (
  questions: Question[],
  values: FormValues,
  questionResults?: Map<string, boolean>,
  userId?: string
): Promise<Question[]> => {
  console.log('Starting filterQuestions with', questions.length, 'questions');
  
  // Normalize FormValues to ensure subjects is always an array
  const normalizedValues: FormValues = {
    ...values,
    subjects: Array.isArray(values.subjects) ? values.subjects : []
  };
  
  // Start with all questions
  let filteredQuestions = [...questions];
  
  // Filter out unclear/ignored questions first
  try {
    const { data: unclearQuestions } = await UnclearQuestionsService.getUserUnclearQuestions();
    if (unclearQuestions && unclearQuestions.length > 0) {
      const unclearQuestionIds = new Set(unclearQuestions.map(uq => uq.question_id));
      filteredQuestions = filteredQuestions.filter(q => !unclearQuestionIds.has(q.id));
      console.log('After filtering unclear questions:', filteredQuestions.length);
    }
  } catch (error) {
    console.error('Error filtering unclear questions:', error);
  }
  
  // Apply questionsWithImagesOnly filter (applies even in random mode)
  if (normalizedValues.questionsWithImagesOnly) {
    console.log('Filtering questions with images only...');
    const beforeCount = filteredQuestions.length;
    filteredQuestions = filteredQuestions.filter(q => q.image_key && q.image_key.trim() !== '');
    console.log(`After images filter: ${filteredQuestions.length} (removed ${beforeCount - filteredQuestions.length})`);
  }
  
  // Apply new filters if enabled and userId is available (these apply even in random mode)
  if (userId && (normalizedValues.newQuestionsOnly || normalizedValues.excludeTodaysQuestions)) {
    console.log('Applying new question filters...');
    
    // Get progress data from both session_question_progress (prioritized) and user_progress (fallback)
    const questionIds = filteredQuestions.map(q => q.id);
    const BATCH_SIZE = 500;
    const progressMap = new Map<string, { created_at: string; updated_at: string | null }>();
    
    // Process in batches
    for (let i = 0; i < questionIds.length; i += BATCH_SIZE) {
      const batch = questionIds.slice(i, i + BATCH_SIZE);
      
      const [sessionProgressResult, userProgressResult] = await Promise.all([
        supabase
          .from('session_question_progress')
          .select('question_id, created_at, updated_at')
          .eq('user_id', userId)
          .in('question_id', batch)
          .order('updated_at', { ascending: false }),
        supabase
          .from('user_progress')
          .select('question_id, created_at, updated_at')
          .eq('user_id', userId)
          .in('question_id', batch)
      ]);
      
      // Process session_question_progress first (newer system, takes priority)
      // Aggregate latest progress per question across all sessions
      if (sessionProgressResult.data) {
        const sessionProgressByQuestion = new Map<string, any>();
        sessionProgressResult.data.forEach(progress => {
          const existing = sessionProgressByQuestion.get(progress.question_id);
          // Keep the most recent progress per question
          if (!existing || (progress.updated_at && (!existing.updated_at || progress.updated_at > existing.updated_at))) {
            sessionProgressByQuestion.set(progress.question_id, progress);
          }
        });
        
        sessionProgressByQuestion.forEach(progress => {
          progressMap.set(progress.question_id, {
            created_at: progress.created_at,
            updated_at: progress.updated_at
          });
        });
      }
      
      // Process user_progress as fallback (only for questions not in session_question_progress)
      if (userProgressResult.data) {
        userProgressResult.data.forEach(progress => {
          if (!progressMap.has(progress.question_id)) {
            progressMap.set(progress.question_id, {
              created_at: progress.created_at,
              updated_at: progress.updated_at
            });
          }
        });
      }
      
      if (sessionProgressResult.error) {
        console.error('Error fetching session progress for filtering:', sessionProgressResult.error);
      }
      if (userProgressResult.error) {
        console.error('Error fetching user progress for filtering:', userProgressResult.error);
      }
    }
    
    // Filter new questions only
    if (normalizedValues.newQuestionsOnly) {
      console.log('Filtering new questions only...');
      const beforeCount = filteredQuestions.length;
      filteredQuestions = filteredQuestions.filter(q => !progressMap.has(q.id));
      console.log(`After new questions filter: ${filteredQuestions.length} (removed ${beforeCount - filteredQuestions.length})`);
    }
    
    // Filter out today's questions
    if (normalizedValues.excludeTodaysQuestions) {
      console.log('Filtering out today\'s questions...');
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const todayISOString = today.toISOString();
      
      const beforeCount = filteredQuestions.length;
      filteredQuestions = filteredQuestions.filter(q => {
        const progress = progressMap.get(q.id);
        if (!progress) return true; // Include questions never answered
        
        // Check if question was answered today (either created or updated today)
        const createdToday = progress.created_at >= todayISOString;
        const updatedToday = progress.updated_at && progress.updated_at >= todayISOString;
        
        return !createdToday && !updatedToday;
      });
      console.log(`After excluding today's questions filter: ${filteredQuestions.length} (removed ${beforeCount - filteredQuestions.length})`);
    }
  }
  
  // Apply difficulty filter (applies even in random mode)
  if (normalizedValues.difficulty !== 'all') {
    const selectedDifficulty = parseInt(normalizedValues.difficulty);
    filteredQuestions = filteredQuestions.filter(q => {
      const questionDifficulty = q.difficulty ?? 3;
      return questionDifficulty === selectedDifficulty;
    });
  }
  
  // If random selection is enabled, skip subject/year/semester filtering
  if (normalizedValues.isRandomSelection) {
    return filteredQuestions;
  }
  
  // Check for contradictory filters
  if (normalizedValues.newQuestionsOnly && normalizedValues.wrongQuestionsOnly) {
    console.warn('Both newQuestionsOnly and wrongQuestionsOnly are enabled - this will return no questions');
    return []; // Return empty array since these filters are mutually exclusive
  }
  
  // Filter wrong questions first if enabled
  if (normalizedValues.wrongQuestionsOnly && questionResults) {
    console.log('Filtering wrong questions...');
    console.log('Before wrong questions filter:', filteredQuestions.length);
    filteredQuestions = filteredQuestions.filter(q => {
      const result = questionResults.get(q.id);
      const isWrong = result === false;
      return isWrong;
    });
    console.log('After wrong questions filter:', filteredQuestions.length);
  }
  
  // Then apply subject filter (support both new subjects array and legacy subject string)
  // Empty array means "all subjects" (no filtering)
  const selectedSubjects: string[] = normalizedValues.subjects.length > 0
    ? normalizedValues.subjects
    : (normalizedValues.subject && normalizedValues.subject !== 'all' ? [normalizedValues.subject] : []);
  
  // Only filter if we have specific subjects selected
  if (selectedSubjects.length > 0) {
    console.log('Filtering by subjects:', selectedSubjects);
    const beforeCount = filteredQuestions.length;
    filteredQuestions = filteredQuestions.filter(q => {
      if (!q.subject) return false;
      return selectedSubjects.includes(q.subject);
    });
    console.log(`After subject filter: ${filteredQuestions.length} (removed ${beforeCount - filteredQuestions.length})`);
  } else {
    console.log('No subject filter applied (all subjects)');
  }
  
  // Apply year range filter
  const [minYear, maxYear] = normalizedValues.yearRange;
  console.log('Filtering by year range:', minYear, 'to', maxYear);
  filteredQuestions = filteredQuestions.filter(q => {
    // Include questions with no year data if the range covers the default range
    if (!q.year) {
      // Include questions without year data when the year range is at its maximum
      const currentYear = new Date().getFullYear();
      return minYear <= 2000 && maxYear >= currentYear;
    }
    
    const questionYear = parseInt(q.year);
    return !isNaN(questionYear) && questionYear >= minYear && questionYear <= maxYear;
  });
  console.log('After year range filter:', filteredQuestions.length);
  
  // Apply specific exam year filter if not 'all'
  if (normalizedValues.examYear && normalizedValues.examYear !== 'all') {
    console.log('Filtering by specific exam year:', normalizedValues.examYear);
    const beforeCount = filteredQuestions.length;
    filteredQuestions = filteredQuestions.filter(q => q.year === normalizedValues.examYear);
    console.log(`After exam year filter: ${filteredQuestions.length} (removed ${beforeCount - filteredQuestions.length})`);
  }
  
  // Apply specific exam semester filter if not 'all'
  if (normalizedValues.examSemester && normalizedValues.examSemester !== 'all') {
    console.log('Filtering by specific exam semester:', normalizedValues.examSemester);
    const beforeCount = filteredQuestions.length;
    filteredQuestions = filteredQuestions.filter(q => q.semester === normalizedValues.examSemester);
    console.log(`After exam semester filter: ${filteredQuestions.length} (removed ${beforeCount - filteredQuestions.length})`);
  }

  return filteredQuestions;
};

export const prioritizeQuestions = (
  filteredQuestions: Question[],
  questionResults: Map<string, boolean>,
  questionCount: number,
  isRandomSelection: boolean,
  sortByAttempts: boolean,
  attemptsCount: Map<string, number>,
  sortDirection: 'asc' | 'desc' = 'desc'
): Question[] => {
  // If random selection is enabled, simply shuffle all questions
  if (isRandomSelection) {
    return shuffle(filteredQuestions).slice(0, questionCount);
  }

  // If sort by attempts is enabled, sort questions by attempts count
  if (sortByAttempts) {
    return [...filteredQuestions].sort((a, b) => {
      const attemptsA = attemptsCount.get(a.id) || 0;
      const attemptsB = attemptsCount.get(b.id) || 0;
      return sortDirection === 'desc' ? attemptsB - attemptsA : attemptsA - attemptsB;
    }).slice(0, questionCount);
  }

  // Default prioritization logic
  const untrained: Question[] = [];
  const wrongAnswered: Question[] = [];
  const correctAnswered: Question[] = [];

  filteredQuestions.forEach(question => {
    const result = questionResults.get(question.id);
    if (result === undefined) {
      untrained.push(question);
    } else if (result === false) {
      wrongAnswered.push(question);
    } else {
      correctAnswered.push(question);
    }
  });

  return [
    ...shuffle(untrained),
    ...shuffle(wrongAnswered),
    ...shuffle(correctAnswered)
  ].slice(0, questionCount);
};

const shuffle = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

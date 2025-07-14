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
  
  // Apply new filters if enabled and userId is available (these apply even in random mode)
  if (userId && (values.newQuestionsOnly || values.excludeTodaysQuestions)) {
    console.log('Applying new question filters...');
    
    // Get all user progress data for filtering
    const { data: userProgress, error: progressError } = await supabase
      .from('user_progress')
      .select('question_id, created_at, updated_at')
      .eq('user_id', userId);
    
    if (progressError) {
      console.error('Error fetching user progress for filtering:', progressError);
    } else {
      const userProgressMap = new Map<string, { created_at: string; updated_at: string | null }>();
      userProgress?.forEach(progress => {
        userProgressMap.set(progress.question_id, {
          created_at: progress.created_at,
          updated_at: progress.updated_at
        });
      });
      
      // Filter new questions only
      if (values.newQuestionsOnly) {
        console.log('Filtering new questions only...');
        const beforeCount = filteredQuestions.length;
        filteredQuestions = filteredQuestions.filter(q => !userProgressMap.has(q.id));
        console.log(`After new questions filter: ${filteredQuestions.length} (removed ${beforeCount - filteredQuestions.length})`);
      }
      
      // Filter out today's questions
      if (values.excludeTodaysQuestions) {
        console.log('Filtering out today\'s questions...');
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const todayISOString = today.toISOString();
        
        const beforeCount = filteredQuestions.length;
        filteredQuestions = filteredQuestions.filter(q => {
          const progress = userProgressMap.get(q.id);
          if (!progress) return true; // Include questions never answered
          
          // Check if question was answered today (either created or updated today)
          const createdToday = progress.created_at >= todayISOString;
          const updatedToday = progress.updated_at && progress.updated_at >= todayISOString;
          
          return !createdToday && !updatedToday;
        });
        console.log(`After excluding today's questions filter: ${filteredQuestions.length} (removed ${beforeCount - filteredQuestions.length})`);
      }
    }
  }
  
  // If random selection is enabled, skip subject/difficulty/year filtering
  if (values.isRandomSelection) {
    return filteredQuestions;
  }
  
  // Check for contradictory filters
  if (values.newQuestionsOnly && values.wrongQuestionsOnly) {
    console.warn('Both newQuestionsOnly and wrongQuestionsOnly are enabled - this will return no questions');
    return []; // Return empty array since these filters are mutually exclusive
  }
  
  // Filter wrong questions first if enabled
  if (values.wrongQuestionsOnly && questionResults) {
    console.log('Filtering wrong questions...');
    console.log('Before wrong questions filter:', filteredQuestions.length);
    filteredQuestions = filteredQuestions.filter(q => {
      const result = questionResults.get(q.id);
      const isWrong = result === false;
      return isWrong;
    });
    console.log('After wrong questions filter:', filteredQuestions.length);
  }
  
  // Then apply subject filter
  if (values.subject !== 'all') {
    console.log('Filtering by subject:', values.subject);
    filteredQuestions = filteredQuestions.filter(q => q.subject === values.subject);
    console.log('After subject filter:', filteredQuestions.length);
  }
  
  // Apply year range filter
  const [minYear, maxYear] = values.yearRange;
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
  
  // Finally apply difficulty filter
  if (values.difficulty !== 'all') {
    const selectedDifficulty = parseInt(values.difficulty);
    console.log('Filtering by difficulty:', selectedDifficulty);
    filteredQuestions = filteredQuestions.filter(q => {
      const questionDifficulty = q.difficulty ?? 3;
      return questionDifficulty === selectedDifficulty;
    });
    console.log('After difficulty filter:', filteredQuestions.length);
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

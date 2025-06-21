
import { Question } from '@/types/Question';
import { FormValues } from '@/components/training/types/FormValues';
import { UnclearQuestionsService } from '@/services/UnclearQuestionsService';

export const filterQuestions = async (
  questions: Question[],
  values: FormValues,
  questionResults?: Map<string, boolean>
): Promise<Question[]> => {
  // Get user's unclear questions and filter them out
  const { data: unclearQuestions } = await UnclearQuestionsService.getUserUnclearQuestions();
  const unclearQuestionIds = new Set(unclearQuestions?.map(uq => uq.question_id) || []);
  
  // Filter out unclear questions first
  let filteredQuestions = questions.filter(q => !unclearQuestionIds.has(q.id));
  
  // If random selection is enabled, skip filtering by subject and difficulty
  if (values.isRandomSelection) {
    return [...filteredQuestions];
  }
  
  // Filter wrong questions first if enabled
  if (values.wrongQuestionsOnly && questionResults) {
    console.log('Filtering wrong questions...');
    console.log('Before wrong questions filter:', filteredQuestions.length);
    filteredQuestions = filteredQuestions.filter(q => {
      const result = questionResults.get(q.id);
      const isWrong = result === false;
      console.log('Question:', q.id, 'Result:', result, 'Is Wrong:', isWrong);
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
    // Skip questions with no year data
    if (!q.year) return false;
    
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

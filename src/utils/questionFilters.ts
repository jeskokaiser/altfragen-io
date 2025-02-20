
import { Question } from '@/types/Question';
import { FormValues } from '@/components/training/types/FormValues';

export const filterQuestions = (questions: Question[], values: FormValues): Question[] => {
  // If random selection is enabled, skip filtering by subject and difficulty
  if (values.isRandomSelection) {
    return [...questions];
  }
  
  let filteredQuestions = [...questions];
  
  if (values.subject !== 'all') {
    filteredQuestions = filteredQuestions.filter(q => q.subject === values.subject);
    console.log('After subject filter:', filteredQuestions.length);
  }
  
  if (values.difficulty !== 'all') {
    const selectedDifficulty = parseInt(values.difficulty);
    filteredQuestions = filteredQuestions.filter(q => {
      const questionDifficulty = q.difficulty ?? 3;
      const matches = questionDifficulty === selectedDifficulty;
      console.log('Question:', q.id, 'Difficulty:', questionDifficulty, 'Selected:', selectedDifficulty, 'Matches:', matches);
      return matches;
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
  attemptsCount: Map<string, number>
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
      return attemptsA - attemptsB;
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


/**
 * Form values for training configuration
 */
export interface FormValues {
  subject: string;
  questionCount: string;
  difficulty: string;
  isRandomSelection: boolean;
  sortByAttempts: boolean;
  sortDirection: 'asc' | 'desc';
  wrongQuestionsOnly: boolean;
}

/**
 * Form data for question editing/creation
 */
export interface FormData {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  correctAnswer: string;
  comment: string;
  subject: string;
  difficulty: string;
}

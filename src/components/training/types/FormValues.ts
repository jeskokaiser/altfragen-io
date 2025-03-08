
export interface FormValues {
  subject: string;
  difficulty: string;
  questionCount: string;
  isRandomSelection: boolean;
  sortByAttempts: boolean;
  sortDirection: 'asc' | 'desc';
  wrongQuestionsOnly: boolean;
}

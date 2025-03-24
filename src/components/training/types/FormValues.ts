
export interface FormValues {
  subject: string;
  questionCount: string;
  difficulty: string;
  isRandomSelection: boolean;
  sortByAttempts: boolean;
  sortDirection: 'asc' | 'desc';
  wrongQuestionsOnly: boolean;
  year: string;
}

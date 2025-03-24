
export interface FormValues {
  subject: string;
  questionCount: string;
  difficulty: string;
  isRandomSelection: boolean;
  sortByAttempts: boolean;
  sortDirection: 'asc' | 'desc';
  wrongQuestionsOnly: boolean;
  yearRange: [number, number]; // Changed from single year to range
}


export interface FormValues {
  subject: string;
  questionCount: string;
  difficulty: string;
  isRandomSelection: boolean;
  sortByAttempts: boolean;
  sortDirection: 'asc' | 'desc';
  wrongQuestionsOnly: boolean;
  yearRange: [number, number]; // Year range from min to max
}

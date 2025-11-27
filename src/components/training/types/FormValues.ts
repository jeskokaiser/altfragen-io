export interface FormValues {
  subject: string;
  questionCount: number; // Changed from string to number
  difficulty: string;
  isRandomSelection: boolean;
  sortByAttempts: boolean;
  sortDirection: 'asc' | 'desc';
  wrongQuestionsOnly: boolean;
  newQuestionsOnly: boolean;
  excludeTodaysQuestions: boolean;
  questionsWithImagesOnly: boolean;
  yearRange: [number, number]; // Year range from min to max
  examYear: string; // Specific exam year filter
  examSemester: string; // Specific exam semester filter (SS/WS)
}

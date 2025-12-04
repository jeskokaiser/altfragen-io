export interface FormValues {
  subject?: string; // Deprecated: use subjects array instead, kept for backward compatibility
  subjects: string[]; // Array of selected subjects, empty array means 'all'
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

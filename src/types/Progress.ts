export interface QuestionProgress {
  questionId: string;
  correctAttempts: number;
  incorrectAttempts: number;
  lastAttempted: Date;
  nextReviewDate: Date;
}

export interface UserProgress {
  [questionId: string]: QuestionProgress;
}
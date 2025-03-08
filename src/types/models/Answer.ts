
/**
 * Represents a user's answer to a question
 */
export interface Answer {
  /**
   * The ID of the question
   */
  questionId: string;
  
  /**
   * The user's selected answer (A, B, C, D, or E)
   */
  selectedAnswer: string;
  
  /**
   * Whether the answer is correct
   */
  isCorrect: boolean;
  
  /**
   * When the answer was submitted
   */
  answeredAt: string;
}

/**
 * Represents the state of a user's answer during training
 */
export interface AnswerState {
  /**
   * The selected answer value
   */
  value: string;
  
  /**
   * Whether this was the first attempt
   */
  isFirstAttempt: boolean;
  
  /**
   * Whether the solution was viewed
   */
  viewedSolution?: boolean;
  
  /**
   * All attempts made on this question
   */
  attempts?: string[];
  
  /**
   * The original first answer submitted
   */
  originalAnswer?: string;
}


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

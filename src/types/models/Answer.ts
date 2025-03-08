
/**
 * Represents the state of an answer to a question
 */
export interface AnswerState {
  /**
   * The value of the answer (usually A, B, C, D, or E)
   */
  value: string;
  
  /**
   * Whether this was the first attempt at answering the question
   */
  isFirstAttempt: boolean;
  
  /**
   * Whether the solution was viewed
   */
  viewedSolution: boolean;
  
  /**
   * List of all attempts made
   */
  attempts: string[];
  
  /**
   * The original answer if the user changed their answer
   */
  originalAnswer?: string;
}

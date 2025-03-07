
/**
 * Represents a user's progress on a question
 */
export interface UserProgress {
  /**
   * Unique identifier for the progress record
   */
  id: string;
  
  /**
   * The ID of the user
   */
  userId: string;
  
  /**
   * The ID of the question
   */
  questionId: string;
  
  /**
   * Whether the user answered correctly
   */
  isCorrect: boolean;
  
  /**
   * The user's answer
   */
  userAnswer: string;
  
  /**
   * The number of attempts made on this question
   */
  attemptsCount: number;
  
  /**
   * When the progress was first recorded
   */
  createdAt: string;
  
  /**
   * When the progress was last updated
   */
  updatedAt: string;
}


/**
 * User progress on a question
 */
export interface UserProgress {
  /**
   * Unique identifier for the progress record
   */
  id: string;
  
  /**
   * ID of the user
   */
  user_id: string;
  
  /**
   * ID of the question
   */
  question_id: string;
  
  /**
   * The user's answer to the question
   */
  user_answer?: string;
  
  /**
   * Whether the user's answer is correct
   */
  is_correct?: boolean;
  
  /**
   * Number of attempts the user has made on the question
   */
  attempts_count: number;
  
  /**
   * When the record was created
   */
  created_at: string;
  
  /**
   * When the record was last updated
   */
  updated_at?: string;
}

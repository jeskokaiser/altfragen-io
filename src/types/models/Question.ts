
/**
 * Represents a question in the application
 */
export interface Question {
  /**
   * Unique identifier for the question
   */
  id: string;
  
  /**
   * The text of the question
   */
  question: string;
  
  /**
   * Option A for the question
   */
  optionA: string;
  
  /**
   * Option B for the question
   */
  optionB: string;
  
  /**
   * Option C for the question
   */
  optionC: string;
  
  /**
   * Option D for the question
   */
  optionD: string;
  
  /**
   * Option E for the question
   */
  optionE: string;
  
  /**
   * The subject of the question
   */
  subject: string;
  
  /**
   * The correct answer (A, B, C, D, or E)
   */
  correctAnswer: string;
  
  /**
   * Additional comment or explanation for the question
   */
  comment: string;
  
  /**
   * Filename of the dataset the question belongs to
   */
  filename: string;
  
  /**
   * When the question was created
   */
  created_at?: string;
  
  /**
   * Difficulty level of the question (1-5)
   */
  difficulty: number;
  
  /**
   * Whether the question is marked as unclear
   */
  is_unclear?: boolean;
  
  /**
   * When the question was marked as unclear
   */
  marked_unclear_at?: string;
  
  /**
   * Visibility of the question (private, university, public)
   */
  visibility?: string;
  
  /**
   * ID of the university this question is shared with (if visibility = university)
   */
  university_id?: string | null;
}

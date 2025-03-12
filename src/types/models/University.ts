
/**
 * Represents a university in the system
 */
export interface University {
  /**
   * Unique identifier for the university
   */
  id: string;
  
  /**
   * Name of the university
   */
  name: string;
  
  /**
   * Email domain of the university (e.g., 'tum.de')
   */
  email_domain: string;
  
  /**
   * When the university was created
   */
  created_at?: string;
  
  /**
   * When the university was last updated
   */
  updated_at?: string;
}

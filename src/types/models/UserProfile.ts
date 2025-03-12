
import { University } from './University';

/**
 * Represents a user profile in the system
 */
export interface UserProfile {
  /**
   * Unique identifier for the user (matches auth.users.id)
   */
  id: string;
  
  /**
   * Email address of the user
   */
  email?: string | null;
  
  /**
   * User's university ID
   */
  university_id?: string | null;
  
  /**
   * Whether the user's email has been verified
   */
  is_email_verified?: boolean;
  
  /**
   * When the profile was created
   */
  created_at?: string;
  
  /**
   * The user's university (populated during joins)
   */
  university?: University | null;
}

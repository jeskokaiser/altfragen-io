
import { User } from '@supabase/supabase-js';

/**
 * Auth context type definition
 */
export interface AuthContextType {
  /**
   * Current authenticated user
   */
  user: User | null;
  
  /**
   * Loading state while checking authentication
   */
  loading: boolean;
}

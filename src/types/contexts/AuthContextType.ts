
import { User } from '@supabase/supabase-js';
import { UserProfile } from '../models/UserProfile';

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: Error | null;
  logout: () => Promise<{ error: Error | null }>;
  verifyUniversityEmail: () => Promise<{ success: boolean; message?: string }>;
}


import { Database } from '@/integrations/supabase/types';

/**
 * Type aliases for Database models
 */
export type DatabaseQuestion = Database['public']['Tables']['questions']['Insert'];
export type DatabaseUserPreferences = Database['public']['Tables']['user_preferences']['Insert'];
export type DatabaseUserProgress = Database['public']['Tables']['user_progress']['Insert'];

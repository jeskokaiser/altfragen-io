
import { Database } from '@/integrations/supabase/types';

/**
 * Type aliases for Database models
 */
export type DatabaseQuestion = Database['public']['Tables']['questions']['Insert'];
export type DatabaseUserPreferences = Database['public']['Tables']['user_preferences']['Insert'];
export type DatabaseUserProgress = Database['public']['Tables']['user_progress']['Insert'];

// The organizations table doesn't exist in the types yet, so we'll define it manually
export interface DatabaseOrganization {
  id?: string;
  domain: string;
  created_at?: string;
}

// Update DatabaseQuestion to include the new fields
export interface ExtendedDatabaseQuestion extends DatabaseQuestion {
  visibility?: 'private' | 'organization';
  organization_id?: string | null;
}

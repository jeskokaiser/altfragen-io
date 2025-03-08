
import { Database } from '@/integrations/supabase/types';

/**
 * Type aliases for Database models
 */
export type DatabaseQuestion = Database['public']['Tables']['questions']['Insert'];
export type DatabaseUserPreferences = Database['public']['Tables']['user_preferences']['Insert'];
export type DatabaseUserProgress = Database['public']['Tables']['user_progress']['Insert'];

// Define organization interface since it's not in the Supabase types yet
export interface DatabaseOrganization {
  id?: string;
  domain: string;
  created_at?: string;
  is_whitelisted?: boolean;
}

// Define organization whitelist interface
export interface DatabaseOrganizationWhitelist {
  id?: string;
  organization_id: string;
  is_whitelisted: boolean;
  created_at?: string;
}

// Update DatabaseQuestion to include the new fields
export interface ExtendedDatabaseQuestion extends DatabaseQuestion {
  visibility?: 'private' | 'organization';
  organization_id?: string | null;
}

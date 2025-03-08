
import { supabase } from '@/integrations/supabase/client';

/**
 * Gets organization information by ID (workaround for type system limitations)
 * This function is a client-side wrapper that calls a raw SQL query
 * since our type system doesn't yet know about the organizations table
 */
export const getOrganizationById = async (organizationId: string): Promise<{id: string, domain: string} | null> => {
  try {
    const { data, error } = await supabase
      .rpc('get_organization_by_id', { org_id: organizationId });
    
    if (error) {
      console.error('Error getting organization by ID:', error);
      
      // Fallback to raw query
      const { data: rawData, error: rawError } = await supabase.from('organizations')
        .select('id, domain')
        .eq('id', organizationId)
        .single();
      
      if (rawError) {
        console.error('Error in fallback query:', rawError);
        return null;
      }
      
      return rawData;
    }
    
    return data;
  } catch (error) {
    console.error('Failed to get organization:', error);
    return null;
  }
};

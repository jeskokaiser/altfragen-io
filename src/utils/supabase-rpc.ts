
import { supabase } from '@/integrations/supabase/client';

/**
 * Wrapper for get_organization_by_id RPC function
 * @param organizationId - The ID of the organization to get
 * @returns The organization data
 */
export async function getOrganizationById(organizationId: string) {
  const { data, error } = await supabase.rpc('get_organization_by_id', {
    org_id: organizationId
  });
  
  if (error) {
    throw error;
  }
  
  return data;
}

/**
 * Wrapper for is_organization_whitelisted RPC function
 * @param organizationId - The ID of the organization to check
 * @returns A boolean indicating if the organization is whitelisted
 */
export async function checkOrganizationWhitelisted(organizationId: string) {
  const { data, error } = await supabase.rpc('is_organization_whitelisted', {
    org_id: organizationId
  });
  
  if (error) {
    throw error;
  }
  
  return !!data;
}

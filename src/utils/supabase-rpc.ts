
import { supabase } from '@/integrations/supabase/client';

/**
 * Executes a Supabase RPC function with the given name and parameters
 * @param functionName - The name of the RPC function to call
 * @param params - The parameters to pass to the function
 * @returns The result of the RPC call
 */
export const executeRpc = async <T>(functionName: string, params: Record<string, any> = {}): Promise<T | null> => {
  const { data, error } = await supabase.rpc(functionName, params);
  
  if (error) {
    console.error(`Error executing RPC function ${functionName}:`, error);
    return null;
  }
  
  return data as T;
};

/**
 * Fetches the organization details for a user
 * @param userId - The ID of the user
 * @returns The organization details
 */
export const fetchUserOrganization = async (userId: string) => {
  return executeRpc('get_user_organization', { user_id: userId });
};

/**
 * Checks if an organization is whitelisted
 * @param organizationId - The ID of the organization
 * @returns Boolean indicating if the organization is whitelisted
 */
export const checkOrganizationWhitelist = async (organizationId: string) => {
  return executeRpc<boolean>('is_organization_whitelisted', { org_id: organizationId });
};

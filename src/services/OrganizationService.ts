
import { supabase } from '@/integrations/supabase/client';
import { DatabaseOrganization, DatabaseOrganizationWhitelist } from '@/types/api/database';
import { AppError, handleApiError } from '@/utils/errorHandler';

/**
 * Gets the organization information for a user
 * @param userId - The ID of the user
 * @returns Organization information including domain and whitelist status
 */
export const getUserOrganization = async (userId: string): Promise<DatabaseOrganization | null> => {
  try {
    // Get the user's profile information
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id, email_domain')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return null;
    }
    
    if (!userProfile?.organization_id) {
      return null;
    }
    
    // Try to get organization data with whitelist status using the RPC function
    try {
      const { data: orgData, error: rpcError } = await supabase
        .rpc('get_organization_by_id', {
          org_id: userProfile.organization_id
        });
      
      if (rpcError) {
        console.error('Error in RPC call:', rpcError);
        throw rpcError;
      }
      
      if (orgData) {
        return orgData as DatabaseOrganization;
      }
    } catch (rpcError) {
      console.warn('RPC function not available, falling back to direct query:', rpcError);
    }
    
    // Fallback: get organization info directly
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id, domain, created_at')
      .eq('id', userProfile.organization_id)
      .single();
    
    if (orgError) {
      console.error('Error fetching organization:', orgError);
      return null;
    }
    
    // Get whitelist status
    const { data: whitelistData, error: whitelistError } = await supabase
      .from('organization_whitelist')
      .select('is_whitelisted')
      .eq('organization_id', userProfile.organization_id)
      .single();
    
    return {
      id: orgData.id,
      domain: orgData.domain,
      created_at: orgData.created_at,
      is_whitelisted: whitelistData?.is_whitelisted || false
    };
  } catch (error) {
    console.error('Failed to get user organization:', error);
    return null;
  }
};

/**
 * Gets the whitelist status of an organization
 * @param organizationId - The ID of the organization
 * @returns A boolean indicating if the organization is whitelisted
 */
export const isOrganizationWhitelisted = async (organizationId: string): Promise<boolean> => {
  try {
    // Try to use the RPC function first
    try {
      const { data, error } = await supabase
        .rpc('is_organization_whitelisted', {
          org_id: organizationId
        });
      
      if (!error) {
        return !!data;
      }
    } catch (rpcError) {
      console.warn('RPC function not available, falling back to direct query:', rpcError);
    }
    
    // Fallback: query directly
    const { data, error } = await supabase
      .from('organization_whitelist')
      .select('is_whitelisted')
      .eq('organization_id', organizationId)
      .single();
    
    if (error) {
      return false;
    }
    
    return data?.is_whitelisted || false;
  } catch (error) {
    console.error('Failed to check organization whitelist status:', error);
    return false;
  }
};

/**
 * Adds an organization to the whitelist
 * @param organizationId - The ID of the organization to whitelist
 * @returns A boolean indicating success
 */
export const whitelistOrganization = async (organizationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('organization_whitelist')
      .upsert({
        organization_id: organizationId,
        is_whitelisted: true
      });
    
    return !error;
  } catch (error) {
    throw handleApiError(error, 'Failed to whitelist organization');
  }
};

/**
 * Removes an organization from the whitelist
 * @param organizationId - The ID of the organization to remove from whitelist
 * @returns A boolean indicating success
 */
export const unwhitelistOrganization = async (organizationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('organization_whitelist')
      .upsert({
        organization_id: organizationId,
        is_whitelisted: false
      });
    
    return !error;
  } catch (error) {
    throw handleApiError(error, 'Failed to remove organization from whitelist');
  }
};

/**
 * Gets all organizations with their whitelist status
 * @returns A list of organizations with whitelist status
 */
export const getAllOrganizations = async (): Promise<DatabaseOrganization[]> => {
  try {
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('id, domain, created_at');
    
    if (orgError) {
      throw new AppError(orgError.message, orgError);
    }
    
    const { data: whitelistData, error: whitelistError } = await supabase
      .from('organization_whitelist')
      .select('organization_id, is_whitelisted');
    
    if (whitelistError) {
      console.warn('Error fetching whitelist data:', whitelistError);
    }
    
    // Create a map of organization_id to is_whitelisted
    const whitelistMap = new Map<string, boolean>();
    if (whitelistData) {
      whitelistData.forEach(item => {
        whitelistMap.set(item.organization_id, item.is_whitelisted);
      });
    }
    
    // Merge the data
    return organizations.map(org => ({
      ...org,
      is_whitelisted: whitelistMap.get(org.id) || false
    }));
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch organizations');
  }
};

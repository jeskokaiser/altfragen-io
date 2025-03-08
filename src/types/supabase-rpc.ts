
/**
 * Types for Supabase RPC functions
 */

// Parameters for RPC functions
export interface RPCParams {
  // Parameters for get_organization_by_id function
  get_organization_by_id: {
    org_id: string;
  };
  
  // Parameters for is_organization_whitelisted function
  is_organization_whitelisted: {
    org_id: string;
  };
  
  // Parameters for get_user_organization function
  get_user_organization: {
    user_id: string;
  };
}

// Return types for RPC functions
export interface RPCReturnTypes {
  get_organization_by_id: {
    id: string;
    domain: string;
    created_at: string;
    is_whitelisted: boolean;
  };
  
  is_organization_whitelisted: boolean;
  
  get_user_organization: {
    id: string;
    domain: string;
    created_at: string;
    is_whitelisted: boolean;
  };
}

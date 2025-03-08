
# RPC TypeScript Issue Report

## Issue Summary

There appears to be a TypeScript type issue with the RPC function calls in the Supabase client integration. When making calls to RPC functions, TypeScript is incorrectly inferring `never` as the parameter type, which is causing type-checking errors.

## Affected Files

```
src/
├── services/
│   └── OrganizationService.ts 🟢 (Key service making RPC calls)
├── types/
│   ├── api/
│   │   └── database.ts 🟡 (Contains database-related type definitions)
│   └── supabase-rpc.ts 🔴 (Contains the problematic RPC type definitions)
├── integrations/
│   └── supabase/
│       └── client.ts 🟡 (Supabase client instance)
```

## Detailed Analysis

### The Problem

The issue stems from how TypeScript is inferring types when making RPC calls using the Supabase client. When the following code is executed:

```typescript
// From OrganizationService.ts
const { data, error } = await supabase
  .rpc<RPCParams['is_organization_whitelisted'], boolean>(
    'is_organization_whitelisted', 
    { org_id: organizationId }
  );
```

TypeScript is inferring `never` as the parameter type, resulting in type errors at build time.

### Type Definitions

The current type definitions in `supabase-rpc.ts` are:

```typescript
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
```

### Implementation in OrganizationService.ts

The service is attempting to use these types for RPC calls:

```typescript
// For is_organization_whitelisted
try {
  const { data, error } = await supabase
    .rpc<RPCParams['is_organization_whitelisted'], boolean>(
      'is_organization_whitelisted', 
      { org_id: organizationId }
    );
  
  if (!error) {
    return !!data;
  }
} catch (rpcError) {
  console.warn('RPC function not available, falling back to direct query:', rpcError);
}

// For get_organization_by_id
const { data: orgData, error: rpcError } = await supabase
  .rpc<RPCParams['get_organization_by_id'], DatabaseOrganization>(
    'get_organization_by_id', 
    { org_id: userProfile.organization_id }
  );
```

## Potential Causes

1. **Type Definition Mismatch**: The types defined in `supabase-rpc.ts` may not be compatible with how the Supabase client expects them.

2. **Generic Constraints**: The generics in the `.rpc<P, R>()` method may have constraints that are not being met by the provided types.

3. **Type Generation**: If these types were auto-generated, the generation process might have produced incorrect definitions.

4. **Client Registration**: The Supabase client might not be correctly registering the RPC functions with their types.

## Reproduction Steps

1. Navigate to any code path that calls an RPC function in `OrganizationService.ts`
2. Note TypeScript errors related to parameter types being inferred as `never`

## Recommended Solutions

1. **Updated Type Approach**:
   ```typescript
   // Instead of using RPCParams['is_organization_whitelisted'], try:
   type IsWhitelistedParams = { org_id: string };
   const { data, error } = await supabase
     .rpc<IsWhitelistedParams, boolean>(
       'is_organization_whitelisted', 
       { org_id: organizationId }
     );
   ```

2. **Correct Type Registration**:
   Ensure that the Supabase TypeScript definitions are correctly set up to recognize the RPC functions and their parameter types.

3. **Validation Functions**:
   Add runtime validation for parameters to catch any type issues that might slip through TypeScript compilation.

## Additional Notes

- The codebase includes fallback mechanisms when RPC calls fail, indicating awareness of potential issues with these functions.
- The types in `supabase-rpc.ts` are well-structured but may need adjustment to work correctly with the Supabase client's TypeScript implementation.
- TypeScript version and Supabase client version compatibility should be verified.

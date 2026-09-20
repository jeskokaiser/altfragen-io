// Resolving Supabase API keys during the migration away from legacy keys.
//
// Supabase injects the new keys as JSON objects keyed by name --
// SUPABASE_SECRET_KEYS and SUPABASE_PUBLISHABLE_KEYS -- alongside the legacy
// SUPABASE_SERVICE_ROLE_KEY and SUPABASE_ANON_KEY. The helpers below prefer a
// new key and fall back to the legacy one, so a function keeps working whether
// or not the new keys have been provisioned yet. Once the legacy keys are
// disabled, the fallback simply stops being reached and can be dropped.
//
// These are the keys a function sends *outbound* to Supabase. They say nothing
// about who is allowed to call the function: that is the platform's verify_jwt
// gate, which only understands the legacy JWT keys. Callers must keep using a
// legacy JWT until each function authorizes requests itself.

const readNamedKey = (bundleVar: string, name = 'default'): string | undefined => {
  const bundle = Deno.env.get(bundleVar);
  if (!bundle) return undefined;
  try {
    const parsed = JSON.parse(bundle);
    const key = parsed?.[name];
    return typeof key === 'string' && key.length > 0 ? key : undefined;
  } catch {
    // A malformed bundle must not take the function down -- fall back instead.
    console.error(`[supabaseKeys] ${bundleVar} is not valid JSON, using the legacy key`);
    return undefined;
  }
};

/** Server-side key that bypasses RLS. Never expose this to a browser. */
export const getSecretKey = (): string | undefined =>
  readNamedKey('SUPABASE_SECRET_KEYS') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

/** Low-privilege key for clients scoped to a caller's JWT. RLS still applies. */
export const getPublishableKey = (): string | undefined =>
  readNamedKey('SUPABASE_PUBLISHABLE_KEYS') ?? Deno.env.get('SUPABASE_ANON_KEY');

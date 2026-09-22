import { supabase } from '@/integrations/supabase/client';

/**
 * Owns the `profiles` table: who a signed-in user is, and the flags that decide
 * what they may see.
 *
 * Every function here throws on a database error rather than returning a
 * fallback. What a failure should mean differs per screen -- a missing admin
 * flag means "not an admin", a missing profile on sign-in means the session is
 * unusable -- so the caller decides, and the German message a user ends up
 * seeing stays next to the screen that shows it.
 */

/** The profile fields read when a session is established. */
export interface UserProfile {
  universityId: string | null;
  isEmailVerified: boolean;
  username: string | null;
}

export const fetchUserProfile = async (userId: string): Promise<UserProfile> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('university_id, is_email_verified, username')
    .eq('id', userId)
    .single();

  if (error) throw error;

  return {
    universityId: data.university_id,
    isEmailVerified: data.is_email_verified || false,
    username: data.username || null,
  };
};

/**
 * Records whether the user has confirmed their email.
 *
 * Supabase auth holds the authoritative answer; the profile carries a copy so
 * the app can read it without a round trip to the auth API, and the two are
 * reconciled on sign-in.
 */
export const setEmailVerified = async (userId: string, isVerified: boolean): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update({ is_email_verified: isVerified })
    .eq('id', userId);

  if (error) throw error;
};

export const fetchIsAdmin = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single();

  if (error) throw error;

  return !!data?.is_admin;
};

export const fetchIsPremium = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('is_premium')
    .eq('id', userId)
    .single();

  if (error) throw error;

  return data?.is_premium ?? false;
};

/** Records the marketing consent given at sign-up, with the moment it was given. */
export const setMarketingConsent = async (userId: string, accepted: boolean): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update({
      marketing_consent: accepted,
      marketing_consent_at: accepted ? new Date().toISOString() : null,
    })
    .eq('id', userId);

  if (error) throw error;
};

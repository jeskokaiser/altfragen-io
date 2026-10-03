import { supabase } from '@/integrations/supabase/client';

/**
 * Reads the AI commentary allowance for a user's private questions: the full
 * runs counted against the free 30-day quota (`ai_private_quota_ledger`) and
 * the bought credits left (`ai_private_credits_ledger`). Both are database
 * functions summing a ledger; the Edge Function `ai-comment-credits-status`
 * calls the same two.
 *
 * Every function here throws on a database error; the caller decides what a
 * failure means for the user.
 */

/**
 * Full AI commentary runs on the user's private questions in the last 30
 * days, including the ones still processing -- counting those keeps two
 * batches claimed at once from both fitting into the remaining quota.
 */
export const fetchPrivateAiUsedLast30Days = async (userId: string): Promise<number> => {
  const { data, error } = await supabase.rpc('ai_private_full_used_30d', { p_user_id: userId });

  if (error) throw error;

  return data ?? 0;
};

/** Bought AI credits the user has left: the sum of the credit ledger. */
export const fetchPrivateAiCreditsRemaining = async (userId: string): Promise<number> => {
  const { data, error } = await supabase.rpc('ai_private_credits_remaining', {
    p_user_id: userId,
  });

  if (error) throw error;

  return data ?? 0;
};

import { supabase } from '@/integrations/supabase/client';

/**
 * Owns the browser's read of `subscribers`: whether the signed-in user has
 * premium, which kind, and until when. Only the `stripe-webhook` Edge Function
 * writes the table; the browser reads its own row and nothing else.
 */

export interface SubscriptionStatus {
  subscribed: boolean;
  subscriptionTier: string | null;
  subscriptionEnd: string | null;
}

export const NOT_SUBSCRIBED: SubscriptionStatus = {
  subscribed: false,
  subscriptionTier: null,
  subscriptionEnd: null,
};

/**
 * The user's subscription, or `NOT_SUBSCRIBED` when they have no subscriber
 * row.
 *
 * Found by `user_id` alone. The context used to ask for the user's id or their
 * email, but RLS lets a user read only rows that carry their own `user_id`, so
 * the email could never find a row the id did not. A subscriber row the webhook
 * has not linked to a user is invisible to that user -- it always was -- and
 * linking it is the webhook's job. `user_id` is not unique in the table: a
 * second row for the same user fails this read, as it failed the old one.
 *
 * Throws an `Error` carrying the database's message, which the context shows in
 * its toast. The PostgREST error itself is a plain object, not an `Error`.
 */
export const fetchSubscriptionStatus = async (userId: string): Promise<SubscriptionStatus> => {
  const { data, error } = await supabase
    .from('subscribers')
    .select('subscribed, subscription_tier, subscription_end')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Subscription query error:', error);
    throw new Error(error.message || 'Failed to check subscription');
  }

  if (!data) return { ...NOT_SUBSCRIBED };

  return {
    subscribed: data.subscribed || false,
    subscriptionTier: data.subscription_tier || null,
    subscriptionEnd: data.subscription_end || null,
  };
};

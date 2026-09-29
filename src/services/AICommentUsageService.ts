import { supabase } from '@/integrations/supabase/client';

/**
 * Owns `user_ai_comment_usage`: how many AI comments a free user has opened on
 * a given day, one row per user and day. `useAICommentUsage` compares the count
 * with the daily limit from `ai_commentary_settings` before it lets a free user
 * see AI content.
 *
 * Every function here throws on a database error; the hook decides what a
 * failure means for the user.
 */

/**
 * The day a usage row is filed under: the UTC calendar day, so the free
 * allowance starts over at midnight UTC -- 01:00 in German winter, 02:00 in
 * summer -- not at local midnight.
 */
export const usageDate = (now: Date = new Date()): string => now.toISOString().split('T')[0];

/** How many AI comments the user has opened on `date`; 0 when there is no row. */
export const fetchDailyUsage = async (userId: string, date: string): Promise<number> => {
  const { data, error } = await supabase
    .from('user_ai_comment_usage')
    .select('usage_count')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle();

  if (error) throw error;

  return data?.usage_count ?? 0;
};

/**
 * Counts one more AI comment for the signed-in user on `date`, and returns the
 * new count.
 *
 * One statement in the database -- `increment_ai_comment_usage`, an
 * `INSERT ... ON CONFLICT DO UPDATE SET usage_count = usage_count + 1`. The
 * hook used to read the count and write count + 1, and two tabs doing that at
 * once both wrote the same number, so one comment went uncounted. The function
 * takes the user from the session rather than a parameter, so it can only
 * count for the caller.
 */
export const incrementDailyUsage = async (date: string): Promise<number> => {
  const { data, error } = await supabase.rpc('increment_ai_comment_usage', { p_date: date });

  if (error) throw error;

  return data;
};

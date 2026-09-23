import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

/**
 * Owns `ai_commentary_settings`: a single row of app-wide limits and switches
 * that an admin edits, read by every screen that gates a free user.
 *
 * Four components used to read this row themselves, each with its own
 * fallback for when a column was empty -- and two of them disagreed about the
 * same column. The fallbacks now live in `DEFAULT_AI_COMMENTARY_SETTINGS`, once.
 */

export interface AICommentarySettings {
  /** How many training sessions a free user may keep. */
  maxFreeSessions: number;
  /** How many AI comments a free user may view per day. */
  freeAiDailyLimit: number;
  /** Whether the lifetime offer is switched on at all. */
  lifetimeStatus: boolean;
  /** When the lifetime offer ends; it is only shown before this moment. */
  lifetimePromotionEndDate: string | null;
}

/**
 * What the app assumes for a column that is empty, or when the row cannot be
 * read at all.
 *
 * These are not the configured values, and the difference matters when a read
 * fails: 10 sessions is stricter than what is usually configured, but 50 daily
 * comments is looser, so a failed read gives free users more AI comments rather
 * than fewer. Both are the values the screens used before; changing either is a
 * product decision, not part of moving the query.
 */
export const DEFAULT_AI_COMMENTARY_SETTINGS: AICommentarySettings = {
  maxFreeSessions: 10,
  freeAiDailyLimit: 50,
  lifetimeStatus: false,
  lifetimePromotionEndDate: null,
};

type SettingsRow = Pick<
  Tables<'ai_commentary_settings'>,
  'max_free_sessions' | 'free_ai_daily_limit' | 'lifetime_status' | 'lifetime_promotion_end_date'
>;

/**
 * Fills empty columns from the defaults.
 *
 * `??`, not `||`: a limit of 0 is a real setting -- "no free AI comments" --
 * and must not quietly become the default.
 */
export const toAICommentarySettings = (row: SettingsRow | null): AICommentarySettings => ({
  maxFreeSessions: row?.max_free_sessions ?? DEFAULT_AI_COMMENTARY_SETTINGS.maxFreeSessions,
  freeAiDailyLimit: row?.free_ai_daily_limit ?? DEFAULT_AI_COMMENTARY_SETTINGS.freeAiDailyLimit,
  lifetimeStatus: row?.lifetime_status ?? DEFAULT_AI_COMMENTARY_SETTINGS.lifetimeStatus,
  lifetimePromotionEndDate:
    row?.lifetime_promotion_end_date ?? DEFAULT_AI_COMMENTARY_SETTINGS.lifetimePromotionEndDate,
});

/**
 * Reads the settings row. A missing row reads as all defaults; a failed read
 * throws, so a caller can tell the two apart.
 */
export const fetchAICommentarySettings = async (): Promise<AICommentarySettings> => {
  const { data, error } = await supabase
    .from('ai_commentary_settings')
    .select('max_free_sessions, free_ai_daily_limit, lifetime_status, lifetime_promotion_end_date')
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  return toAICommentarySettings(data);
};

/**
 * Whether the lifetime offer should be shown now: switched on, with an end date,
 * and that end date still ahead. An offer switched on without an end date is not
 * shown, rather than shown forever.
 */
export const isLifetimePromotionActive = (settings: AICommentarySettings, now: Date): boolean => {
  if (!settings.lifetimeStatus || !settings.lifetimePromotionEndDate) return false;

  return now < new Date(settings.lifetimePromotionEndDate);
};

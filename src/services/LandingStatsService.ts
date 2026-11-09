import { supabase } from '@/integrations/supabase/client';

export interface LandingStats {
  users: number;
  questions: number;
}

/**
 * Totals for the landing page: registered users and uploaded questions.
 * `public_landing_stats()` is a SECURITY DEFINER function that returns only these two
 * counts, so visitors without an account may call it; nothing else leaves the database.
 */
export async function fetchLandingStats(): Promise<LandingStats | null> {
  const { data, error } = await supabase.rpc('public_landing_stats');
  if (error || !data) return null;
  const row = data as { users?: number; questions?: number };
  if (typeof row.users !== 'number' || typeof row.questions !== 'number') return null;
  return { users: row.users, questions: row.questions };
}

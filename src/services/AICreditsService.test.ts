import { beforeEach, describe, expect, it, vi } from 'vitest';
import { queriesFor, queueResponse, resetSupabaseDouble } from '@/test/supabaseDouble';

vi.mock('@/integrations/supabase/client', async () => ({
  supabase: (await import('@/test/supabaseDouble')).supabaseDouble,
}));

import { fetchPrivateAiCreditsRemaining, fetchPrivateAiUsedLast30Days } from './AICreditsService';

beforeEach(resetSupabaseDouble);

describe.each([
  ['fetchPrivateAiUsedLast30Days', fetchPrivateAiUsedLast30Days, 'ai_private_full_used_30d'],
  [
    'fetchPrivateAiCreditsRemaining',
    fetchPrivateAiCreditsRemaining,
    'ai_private_credits_remaining',
  ],
] as const)('%s', (_name, fetch, fn) => {
  it(`asks ${fn} about the given user`, async () => {
    queueResponse(fn, { data: 7 });

    expect(await fetch('user-1')).toBe(7);
    expect(queriesFor(fn)[0].ops).toEqual([{ method: 'rpc', args: [{ p_user_id: 'user-1' }] }]);
  });

  it('reads no answer as zero', async () => {
    queueResponse(fn, { data: null });

    expect(await fetch('user-1')).toBe(0);
  });

  it('throws on a failed call rather than reporting zero', async () => {
    // Zero used would show the whole free quota as available.
    queueResponse(fn, { error: { message: 'boom' } });

    await expect(fetch('user-1')).rejects.toEqual({ message: 'boom' });
  });
});

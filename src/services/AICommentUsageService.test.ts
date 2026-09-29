import { beforeEach, describe, expect, it, vi } from 'vitest';
import { queriesFor, queueResponse, resetSupabaseDouble } from '@/test/supabaseDouble';

vi.mock('@/integrations/supabase/client', async () => ({
  supabase: (await import('@/test/supabaseDouble')).supabaseDouble,
}));

import { fetchDailyUsage, incrementDailyUsage, usageDate } from './AICommentUsageService';

beforeEach(resetSupabaseDouble);

describe('usageDate', () => {
  it('files usage under the UTC day, not the local one', () => {
    // 01:30 on 2 October in Berlin is still 1 October in UTC: the free
    // allowance has not started over yet.
    expect(usageDate(new Date('2026-10-02T01:30:00+02:00'))).toBe('2026-10-01');
    expect(usageDate(new Date('2026-10-02T02:30:00+02:00'))).toBe('2026-10-02');
  });
});

describe('fetchDailyUsage', () => {
  it("reads the user's count for the day", async () => {
    queueResponse('user_ai_comment_usage', { data: { usage_count: 12 } });

    expect(await fetchDailyUsage('user-1', '2026-09-29')).toBe(12);

    const [query] = queriesFor('user_ai_comment_usage');
    expect(query.ops).toContainEqual({ method: 'eq', args: ['user_id', 'user-1'] });
    expect(query.ops).toContainEqual({ method: 'eq', args: ['date', '2026-09-29'] });
  });

  it('reads a day without a row as nothing used yet', async () => {
    queueResponse('user_ai_comment_usage', { data: null });

    expect(await fetchDailyUsage('user-1', '2026-09-29')).toBe(0);
  });

  it('throws on a failed read rather than reporting nothing used', async () => {
    queueResponse('user_ai_comment_usage', { error: { message: 'boom' } });

    await expect(fetchDailyUsage('user-1', '2026-09-29')).rejects.toEqual({ message: 'boom' });
  });
});

describe('incrementDailyUsage', () => {
  it('counts in the database and returns the count it reports', async () => {
    // The count comes back from the one statement that raised it, so a view
    // counted in another tab meanwhile is included.
    queueResponse('increment_ai_comment_usage', { data: 13 });

    expect(await incrementDailyUsage('2026-02-14')).toBe(13);
    expect(queriesFor('increment_ai_comment_usage')[0].ops).toEqual([
      { method: 'rpc', args: [{ p_date: '2026-02-14' }] },
    ]);
  });

  it('does not read the count first', async () => {
    // Reading and then writing count + 1 is the race this replaced: two tabs
    // read the same count and both write it plus one.
    queueResponse('increment_ai_comment_usage', { data: 1 });

    await incrementDailyUsage('2026-02-14');

    expect(queriesFor('user_ai_comment_usage')).toHaveLength(0);
  });

  it('throws when the database refuses the count', async () => {
    queueResponse('increment_ai_comment_usage', { error: { message: 'boom' } });

    await expect(incrementDailyUsage('2026-02-14')).rejects.toEqual({ message: 'boom' });
  });
});

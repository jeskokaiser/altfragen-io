import { beforeEach, describe, expect, it, vi } from 'vitest';
import { payloadOf, queriesFor, queueResponse, resetSupabaseDouble } from '@/test/supabaseDouble';

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
  it("writes one more than the day's count and returns it", async () => {
    queueResponse('user_ai_comment_usage', { data: { usage_count: 12 } });

    expect(await incrementDailyUsage('user-1', '2026-09-29')).toBe(13);

    const [, write] = queriesFor('user_ai_comment_usage');
    expect(payloadOf(write, 'upsert')).toEqual({
      user_id: 'user-1',
      date: '2026-09-29',
      usage_count: 13,
    });
    expect(write.ops.find((op) => op.method === 'upsert')?.args[1]).toEqual({
      onConflict: 'user_id,date',
    });
  });

  it('starts the day at 1', async () => {
    queueResponse('user_ai_comment_usage', { data: null });

    expect(await incrementDailyUsage('user-1', '2026-09-29')).toBe(1);
  });

  it('writes nothing when the count cannot be read', async () => {
    queueResponse('user_ai_comment_usage', { error: { message: 'boom' } });

    await expect(incrementDailyUsage('user-1', '2026-09-29')).rejects.toEqual({ message: 'boom' });
    expect(queriesFor('user_ai_comment_usage')).toHaveLength(1);
  });

  it('throws when the new count cannot be written', async () => {
    queueResponse('user_ai_comment_usage', { data: { usage_count: 12 } });
    queueResponse('user_ai_comment_usage', { error: { message: 'boom' } });

    await expect(incrementDailyUsage('user-1', '2026-09-29')).rejects.toEqual({ message: 'boom' });
  });
});

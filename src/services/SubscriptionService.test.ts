import { beforeEach, describe, expect, it, vi } from 'vitest';
import { queriesFor, queueResponse, resetSupabaseDouble } from '@/test/supabaseDouble';

vi.mock('@/integrations/supabase/client', async () => ({
  supabase: (await import('@/test/supabaseDouble')).supabaseDouble,
}));

import { NOT_SUBSCRIBED, fetchSubscriptionStatus } from './SubscriptionService';

beforeEach(resetSupabaseDouble);

describe('fetchSubscriptionStatus', () => {
  it("reads the user's subscriber row by user id", async () => {
    queueResponse('subscribers', {
      data: { subscribed: true, subscription_tier: 'Lifetime', subscription_end: null },
    });

    expect(await fetchSubscriptionStatus('user-1')).toEqual({
      subscribed: true,
      subscriptionTier: 'Lifetime',
      subscriptionEnd: null,
    });
    expect(queriesFor('subscribers')[0].ops).toContainEqual({
      method: 'eq',
      args: ['user_id', 'user-1'],
    });
  });

  it('does not also ask by email, which RLS makes pointless', async () => {
    // RLS lets a user read only rows with their own user_id. An `or` on the
    // email could never find anything more, and put the email into a filter
    // string for nothing.
    await fetchSubscriptionStatus('user-1');

    expect(queriesFor('subscribers')[0].ops.map((op) => op.method)).not.toContain('or');
  });

  it('keeps the end date of a running subscription', async () => {
    queueResponse('subscribers', {
      data: {
        subscribed: true,
        subscription_tier: 'Premium',
        subscription_end: '2026-10-28T09:00:00+00:00',
      },
    });

    expect((await fetchSubscriptionStatus('user-1')).subscriptionEnd).toBe(
      '2026-10-28T09:00:00+00:00',
    );
  });

  it('reads a user without a subscriber row as not subscribed', async () => {
    queueResponse('subscribers', { data: null });

    expect(await fetchSubscriptionStatus('user-1')).toEqual(NOT_SUBSCRIBED);
  });

  it('reads an empty tier as no tier', async () => {
    queueResponse('subscribers', {
      data: { subscribed: false, subscription_tier: '', subscription_end: null },
    });

    expect((await fetchSubscriptionStatus('user-1')).subscriptionTier).toBeNull();
  });

  it("throws an Error with the database's message, so the toast can show it", async () => {
    // PostgREST hands back a plain object. Thrown as is, it would fail the
    // context's `instanceof Error` and the toast would say "Unknown error
    // occurred" instead.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    queueResponse('subscribers', { error: { message: 'permission denied', code: '42501' } });

    const failure = await fetchSubscriptionStatus('user-1').catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).message).toBe('permission denied');
    consoleError.mockRestore();
  });

  it('names the failure when the database gives no message', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    queueResponse('subscribers', { error: { message: '' } });

    await expect(fetchSubscriptionStatus('user-1')).rejects.toThrow('Failed to check subscription');
    consoleError.mockRestore();
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { queriesFor, queueResponse, resetSupabaseDouble } from '@/test/supabaseDouble';

vi.mock('@/integrations/supabase/client', async () => ({
  supabase: (await import('@/test/supabaseDouble')).supabaseDouble,
}));

import {
  DEFAULT_AI_COMMENTARY_SETTINGS,
  fetchAICommentarySettings,
  isLifetimePromotionActive,
  toAICommentarySettings,
} from './AICommentarySettingsService';

const configuredRow = {
  max_free_sessions: 20,
  free_ai_daily_limit: 30,
  lifetime_status: true,
  lifetime_promotion_end_date: '2026-12-10T22:59:59Z',
};

beforeEach(resetSupabaseDouble);

describe('toAICommentarySettings', () => {
  it('maps a fully configured row', () => {
    expect(toAICommentarySettings(configuredRow)).toEqual({
      maxFreeSessions: 20,
      freeAiDailyLimit: 30,
      lifetimeStatus: true,
      lifetimePromotionEndDate: '2026-12-10T22:59:59Z',
    });
  });

  it('reads a missing row as all defaults', () => {
    expect(toAICommentarySettings(null)).toEqual(DEFAULT_AI_COMMENTARY_SETTINGS);
  });

  it('fills each empty column from the defaults on its own', () => {
    const settings = toAICommentarySettings({ ...configuredRow, max_free_sessions: null });

    expect(settings.maxFreeSessions).toBe(DEFAULT_AI_COMMENTARY_SETTINGS.maxFreeSessions);
    expect(settings.freeAiDailyLimit).toBe(30);
  });

  it('honours a limit of 0 instead of replacing it with the default', () => {
    // 0 means "no free AI comments". With `||` it silently became 50, so an
    // admin could not switch the free allowance off.
    const settings = toAICommentarySettings({ ...configuredRow, free_ai_daily_limit: 0 });

    expect(settings.freeAiDailyLimit).toBe(0);
  });

  it('uses one session-limit default everywhere', () => {
    // The session list fell back to 10 and the exam list to 5 for the same
    // column. There is one default now, and it is pinned here.
    expect(DEFAULT_AI_COMMENTARY_SETTINGS.maxFreeSessions).toBe(10);
  });
});

describe('fetchAICommentarySettings', () => {
  it('reads the single settings row', async () => {
    queueResponse('ai_commentary_settings', { data: configuredRow });

    expect((await fetchAICommentarySettings()).maxFreeSessions).toBe(20);
    expect(queriesFor('ai_commentary_settings')[0].ops).toContainEqual({
      method: 'limit',
      args: [1],
    });
  });

  it('falls back to the defaults when the table is empty', async () => {
    queueResponse('ai_commentary_settings', { data: null });

    expect(await fetchAICommentarySettings()).toEqual(DEFAULT_AI_COMMENTARY_SETTINGS);
  });

  it('throws on a failed read rather than passing off defaults as the settings', async () => {
    queueResponse('ai_commentary_settings', { error: { message: 'boom' } });

    await expect(fetchAICommentarySettings()).rejects.toEqual({ message: 'boom' });
  });
});

describe('isLifetimePromotionActive', () => {
  const before = new Date('2026-09-23T12:00:00Z');
  const after = new Date('2026-12-11T00:00:00Z');
  const on = toAICommentarySettings(configuredRow);

  it('shows the offer while it is on and has not ended', () => {
    expect(isLifetimePromotionActive(on, before)).toBe(true);
  });

  it('hides the offer once the end date has passed', () => {
    expect(isLifetimePromotionActive(on, after)).toBe(false);
  });

  it('hides the offer at the exact end moment', () => {
    expect(isLifetimePromotionActive(on, new Date('2026-12-10T22:59:59Z'))).toBe(false);
  });

  it('hides the offer when it is switched off, whatever the date', () => {
    expect(isLifetimePromotionActive({ ...on, lifetimeStatus: false }, before)).toBe(false);
  });

  it('hides an offer switched on without an end date, rather than showing it forever', () => {
    expect(isLifetimePromotionActive({ ...on, lifetimePromotionEndDate: null }, before)).toBe(
      false,
    );
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { payloadOf, queriesFor, queueResponse, resetSupabaseDouble } from '@/test/supabaseDouble';

vi.mock('@/integrations/supabase/client', async () => ({
  supabase: (await import('@/test/supabaseDouble')).supabaseDouble,
}));

import {
  fetchIsAdmin,
  fetchIsPremium,
  fetchUserProfile,
  setEmailVerified,
  setMarketingConsent,
} from './ProfileService';

const USER = 'user-1';

beforeEach(resetSupabaseDouble);

describe('fetchUserProfile', () => {
  it('maps the columns the app reads on sign-in', async () => {
    queueResponse('profiles', {
      data: { university_id: 'uni-1', is_email_verified: true, username: 'mia' },
    });

    expect(await fetchUserProfile(USER)).toEqual({
      universityId: 'uni-1',
      isEmailVerified: true,
      username: 'mia',
    });
  });

  it('reads a profile with nothing filled in as unverified and nameless', async () => {
    queueResponse('profiles', {
      data: { university_id: null, is_email_verified: null, username: null },
    });

    expect(await fetchUserProfile(USER)).toEqual({
      universityId: null,
      isEmailVerified: false,
      username: null,
    });
  });

  it('treats an empty username as none', async () => {
    // Otherwise the UI would show a blank name instead of falling back.
    queueResponse('profiles', {
      data: { university_id: null, is_email_verified: true, username: '' },
    });

    expect((await fetchUserProfile(USER)).username).toBeNull();
  });

  it('throws when the profile cannot be read', async () => {
    // A session without a profile is unusable, so this must not look like an
    // empty profile.
    queueResponse('profiles', { error: { message: 'boom' } });

    await expect(fetchUserProfile(USER)).rejects.toEqual({ message: 'boom' });
  });
});

describe('fetchIsAdmin', () => {
  it('reports an admin', async () => {
    queueResponse('profiles', { data: { is_admin: true } });

    expect(await fetchIsAdmin(USER)).toBe(true);
  });

  it('treats an unset flag as not an admin', async () => {
    queueResponse('profiles', { data: { is_admin: null } });

    expect(await fetchIsAdmin(USER)).toBe(false);
  });

  it('throws rather than reporting false when the check fails', async () => {
    // "Not an admin" and "could not tell" are different; the caller decides.
    queueResponse('profiles', { error: { message: 'boom' } });

    await expect(fetchIsAdmin(USER)).rejects.toEqual({ message: 'boom' });
  });
});

describe('fetchIsPremium', () => {
  it('treats an unset flag as not premium', async () => {
    queueResponse('profiles', { data: { is_premium: null } });

    expect(await fetchIsPremium(USER)).toBe(false);
  });

  it('reports premium', async () => {
    queueResponse('profiles', { data: { is_premium: true } });

    expect(await fetchIsPremium(USER)).toBe(true);
  });
});

describe('setEmailVerified', () => {
  it('writes the flag for that user alone', async () => {
    queueResponse('profiles', { data: null });

    await setEmailVerified(USER, true);

    const [query] = queriesFor('profiles');
    expect(payloadOf(query, 'update')).toEqual({ is_email_verified: true });
    expect(query.ops).toContainEqual({ method: 'eq', args: ['id', USER] });
  });

  it('throws on failure so the caller can decide', async () => {
    queueResponse('profiles', { error: { message: 'boom' } });

    await expect(setEmailVerified(USER, true)).rejects.toEqual({ message: 'boom' });
  });
});

describe('setMarketingConsent', () => {
  it('records when consent was given, not just that it was', async () => {
    queueResponse('profiles', { data: null });

    await setMarketingConsent(USER, true);

    const payload = payloadOf(queriesFor('profiles')[0], 'update');
    expect(payload.marketing_consent).toBe(true);
    expect(Date.parse(payload.marketing_consent_at as string)).not.toBeNaN();
  });

  it('clears the timestamp when consent is declined', async () => {
    // A declined consent with a date on it would read as consent given.
    queueResponse('profiles', { data: null });

    await setMarketingConsent(USER, false);

    expect(payloadOf(queriesFor('profiles')[0], 'update')).toEqual({
      marketing_consent: false,
      marketing_consent_at: null,
    });
  });
});

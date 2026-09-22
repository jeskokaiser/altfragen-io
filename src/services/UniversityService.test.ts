import { beforeEach, describe, expect, it, vi } from 'vitest';
import { queriesFor, queueResponse, resetSupabaseDouble } from '@/test/supabaseDouble';

vi.mock('@/integrations/supabase/client', async () => ({
  supabase: (await import('@/test/supabaseDouble')).supabaseDouble,
}));

import {
  fetchUniversities,
  fetchUniversityName,
  findUniversityByEmailDomain,
} from './UniversityService';

beforeEach(resetSupabaseDouble);

describe('fetchUniversityName', () => {
  it('returns the name', async () => {
    queueResponse('universities', { data: { name: 'Charité' } });

    expect(await fetchUniversityName('uni-1')).toBe('Charité');
  });

  it('throws when the university cannot be read', async () => {
    queueResponse('universities', { error: { message: 'boom' } });

    await expect(fetchUniversityName('uni-1')).rejects.toEqual({ message: 'boom' });
  });
});

describe('findUniversityByEmailDomain', () => {
  it('finds the university that owns the domain', async () => {
    queueResponse('universities', { data: [{ id: 'uni-1', name: 'Charité' }] });

    expect(await findUniversityByEmailDomain('charite.de')).toEqual({
      id: 'uni-1',
      name: 'Charité',
    });
  });

  it('reports no university when the domain is unknown', async () => {
    queueResponse('universities', { data: [] });

    expect(await findUniversityByEmailDomain('gmail.com')).toBeNull();
  });

  it('matches the domain exactly, never as a suffix', async () => {
    // A suffix match once placed people at look-alike domains into a
    // university, and with it into that university's shared questions. The
    // filter must stay an equality.
    queueResponse('universities', { data: [] });

    await findUniversityByEmailDomain('charite.de');

    const [query] = queriesFor('universities');
    expect(query.ops).toContainEqual({ method: 'eq', args: ['email_domain', 'charite.de'] });
    expect(query.ops.map((op) => op.method)).not.toContain('like');
    expect(query.ops.map((op) => op.method)).not.toContain('ilike');
  });
});

describe('fetchUniversities', () => {
  it('returns them ordered by name for the picker', async () => {
    queueResponse('universities', {
      data: [
        { id: 'uni-1', name: 'Charité' },
        { id: 'uni-2', name: 'LMU' },
      ],
    });

    const universities = await fetchUniversities();

    expect(universities).toHaveLength(2);
    expect(queriesFor('universities')[0].ops).toContainEqual({ method: 'order', args: ['name'] });
  });

  it('returns an empty list rather than null when there are none', async () => {
    queueResponse('universities', { data: null });

    expect(await fetchUniversities()).toEqual([]);
  });
});

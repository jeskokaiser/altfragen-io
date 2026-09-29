import { beforeEach, describe, expect, it, vi } from 'vitest';
import { queriesFor, queueResponse, resetSupabaseDouble } from '@/test/supabaseDouble';

vi.mock('@/integrations/supabase/client', async () => ({
  supabase: (await import('@/test/supabaseDouble')).supabaseDouble,
}));

import { fetchAllQuestions } from './DatabaseService';

const row = (id: string) => ({ id, question: `Frage ${id}`, subject: 'Anatomie' });

beforeEach(resetSupabaseDouble);

describe('fetchAllQuestions', () => {
  it("reads only the user's own questions without a university", async () => {
    queueResponse('questions', { data: [row('own')], count: 1 });

    const questions = await fetchAllQuestions('user-1', null);

    expect(questions.map((question) => question.id)).toEqual(['own']);
    expect(queriesFor('questions')).toHaveLength(1);
    expect(queriesFor('questions')[0].ops).toContainEqual({
      method: 'eq',
      args: ['user_id', 'user-1'],
    });
  });

  it("adds the university's and the public questions, leaving out the user's own", async () => {
    queueResponse('questions', { data: [row('own')], count: 1 });
    queueResponse('questions', { data: [row('uni')], count: 1 });
    queueResponse('questions', { data: [row('pub')], count: 1 });

    const questions = await fetchAllQuestions('user-1', 'uni-1');

    expect(questions.map((question) => question.id)).toEqual(['own', 'uni', 'pub']);
    const [, university, publicRead] = queriesFor('questions');
    expect(university.ops).toContainEqual({ method: 'eq', args: ['university_id', 'uni-1'] });
    expect(university.ops).toContainEqual({ method: 'eq', args: ['visibility', 'university'] });
    expect(university.ops).toContainEqual({ method: 'neq', args: ['user_id', 'user-1'] });
    expect(publicRead.ops).toContainEqual({ method: 'eq', args: ['visibility', 'public'] });
    expect(publicRead.ops).toContainEqual({ method: 'is', args: ['university_id', null] });
    expect(publicRead.ops).toContainEqual({ method: 'neq', args: ['user_id', 'user-1'] });
  });

  it("keeps reading a university's questions past the API row cap", async () => {
    // One university shares more questions than one response holds; the
    // first response is capped at 2 rows here and says 3 exist.
    queueResponse('questions', { data: [], count: 0 });
    queueResponse('questions', { data: [row('u1'), row('u2')], count: 3 });
    queueResponse('questions', { data: [row('u3')], count: 3 });
    queueResponse('questions', { data: [], count: 0 });

    const questions = await fetchAllQuestions('user-1', 'uni-1');

    expect(questions.map((question) => question.id)).toEqual(['u1', 'u2', 'u3']);
    const universityPages = queriesFor('questions').slice(1, 3);
    universityPages.forEach(({ ops }) => {
      // A unique order, or rows repeat or go missing between pages.
      expect(ops).toContainEqual({ method: 'order', args: ['created_at', { ascending: false }] });
      expect(ops).toContainEqual({ method: 'order', args: ['id'] });
      expect(ops).toContainEqual({ method: 'eq', args: ['university_id', 'uni-1'] });
    });
    expect(universityPages[1].ops).toContainEqual({ method: 'range', args: [2, 3] });
  });

  it('throws when a read fails rather than showing part of the questions', async () => {
    queueResponse('questions', { data: [row('own')], count: 1 });
    queueResponse('questions', { error: { message: 'boom' } });

    await expect(fetchAllQuestions('user-1', 'uni-1')).rejects.toEqual({ message: 'boom' });
  });
});

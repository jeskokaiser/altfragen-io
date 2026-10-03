import { beforeEach, describe, expect, it, vi } from 'vitest';
import { payloadOf, queriesFor, queueResponse, resetSupabaseDouble } from '@/test/supabaseDouble';

vi.mock('@/integrations/supabase/client', async () => ({
  supabase: (await import('@/test/supabaseDouble')).supabaseDouble,
}));

import { fetchAllQuestions, fetchQuestionsByFilename, updateQuestion } from './DatabaseService';

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

describe('updateQuestion', () => {
  const updatedRow = {
    id: 'q1',
    question: 'Neu',
    option_a: 'A',
    subject: 'Anatomie',
    visibility: 'university',
    question_case: 4,
    case_text: 'Fall 4',
  };

  it('writes the given fields under their column names, and only those', async () => {
    queueResponse('questions', { data: updatedRow });

    await updateQuestion('q1', {
      question: 'Neu',
      optionA: 'A',
      correctAnswer: 'B',
      difficulty: 2,
      show_image_after_answer: true,
      image_key: null,
    });

    const [query] = queriesFor('questions');
    expect(payloadOf(query, 'update')).toEqual({
      question: 'Neu',
      option_a: 'A',
      correct_answer: 'B',
      difficulty: 2,
      show_image_after_answer: true,
      image_key: null,
    });
    expect(query.ops).toContainEqual({ method: 'eq', args: ['id', 'q1'] });
  });

  it("shares a question with the editor's university, university_id included", async () => {
    queueResponse('questions', { data: updatedRow });

    await updateQuestion('q1', { visibility: 'university' }, 'uni-1');

    expect(payloadOf(queriesFor('questions')[0], 'update')).toEqual({
      visibility: 'university',
      university_id: 'uni-1',
    });
  });

  it.each(['private', 'public'] as const)(
    'clears university_id when a question becomes %s',
    async (visibility) => {
      // A public question with a university_id is left out of every public list;
      // RLS does not stop it being stored.
      queueResponse('questions', { data: updatedRow });

      await updateQuestion('q1', { visibility }, 'uni-1');

      expect(payloadOf(queriesFor('questions')[0], 'update')).toEqual({
        visibility,
        university_id: null,
      });
    },
  );

  it('refuses to share with a university without one, before writing anything', async () => {
    // The question this left behind is shared with no one: one exists.
    await expect(updateQuestion('q1', { visibility: 'university' }, null)).rejects.toThrow(
      'university',
    );
    expect(queriesFor('questions')).toHaveLength(0);
  });

  it('leaves university_id alone when the visibility is not part of the change', async () => {
    // An admin editing another university's question must not move it.
    queueResponse('questions', { data: updatedRow });

    await updateQuestion('q1', { question: 'Neu' }, 'uni-admin');

    expect(payloadOf(queriesFor('questions')[0], 'update')).toEqual({ question: 'Neu' });
  });

  it('writes semester, year and exam name to their exam_ columns', async () => {
    // What the upload review saves for every question.
    queueResponse('questions', { data: updatedRow });

    await updateQuestion('q1', { semester: 'WS', year: '2025', exam_name: 'Anatomie' });

    expect(payloadOf(queriesFor('questions')[0], 'update')).toEqual({
      exam_semester: 'WS',
      exam_year: '2025',
      exam_name: 'Anatomie',
    });
  });

  it('writes a cleared semester as null rather than leaving it out', async () => {
    queueResponse('questions', { data: updatedRow });

    await updateQuestion('q1', { semester: null, year: null });

    expect(payloadOf(queriesFor('questions')[0], 'update')).toEqual({
      exam_semester: null,
      exam_year: null,
    });
  });

  it('returns the stored row through the shared mapper, case text included', async () => {
    // The question editor used to map the row by hand and dropped the case.
    queueResponse('questions', { data: updatedRow });

    const question = await updateQuestion('q1', { question: 'Neu' });

    expect(question).toMatchObject({
      id: 'q1',
      question: 'Neu',
      optionA: 'A',
      visibility: 'university',
      question_case: 4,
      case_text: 'Fall 4',
    });
  });

  it('throws on a failed write', async () => {
    queueResponse('questions', { error: { message: 'boom' } });

    await expect(updateQuestion('q1', { question: 'Neu' })).rejects.toEqual({ message: 'boom' });
  });
});

describe('fetchQuestionsByFilename', () => {
  it("reads the user's questions from one file, in upload order, mapped", async () => {
    queueResponse('questions', {
      data: [{ id: 'q1', question: 'Frage', exam_semester: 'SS', exam_year: '2024' }],
    });

    const [question] = await fetchQuestionsByFilename('Anatomie.pdf', 'user-1');

    const { ops } = queriesFor('questions')[0];
    expect(ops).toContainEqual({ method: 'eq', args: ['user_id', 'user-1'] });
    expect(ops).toContainEqual({ method: 'eq', args: ['filename', 'Anatomie.pdf'] });
    expect(ops).toContainEqual({ method: 'order', args: ['created_at', { ascending: true }] });
    expect(question).toMatchObject({ id: 'q1', semester: 'SS', year: '2024' });
  });

  it('throws on a failed read', async () => {
    queueResponse('questions', { error: { message: 'boom' } });

    await expect(fetchQuestionsByFilename('Anatomie.pdf', 'user-1')).rejects.toEqual({
      message: 'boom',
    });
  });
});

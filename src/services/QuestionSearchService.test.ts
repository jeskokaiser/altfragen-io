import { beforeEach, describe, expect, it, vi } from 'vitest';
import { queriesFor, queueResponse, resetSupabaseDouble } from '@/test/supabaseDouble';

vi.mock('@/integrations/supabase/client', async () => ({
  supabase: (await import('@/test/supabaseDouble')).supabaseDouble,
}));

import { listQuestionExamNames, listQuestionSubjects } from './QuestionSearchService';

beforeEach(resetSupabaseDouble);

describe('listQuestionSubjects', () => {
  it('asks the database function, not the questions table', async () => {
    await listQuestionSubjects();

    expect(queriesFor('list_question_subjects')).toHaveLength(1);
    expect(queriesFor('questions')).toHaveLength(0);
  });

  it('sorts the subjects the German way', async () => {
    queueResponse('list_question_subjects', {
      data: ['Zahnmedizin', 'Ökologie', 'anatomie', 'Biochemie'],
    });

    // Umlauts sort with their base letter, and case does not split the list.
    expect(await listQuestionSubjects()).toEqual([
      'anatomie',
      'Biochemie',
      'Ökologie',
      'Zahnmedizin',
    ]);
  });

  it('keeps the empty subject, which the picker shows as unknown', async () => {
    queueResponse('list_question_subjects', { data: ['Anatomie', ''] });

    expect(await listQuestionSubjects()).toEqual(['', 'Anatomie']);
  });

  it('returns no subjects for a user who can read no questions', async () => {
    queueResponse('list_question_subjects', { data: [] });

    expect(await listQuestionSubjects()).toEqual([]);
  });

  it('throws on a failed call', async () => {
    queueResponse('list_question_subjects', { error: { message: 'boom' } });

    await expect(listQuestionSubjects()).rejects.toEqual({ message: 'boom' });
  });
});

describe('listQuestionExamNames', () => {
  it('asks the database function, not the questions table', async () => {
    await listQuestionExamNames();

    expect(queriesFor('list_question_exam_names')).toHaveLength(1);
    expect(queriesFor('questions')).toHaveLength(0);
  });

  it('sorts as the admin editor always did, by code unit', async () => {
    queueResponse('list_question_exam_names', { data: ['Physiologie', 'Anatomie', 'anatomie'] });

    expect(await listQuestionExamNames()).toEqual(['Anatomie', 'Physiologie', 'anatomie']);
  });

  it('leaves out an empty name, as the editor did', async () => {
    queueResponse('list_question_exam_names', { data: ['', 'Anatomie'] });

    expect(await listQuestionExamNames()).toEqual(['Anatomie']);
  });

  it('throws on a failed call', async () => {
    queueResponse('list_question_exam_names', { error: { message: 'boom' } });

    await expect(listQuestionExamNames()).rejects.toEqual({ message: 'boom' });
  });
});

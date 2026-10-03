import { beforeEach, describe, expect, it, vi } from 'vitest';
import { queriesFor, queueResponse, resetSupabaseDouble } from '@/test/supabaseDouble';

vi.mock('@/integrations/supabase/client', async () => ({
  supabase: (await import('@/test/supabaseDouble')).supabaseDouble,
}));

import { listQuestionSubjects } from './QuestionSearchService';

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

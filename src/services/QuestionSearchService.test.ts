import { beforeEach, describe, expect, it, vi } from 'vitest';
import { queriesFor, queueResponse, resetSupabaseDouble } from '@/test/supabaseDouble';

vi.mock('@/integrations/supabase/client', async () => ({
  supabase: (await import('@/test/supabaseDouble')).supabaseDouble,
}));

import {
  listQuestionExamNames,
  listQuestionSubjects,
  suggestExamNames,
} from './QuestionSearchService';

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

describe('suggestExamNames', () => {
  it('searches exam names containing the term, newest questions first, five rows', async () => {
    await suggestExamNames('anat');

    const { ops } = queriesFor('questions')[0];
    expect(ops).toContainEqual({ method: 'ilike', args: ['exam_name', '%anat%'] });
    expect(ops).toContainEqual({ method: 'order', args: ['created_at', { ascending: false }] });
    expect(ops).toContainEqual({ method: 'limit', args: [5] });
  });

  it('deduplicates the names and drops empty ones, keeping the order', async () => {
    queueResponse('questions', {
      data: [
        { exam_name: 'Anatomie II' },
        { exam_name: 'Anatomie I' },
        { exam_name: 'Anatomie II' },
        { exam_name: null },
        { exam_name: '' },
      ],
    });

    expect(await suggestExamNames('anat')).toEqual(['Anatomie II', 'Anatomie I']);
  });

  it('throws on a failed read', async () => {
    queueResponse('questions', { error: { message: 'boom' } });

    await expect(suggestExamNames('anat')).rejects.toEqual({ message: 'boom' });
  });
});

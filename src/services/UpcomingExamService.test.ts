import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  queriesFor,
  queueResponse,
  recordedQueries,
  resetSupabaseDouble,
} from '@/test/supabaseDouble';

vi.mock('@/integrations/supabase/client', async () => ({
  supabase: (await import('@/test/supabaseDouble')).supabaseDouble,
}));

import {
  fetchUpcomingExam,
  fetchUpcomingExamsByIds,
  findUpcomingExamByExamName,
  getExamStatsForUser,
} from './UpcomingExamService';

const exam = (id: string) => ({
  id,
  title: `Exam ${id}`,
  due_date: '2026-10-01',
  description: null,
  subject: null,
  exam_name: null,
  created_by: 'user-1',
  university_id: null,
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
});

beforeEach(resetSupabaseDouble);

describe('fetchUpcomingExamsByIds', () => {
  it('asks for nothing when there are no IDs', async () => {
    // An `in` filter with an empty list is a wasted round trip at best.
    expect(await fetchUpcomingExamsByIds([])).toEqual([]);
    expect(recordedQueries).toHaveLength(0);
  });

  it('fetches exactly the requested exams', async () => {
    queueResponse('upcoming_exams', { data: [exam('e1'), exam('e2')] });

    const exams = await fetchUpcomingExamsByIds(['e1', 'e2']);

    expect(exams.map((found) => found.id)).toEqual(['e1', 'e2']);
    expect(queriesFor('upcoming_exams')[0].ops).toContainEqual({
      method: 'in',
      args: ['id', ['e1', 'e2']],
    });
  });

  it('leaves out an ID that matches no exam', async () => {
    // A session can outlive the exam it was created for.
    queueResponse('upcoming_exams', { data: [exam('e1')] });

    expect(await fetchUpcomingExamsByIds(['e1', 'deleted'])).toHaveLength(1);
  });

  it('throws on a failed read, so the caller decides how to degrade', async () => {
    queueResponse('upcoming_exams', { error: { message: 'boom' } });

    await expect(fetchUpcomingExamsByIds(['e1'])).rejects.toEqual({ message: 'boom' });
  });
});

describe('fetchUpcomingExam', () => {
  it('reads the whole row of one exam', async () => {
    queueResponse('upcoming_exams', { data: exam('e1') });

    expect(await fetchUpcomingExam('e1')).toEqual(exam('e1'));
    const { ops } = queriesFor('upcoming_exams')[0];
    expect(ops).toContainEqual({ method: 'select', args: ['*'] });
    expect(ops).toContainEqual({ method: 'eq', args: ['id', 'e1'] });
  });

  it('returns null for an exam that does not exist or is not the user’s', async () => {
    // `single` would turn a missing row into an error, and the error into
    // retries before the page could say "Prüfung nicht gefunden".
    queueResponse('upcoming_exams', { data: null });

    expect(await fetchUpcomingExam('gone')).toBeNull();
    expect(queriesFor('upcoming_exams')[0].ops.map((op) => op.method)).toContain('maybeSingle');
  });

  it('throws on a failed read', async () => {
    queueResponse('upcoming_exams', { error: { message: 'boom' } });

    await expect(fetchUpcomingExam('e1')).rejects.toEqual({ message: 'boom' });
  });
});

describe('findUpcomingExamByExamName', () => {
  it("looks among the user's own exams for that exam_name", async () => {
    queueResponse('upcoming_exams', {
      data: { id: 'e1', title: 'Exam e1', exam_name: 'Anatomie' },
    });

    const found = await findUpcomingExamByExamName('user-1', 'Anatomie');

    expect(found?.title).toBe('Exam e1');
    const { ops } = queriesFor('upcoming_exams')[0];
    expect(ops).toContainEqual({ method: 'eq', args: ['created_by', 'user-1'] });
    expect(ops).toContainEqual({ method: 'eq', args: ['exam_name', 'Anatomie'] });
  });

  it('returns null when no exam matches', async () => {
    queueResponse('upcoming_exams', { data: null });

    expect(await findUpcomingExamByExamName('user-1', 'Anatomie')).toBeNull();
  });

  it('throws on a failed read', async () => {
    queueResponse('upcoming_exams', { error: { message: 'boom' } });

    await expect(findUpcomingExamByExamName('user-1', 'Anatomie')).rejects.toEqual({
      message: 'boom',
    });
  });
});

describe('getExamStatsForUser', () => {
  const progress = (questionId: string, isCorrect: boolean | null) => ({
    question_id: questionId,
    is_correct: isCorrect,
    updated_at: '2026-09-01T00:00:00Z',
  });

  it("counts the latest result per question from the exam's sessions", async () => {
    queueResponse('upcoming_exams', { data: { exam_name: 'Anatomie, Physiologie' } });
    queueResponse('questions', { data: [{ id: 'q1' }, { id: 'q2' }, { id: 'q3' }, { id: 'q4' }] });
    queueResponse('training_sessions', { data: [{ id: 's1' }, { id: 's2' }] });
    queueResponse('session_question_progress', {
      data: [progress('q1', true), progress('q2', false), progress('q3', null)],
    });

    expect(await getExamStatsForUser('e1', 'user-1')).toEqual({
      total_linked: 4,
      answered: 3,
      correct: 1,
      percent_correct: 33,
    });
    expect(queriesFor('questions')[0].ops).toContainEqual({
      method: 'in',
      args: ['exam_name', ['Anatomie', 'Physiologie']],
    });
    expect(queriesFor('session_question_progress')[0].ops).toContainEqual({
      method: 'in',
      args: ['session_id', ['s1', 's2']],
    });
  });

  it('reports nothing answered when no session was started from the exam', async () => {
    // Progress from other sessions or one-off runs must not count for the exam.
    queueResponse('upcoming_exams', { data: { exam_name: 'Anatomie' } });
    queueResponse('questions', { data: [{ id: 'q1' }] });
    queueResponse('training_sessions', { data: [] });

    expect(await getExamStatsForUser('e1', 'user-1')).toEqual({
      total_linked: 1,
      answered: 0,
      correct: 0,
      percent_correct: 0,
    });
    expect(queriesFor('session_question_progress')).toHaveLength(0);
  });
});

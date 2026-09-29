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

import { TrainingSessionService } from './TrainingSessionService';

const USER = 'user-1';
const EXAM = 'exam-1';

const progressRow = (questionId: string, isCorrect: boolean | null, updatedAt: string) => ({
  question_id: questionId,
  is_correct: isCorrect,
  updated_at: updatedAt,
});

beforeEach(resetSupabaseDouble);

describe('examIdOf', () => {
  it('reads the exam a session was started from', () => {
    expect(TrainingSessionService.examIdOf({ source: 'exam', examId: EXAM })).toBe(EXAM);
  });

  it('ignores an exam ID on a session that was not started from an exam', () => {
    // Filter-built sessions carry the whole form, which is not an exam link.
    expect(TrainingSessionService.examIdOf({ source: 'filters', examId: EXAM })).toBeNull();
  });

  it('returns null for settings of an unexpected shape', () => {
    expect(TrainingSessionService.examIdOf(null)).toBeNull();
    expect(TrainingSessionService.examIdOf('exam')).toBeNull();
    expect(TrainingSessionService.examIdOf({ source: 'exam' })).toBeNull();
    expect(TrainingSessionService.examIdOf({ source: 'exam', examId: 42 })).toBeNull();
  });
});

describe('listForExam', () => {
  it("filters the user's sessions by the exam link in filter_settings", async () => {
    queueResponse('training_sessions', { data: [{ id: 's1' }] });

    const sessions = await TrainingSessionService.listForExam(USER, EXAM);

    expect(sessions.map((session) => session.id)).toEqual(['s1']);
    const { ops } = queriesFor('training_sessions')[0];
    expect(ops).toContainEqual({ method: 'eq', args: ['user_id', USER] });
    expect(ops).toContainEqual({ method: 'eq', args: ['filter_settings->>source', 'exam'] });
    expect(ops).toContainEqual({ method: 'eq', args: ['filter_settings->>examId', EXAM] });
  });

  it('throws on a failed read', async () => {
    queueResponse('training_sessions', { error: { message: 'boom' } });

    await expect(TrainingSessionService.listForExam(USER, EXAM)).rejects.toEqual({
      message: 'boom',
    });
  });
});

describe('listIdsForExam', () => {
  it('selects the IDs alone, filtered like listForExam', async () => {
    queueResponse('training_sessions', { data: [{ id: 's1' }, { id: 's2' }] });

    expect(await TrainingSessionService.listIdsForExam(USER, EXAM)).toEqual(['s1', 's2']);
    const { ops } = queriesFor('training_sessions')[0];
    expect(ops).toContainEqual({ method: 'select', args: ['id'] });
    expect(ops).toContainEqual({ method: 'eq', args: ['user_id', USER] });
    expect(ops).toContainEqual({ method: 'eq', args: ['filter_settings->>source', 'exam'] });
    expect(ops).toContainEqual({ method: 'eq', args: ['filter_settings->>examId', EXAM] });
  });

  it('throws on a failed read', async () => {
    queueResponse('training_sessions', { error: { message: 'boom' } });

    await expect(TrainingSessionService.listIdsForExam(USER, EXAM)).rejects.toEqual({
      message: 'boom',
    });
  });
});

describe('fetchProgress', () => {
  it('asks for nothing without sessions', async () => {
    expect(await TrainingSessionService.fetchProgress(USER, [])).toEqual([]);
    expect(recordedQueries).toHaveLength(0);
  });

  it("maps the user's rows in those sessions", async () => {
    queueResponse('session_question_progress', {
      data: [
        {
          session_id: 's1',
          question_id: 'q1',
          is_correct: null,
          created_at: '2026-01-01T10:00:00Z',
          updated_at: '2026-01-02T10:00:00Z',
        },
      ],
    });

    expect(await TrainingSessionService.fetchProgress(USER, ['s1', 's2'])).toEqual([
      {
        sessionId: 's1',
        questionId: 'q1',
        isCorrect: null,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-02T10:00:00Z',
      },
    ]);
    const { ops } = queriesFor('session_question_progress')[0];
    expect(ops).toContainEqual({ method: 'eq', args: ['user_id', USER] });
    expect(ops).toContainEqual({ method: 'in', args: ['session_id', ['s1', 's2']] });
  });

  it('throws on a failed read', async () => {
    queueResponse('session_question_progress', { error: { message: 'boom' } });

    await expect(TrainingSessionService.fetchProgress(USER, ['s1'])).rejects.toEqual({
      message: 'boom',
    });
  });
});

describe('fetchLatestResults', () => {
  it('asks for nothing without sessions or without questions', async () => {
    // Without sessions there is nothing to find: an exam's statistics must not
    // fall back to progress from other sessions.
    expect((await TrainingSessionService.fetchLatestResults(USER, [], ['q1'])).size).toBe(0);
    expect((await TrainingSessionService.fetchLatestResults(USER, ['s1'], [])).size).toBe(0);
    expect(recordedQueries).toHaveLength(0);
  });

  it("reads the user's rows in these sessions for these questions", async () => {
    await TrainingSessionService.fetchLatestResults(USER, ['s1', 's2'], ['q1']);

    const { ops } = queriesFor('session_question_progress')[0];
    expect(ops).toContainEqual({ method: 'eq', args: ['user_id', USER] });
    expect(ops).toContainEqual({ method: 'in', args: ['session_id', ['s1', 's2']] });
    expect(ops).toContainEqual({ method: 'in', args: ['question_id', ['q1']] });
  });

  it('keeps the most recently updated result of a question answered in several sessions', async () => {
    queueResponse('session_question_progress', {
      data: [
        progressRow('q1', true, '2026-01-01T10:00:00Z'),
        progressRow('q1', false, '2026-01-03T10:00:00Z'),
        progressRow('q1', true, '2026-01-02T10:00:00Z'),
      ],
    });

    const results = await TrainingSessionService.fetchLatestResults(USER, ['s1', 's2'], ['q1']);

    expect(results.get('q1')).toBe(false);
  });

  it('keeps an answer without a result, apart from a question never answered', async () => {
    queueResponse('session_question_progress', {
      data: [progressRow('q1', null, '2026-01-01T10:00:00Z')],
    });

    const results = await TrainingSessionService.fetchLatestResults(USER, ['s1'], ['q1', 'q2']);

    expect(results.has('q1')).toBe(true);
    expect(results.get('q1')).toBeNull();
    expect(results.has('q2')).toBe(false);
  });

  it('splits a long question list into batches of 300 and merges them', async () => {
    const questionIds = Array.from({ length: 650 }, (_, i) => `q${i}`);
    queueResponse('session_question_progress', {
      data: [progressRow('q0', true, '2026-01-01T10:00:00Z')],
    });
    queueResponse('session_question_progress', { data: [] });
    queueResponse('session_question_progress', {
      data: [progressRow('q649', false, '2026-01-01T10:00:00Z')],
    });

    const results = await TrainingSessionService.fetchLatestResults(USER, ['s1'], questionIds);

    const batchSizes = queriesFor('session_question_progress').map(
      ({ ops }) =>
        (ops.find((op) => op.method === 'in' && op.args[0] === 'question_id')?.args[1] as string[])
          .length,
    );
    expect(batchSizes).toEqual([300, 300, 50]);
    expect([...results]).toEqual([
      ['q0', true],
      ['q649', false],
    ]);
  });

  it('keeps the latest result when a question comes back in two batches', async () => {
    // A question ID listed twice can land in two batches.
    const questionIds = [...Array.from({ length: 300 }, (_, i) => `q${i}`), 'q0'];
    queueResponse('session_question_progress', {
      data: [progressRow('q0', false, '2026-01-02T10:00:00Z')],
    });
    queueResponse('session_question_progress', {
      data: [progressRow('q0', true, '2026-01-01T10:00:00Z')],
    });

    const results = await TrainingSessionService.fetchLatestResults(USER, ['s1'], questionIds);

    expect(results.get('q0')).toBe(false);
  });

  it('throws when a batch fails rather than report partial statistics', async () => {
    queueResponse('session_question_progress', { error: { message: 'boom' } });

    await expect(TrainingSessionService.fetchLatestResults(USER, ['s1'], ['q1'])).rejects.toEqual({
      message: 'boom',
    });
  });
});

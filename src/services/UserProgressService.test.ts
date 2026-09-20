import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * A stand-in for the Supabase query builder.
 *
 * The real builder is thenable: awaiting it runs the query. This double keeps
 * the chain, records every call so a spec can assert on the payload that would
 * have been sent, and hands out queued responses per table.
 */
interface SupabaseResult {
  data?: unknown;
  error?: unknown;
}

interface RecordedQuery {
  table: string;
  ops: Array<{ method: string; args: unknown[] }>;
}

const responses = new Map<string, SupabaseResult[]>();
const queries: RecordedQuery[] = [];

const queueResponse = (table: string, result: SupabaseResult) => {
  const existing = responses.get(table) ?? [];
  existing.push(result);
  responses.set(table, existing);
};

const nextResponse = (table: string): SupabaseResult =>
  responses.get(table)?.shift() ?? { data: [], error: null };

const CHAIN_METHODS = [
  'select',
  'eq',
  'in',
  'gte',
  'lte',
  'lt',
  'not',
  'order',
  'update',
  'insert',
  'delete',
] as const;

const createBuilder = (table: string) => {
  const recorded: RecordedQuery = { table, ops: [] };
  queries.push(recorded);

  const settle = () => {
    const { data = null, error = null } = nextResponse(table);
    return Promise.resolve({ data, error });
  };

  const builder: Record<string, unknown> = {
    then: (onFulfilled: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown) =>
      settle().then(onFulfilled, onRejected),
    maybeSingle: (...args: unknown[]) => {
      recorded.ops.push({ method: 'maybeSingle', args });
      return settle();
    },
  };

  CHAIN_METHODS.forEach((method) => {
    builder[method] = (...args: unknown[]) => {
      recorded.ops.push({ method, args });
      return builder;
    };
  });

  return builder;
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (table: string) => createBuilder(table) },
}));

import {
  SOLUTION_VIEWED,
  fetchMergedQuestionProgress,
  fetchProgressActivity,
  fetchTrainingProgressMaps,
  recordAnswerAttempt,
  setUserDifficulty,
} from './UserProgressService';

const USER = 'user-1';

/** The payload a recorded insert or update would have sent. */
const payloadOf = (query: RecordedQuery, method: 'insert' | 'update'): Record<string, unknown> => {
  const op = query.ops.find((candidate) => candidate.method === method);
  if (!op) throw new Error(`no ${method} recorded for ${query.table}`);
  return op.args[0] as Record<string, unknown>;
};

const queriesFor = (table: string) => queries.filter((query) => query.table === table);

beforeEach(() => {
  responses.clear();
  queries.length = 0;
});

describe('fetchMergedQuestionProgress', () => {
  it('leaves questions without progress out of the map', async () => {
    queueResponse('session_question_progress', { data: [] });
    queueResponse('user_progress', { data: [] });

    const merged = await fetchMergedQuestionProgress(USER, ['q1', 'q2']);

    expect(merged.size).toBe(0);
  });

  it('prefers the session row over a newer one-off answer by default', async () => {
    queueResponse('session_question_progress', {
      data: [
        {
          question_id: 'q1',
          is_correct: false,
          attempts_count: 2,
          created_at: '2026-01-01T10:00:00Z',
          updated_at: '2026-01-01T10:00:00Z',
        },
      ],
    });
    queueResponse('user_progress', {
      data: [
        {
          question_id: 'q1',
          is_correct: true,
          attempts_count: 5,
          created_at: '2026-01-02T10:00:00Z',
          updated_at: '2026-01-02T10:00:00Z',
        },
      ],
    });

    const merged = await fetchMergedQuestionProgress(USER, ['q1']);

    expect(merged.get('q1')?.source).toBe('session');
    expect(merged.get('q1')?.isCorrect).toBe(false);
  });

  it("lets the newer one-off answer win under 'latest'", async () => {
    queueResponse('session_question_progress', {
      data: [
        {
          question_id: 'q1',
          is_correct: false,
          attempts_count: 2,
          created_at: '2026-01-01T10:00:00Z',
          updated_at: '2026-01-01T10:00:00Z',
        },
      ],
    });
    queueResponse('user_progress', {
      data: [
        {
          question_id: 'q1',
          is_correct: true,
          attempts_count: 5,
          created_at: '2026-01-02T10:00:00Z',
          updated_at: '2026-01-02T10:00:00Z',
        },
      ],
    });

    const merged = await fetchMergedQuestionProgress(USER, ['q1'], 'latest');

    expect(merged.get('q1')?.source).toBe('user');
    expect(merged.get('q1')?.isCorrect).toBe(true);
  });

  it("breaks a tie towards the session row under 'latest'", async () => {
    const sameMoment = '2026-01-01T10:00:00Z';
    queueResponse('session_question_progress', {
      data: [
        {
          question_id: 'q1',
          is_correct: false,
          attempts_count: 1,
          created_at: sameMoment,
          updated_at: sameMoment,
        },
      ],
    });
    queueResponse('user_progress', {
      data: [
        {
          question_id: 'q1',
          is_correct: true,
          attempts_count: 1,
          created_at: sameMoment,
          updated_at: sameMoment,
        },
      ],
    });

    const merged = await fetchMergedQuestionProgress(USER, ['q1'], 'latest');

    expect(merged.get('q1')?.source).toBe('session');
  });

  it('keeps the most recent row when a question was answered in several sessions', async () => {
    queueResponse('session_question_progress', {
      data: [
        {
          question_id: 'q1',
          is_correct: false,
          attempts_count: 1,
          created_at: '2026-01-01T10:00:00Z',
          updated_at: '2026-01-01T10:00:00Z',
        },
        {
          question_id: 'q1',
          is_correct: true,
          attempts_count: 3,
          created_at: '2026-01-05T10:00:00Z',
          updated_at: '2026-01-05T10:00:00Z',
        },
      ],
    });

    const merged = await fetchMergedQuestionProgress(USER, ['q1']);

    expect(merged.get('q1')?.isCorrect).toBe(true);
    expect(merged.get('q1')?.attemptsCount).toBe(3);
  });

  it('falls back to the one-off answer when the question has no session row', async () => {
    queueResponse('session_question_progress', { data: [] });
    queueResponse('user_progress', {
      data: [
        {
          question_id: 'q2',
          is_correct: true,
          attempts_count: 1,
          created_at: '2026-01-02T10:00:00Z',
          updated_at: null,
        },
      ],
    });

    const merged = await fetchMergedQuestionProgress(USER, ['q1', 'q2']);

    expect(merged.get('q2')?.source).toBe('user');
  });

  it('drops rows whose question was deleted', async () => {
    queueResponse('session_question_progress', { data: [] });
    queueResponse('user_progress', {
      data: [
        {
          question_id: null,
          is_correct: true,
          attempts_count: 1,
          created_at: '2026-01-02T10:00:00Z',
          updated_at: null,
        },
      ],
    });

    const merged = await fetchMergedQuestionProgress(USER, ['q1']);

    expect(merged.size).toBe(0);
  });

  it('splits long question lists so the request URL stays short', async () => {
    const questionIds = Array.from({ length: 701 }, (_, index) => `q${index}`);

    await fetchMergedQuestionProgress(USER, questionIds);

    // 701 ids at a batch size of 300 means three round trips per table.
    expect(queriesFor('user_progress')).toHaveLength(3);
    expect(queriesFor('session_question_progress')).toHaveLength(3);
  });

  it('logs a failing batch and carries on with what it has', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    queueResponse('session_question_progress', { error: { message: 'boom' } });
    queueResponse('user_progress', {
      data: [
        {
          question_id: 'q1',
          is_correct: true,
          attempts_count: 1,
          created_at: '2026-01-02T10:00:00Z',
          updated_at: null,
        },
      ],
    });

    const merged = await fetchMergedQuestionProgress(USER, ['q1']);

    expect(merged.get('q1')?.source).toBe('user');
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('asks for nothing when there are no questions', async () => {
    const merged = await fetchMergedQuestionProgress(USER, []);

    expect(merged.size).toBe(0);
    expect(queries).toHaveLength(0);
  });
});

describe('fetchTrainingProgressMaps', () => {
  it('omits unanswered and unrated questions instead of defaulting them', async () => {
    // "never answered" is a filter criterion of its own, so a null result must
    // not arrive as false, and a null attempts count must not arrive as 0.
    queueResponse('session_question_progress', { data: [] });
    queueResponse('user_progress', {
      data: [
        {
          question_id: 'q1',
          is_correct: null,
          attempts_count: null,
          created_at: '2026-01-02T10:00:00Z',
          updated_at: null,
        },
        {
          question_id: 'q2',
          is_correct: false,
          attempts_count: 4,
          created_at: '2026-01-02T10:00:00Z',
          updated_at: null,
        },
      ],
    });

    const { results, attempts } = await fetchTrainingProgressMaps(USER, ['q1', 'q2']);

    expect(results.has('q1')).toBe(false);
    expect(attempts.has('q1')).toBe(false);
    expect(results.get('q2')).toBe(false);
    expect(attempts.get('q2')).toBe(4);
  });
});

describe('fetchProgressActivity', () => {
  it('returns one row per table rather than merging them', async () => {
    // A question answered both in a session and in a one-off run is two
    // attempts, which is what the attempts statistic counts.
    queueResponse('session_question_progress', {
      data: [
        {
          question_id: 'q1',
          attempts_count: 2,
          created_at: '2026-01-01T10:00:00Z',
          updated_at: '2026-01-01T10:00:00Z',
          session_id: 's1',
        },
      ],
    });
    queueResponse('user_progress', {
      data: [
        {
          question_id: 'q1',
          attempts_count: 3,
          created_at: '2026-01-02T10:00:00Z',
          updated_at: null,
        },
      ],
    });

    const rows = await fetchProgressActivity(USER, { createdFrom: '2026-01-01T00:00:00Z' });

    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.source).sort()).toEqual(['session', 'user']);
    expect(rows.find((row) => row.source === 'session')?.sessionId).toBe('s1');
    expect(rows.find((row) => row.source === 'user')?.sessionId).toBeNull();
  });

  it('applies the time window to both tables', async () => {
    await fetchProgressActivity(USER, {
      createdFrom: '2026-01-01T00:00:00Z',
      createdTo: '2026-01-31T00:00:00Z',
    });

    [...queriesFor('session_question_progress'), ...queriesFor('user_progress')].forEach(
      (query) => {
        expect(query.ops).toContainEqual({
          method: 'gte',
          args: ['created_at', '2026-01-01T00:00:00Z'],
        });
        expect(query.ops).toContainEqual({
          method: 'lte',
          args: ['created_at', '2026-01-31T00:00:00Z'],
        });
      },
    );
  });

  it('throws rather than under-reporting when a query fails', async () => {
    queueResponse('session_question_progress', { error: { message: 'boom' } });

    await expect(fetchProgressActivity(USER)).rejects.toEqual({ message: 'boom' });
  });
});

describe('recordAnswerAttempt', () => {
  const attempt = {
    userId: USER,
    questionId: 'q1',
    answer: 'A',
    isCorrect: true,
    isFirstAttempt: true,
    immediateFeedback: false,
  };

  it('creates the first attempt', async () => {
    queueResponse('user_progress', { data: null });

    await recordAnswerAttempt(attempt);

    expect(payloadOf(queriesFor('user_progress')[1], 'insert')).toMatchObject({
      user_id: USER,
      question_id: 'q1',
      user_answer: 'A',
      is_correct: true,
      attempts_count: 1,
    });
  });

  it('records a first look at the solution as a wrong attempt', async () => {
    queueResponse('user_progress', { data: null });

    await recordAnswerAttempt({ ...attempt, answer: SOLUTION_VIEWED, isCorrect: false });

    expect(payloadOf(queriesFor('user_progress')[1], 'insert')).toMatchObject({
      is_correct: false,
      attempts_count: 1,
    });
  });

  it('does not downgrade a question that was already answered correctly', async () => {
    queueResponse('user_progress', { data: { is_correct: true, attempts_count: 2 } });

    await recordAnswerAttempt({ ...attempt, answer: SOLUTION_VIEWED, isCorrect: false });

    expect(payloadOf(queriesFor('user_progress')[1], 'update')).toMatchObject({
      is_correct: true,
      attempts_count: 3,
    });
  });

  it('keeps a wrong question wrong when the solution is revealed', async () => {
    queueResponse('user_progress', { data: { is_correct: false, attempts_count: 1 } });

    await recordAnswerAttempt({ ...attempt, answer: SOLUTION_VIEWED, isCorrect: false });

    expect(payloadOf(queriesFor('user_progress')[1], 'update')).toMatchObject({
      is_correct: false,
    });
  });

  it('credits a correct answer given on the first attempt', async () => {
    queueResponse('user_progress', { data: { is_correct: false, attempts_count: 1 } });

    await recordAnswerAttempt({ ...attempt, isFirstAttempt: true });

    expect(payloadOf(queriesFor('user_progress')[1], 'update')).toMatchObject({
      is_correct: true,
    });
  });

  it('does not credit a correct answer retried after seeing the result', async () => {
    queueResponse('user_progress', { data: { is_correct: false, attempts_count: 1 } });

    await recordAnswerAttempt({ ...attempt, isFirstAttempt: false, immediateFeedback: false });

    expect(payloadOf(queriesFor('user_progress')[1], 'update')).toMatchObject({
      is_correct: false,
    });
  });

  it('credits a later correct answer when training with immediate feedback', async () => {
    queueResponse('user_progress', { data: { is_correct: false, attempts_count: 1 } });

    await recordAnswerAttempt({ ...attempt, isFirstAttempt: false, immediateFeedback: true });

    expect(payloadOf(queriesFor('user_progress')[1], 'update')).toMatchObject({
      is_correct: true,
    });
  });

  it('leaves the result alone on a wrong answer and counts the attempt', async () => {
    queueResponse('user_progress', { data: { is_correct: true, attempts_count: 4 } });

    await recordAnswerAttempt({ ...attempt, answer: 'B', isCorrect: false });

    expect(payloadOf(queriesFor('user_progress')[1], 'update')).toMatchObject({
      is_correct: true,
      attempts_count: 5,
      user_answer: 'B',
    });
  });
});

describe('setUserDifficulty', () => {
  it('updates the existing row', async () => {
    queueResponse('user_progress', { data: { id: 'progress-1' } });

    await setUserDifficulty(USER, 'q1', 4);

    expect(payloadOf(queriesFor('user_progress')[1], 'update')).toEqual({ user_difficulty: 4 });
  });

  it('creates a row for a question the user has not answered yet', async () => {
    queueResponse('user_progress', { data: null });

    await setUserDifficulty(USER, 'q1', 2);

    expect(payloadOf(queriesFor('user_progress')[1], 'insert')).toEqual({
      user_id: USER,
      question_id: 'q1',
      user_difficulty: 2,
      attempts_count: 0,
    });
  });
});

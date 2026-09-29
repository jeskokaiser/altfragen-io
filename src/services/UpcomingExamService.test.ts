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
  fetchQuestionsForExamNames,
  fetchUpcomingExam,
  fetchUpcomingExamsByIds,
  findUpcomingExamByExamName,
  getExamStatsForUser,
  listExamNameCounts,
  splitExamNames,
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

describe('splitExamNames', () => {
  it('splits and trims the comma-separated names, dropping empty ones', () => {
    expect(splitExamNames('Anatomie, Physiologie ,, ')).toEqual(['Anatomie', 'Physiologie']);
    expect(splitExamNames(null)).toEqual([]);
  });
});

describe('fetchQuestionsForExamNames', () => {
  const questionRow = {
    id: 'q1',
    question: 'Welcher Nerv …?',
    option_a: 'A',
    option_b: 'B',
    option_c: 'C',
    option_d: 'D',
    option_e: 'E',
    subject: 'Anatomie',
    correct_answer: 'A',
    comment: null,
    filename: 'Anatomie SS 2025.pdf',
    difficulty: 3,
    exam_semester: 'SS',
    exam_year: '2025',
    exam_name: 'Anatomie',
    image_key: '',
    visibility: 'university',
  };

  it('asks for nothing without exam names', async () => {
    expect(await fetchQuestionsForExamNames([])).toEqual([]);
    expect(recordedQueries).toHaveLength(0);
  });

  it('reads the questions carrying any of the names, mapped to the domain type', async () => {
    queueResponse('questions', { data: [questionRow] });

    const [question] = await fetchQuestionsForExamNames(['Anatomie', 'Physiologie']);

    expect(queriesFor('questions')[0].ops).toContainEqual({
      method: 'in',
      args: ['exam_name', ['Anatomie', 'Physiologie']],
    });
    // Through questionRowMapper: exam_semester and exam_year are renamed.
    expect(question).toMatchObject({
      id: 'q1',
      optionA: 'A',
      correctAnswer: 'A',
      subject: 'Anatomie',
      semester: 'SS',
      year: '2025',
      visibility: 'university',
    });
  });

  it('throws on a failed read', async () => {
    queueResponse('questions', { error: { message: 'boom' } });

    await expect(fetchQuestionsForExamNames(['Anatomie'])).rejects.toEqual({ message: 'boom' });
  });
});

describe('listExamNameCounts', () => {
  const named = (...names: string[]) => names.map((exam_name) => ({ exam_name }));

  it('counts the questions per exam name, sorted by name', async () => {
    queueResponse('questions', {
      data: named('Physiologie', 'Anatomie', 'Physiologie'),
      count: 3,
    });

    expect(await listExamNameCounts({ visibility: 'public' })).toEqual([
      { exam_name: 'Anatomie', count: 1 },
      { exam_name: 'Physiologie', count: 2 },
    ]);
  });

  it.each([
    [
      { visibility: 'private', userId: 'user-1' } as const,
      [
        { method: 'eq', args: ['user_id', 'user-1'] },
        { method: 'eq', args: ['visibility', 'private'] },
      ],
    ],
    [
      { visibility: 'university', universityId: 'uni-1' } as const,
      [
        { method: 'eq', args: ['university_id', 'uni-1'] },
        { method: 'eq', args: ['visibility', 'university'] },
      ],
    ],
    [
      { visibility: 'public' } as const,
      [
        { method: 'eq', args: ['visibility', 'public'] },
        { method: 'is', args: ['university_id', null] },
      ],
    ],
  ])('narrows the read to the %o scope', async (scope, filters) => {
    queueResponse('questions', { data: [], count: 0 });
    await listExamNameCounts(scope);

    const { ops } = queriesFor('questions')[0];
    filters.forEach((filter) => expect(ops).toContainEqual(filter));
    expect(ops).toContainEqual({ method: 'not', args: ['exam_name', 'is', null] });
    // Without the scope filters, the tab would list other people's names.
    expect(ops.filter((op) => op.method === 'eq' || op.method === 'is')).toHaveLength(2);
  });

  it('reads past the API row cap, in pages ordered by id', async () => {
    // One university has more named questions than one response returns: the
    // first response is capped at 2 rows here, and says 3 exist.
    queueResponse('questions', { data: named('Anatomie', 'Anatomie'), count: 3 });
    queueResponse('questions', { data: named('Biochemie'), count: 3 });

    const counts = await listExamNameCounts({ visibility: 'university', universityId: 'uni-1' });

    expect(counts).toEqual([
      { exam_name: 'Anatomie', count: 2 },
      { exam_name: 'Biochemie', count: 1 },
    ]);
    const pages = queriesFor('questions');
    expect(pages).toHaveLength(2);
    expect(pages[0].ops).toContainEqual({
      method: 'select',
      args: ['exam_name', { count: 'exact' }],
    });
    expect(pages[1].ops).toContainEqual({ method: 'range', args: [2, 3] });
    expect(pages[1].ops).toContainEqual({ method: 'order', args: ['id'] });
    // The second page must be narrowed like the first.
    expect(pages[1].ops).toContainEqual({ method: 'eq', args: ['university_id', 'uni-1'] });
  });

  it('throws on a failed read', async () => {
    queueResponse('questions', { error: { message: 'boom' } });

    await expect(listExamNameCounts({ visibility: 'public' })).rejects.toEqual({
      message: 'boom',
    });
  });
});

describe('findUpcomingExamByExamName', () => {
  const linked = (id: string, examName: string | null) => ({
    id,
    title: `Exam ${id}`,
    exam_name: examName,
  });

  it("looks among the user's own exams, due first", async () => {
    await findUpcomingExamByExamName('user-1', 'Anatomie');

    const { ops } = queriesFor('upcoming_exams')[0];
    expect(ops).toContainEqual({ method: 'eq', args: ['created_by', 'user-1'] });
    expect(ops).toContainEqual({ method: 'order', args: ['due_date', { ascending: true }] });
  });

  it('finds an exam linked to several names by any one of them', async () => {
    queueResponse('upcoming_exams', { data: [linked('e1', 'Anatomie, Physiologie')] });

    expect((await findUpcomingExamByExamName('user-1', 'Physiologie'))?.id).toBe('e1');
  });

  it('finds the exam due first when two exams share the name', async () => {
    // The old exact lookup failed on this, and told the user to create an exam.
    queueResponse('upcoming_exams', {
      data: [linked('e1', null), linked('e2', 'Anatomie'), linked('e3', 'Anatomie')],
    });

    expect((await findUpcomingExamByExamName('user-1', 'Anatomie'))?.id).toBe('e2');
  });

  it('matches whole names only', async () => {
    queueResponse('upcoming_exams', { data: [linked('e1', 'Anatomie II')] });

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

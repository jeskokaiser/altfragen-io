import { supabase } from '@/integrations/supabase/client';

/**
 * Owns the `user_progress` table, and the merge with `session_question_progress`
 * that almost every read of it needs.
 *
 * Answers are recorded in two places: `user_progress` holds one row per
 * (user, question) for one-off training runs, `session_question_progress` one row
 * per (session, question) for saved sessions. A question can have rows in both.
 * Every caller therefore has to decide which row wins, and before this service
 * each of them decided it again, slightly differently -- see `ProgressPreference`.
 */

/**
 * Question IDs are passed to PostgREST as an `in.(...)` filter in the query
 * string, so a long list has to be split to keep the URL short. Call sites used
 * 300 and 500 before this service; 300 is the conservative of the two.
 */
const QUESTION_ID_BATCH_SIZE = 300;

/** The sentinel answer stored when the user reveals the solution instead of answering. */
export const SOLUTION_VIEWED = 'solution_viewed';

export type ProgressSource = 'session' | 'user';

/**
 * Which row wins when a question has progress in both tables:
 *
 * - `session` -- the session row always wins, `user_progress` is only a fallback
 *   for questions with no session row at all. Used by the training filters.
 * - `latest`  -- the row with the newer timestamp wins, a session row breaking
 *   ties. Used by the dataset statistics.
 *
 * The two disagree when a question was answered in a session first and in a
 * one-off run afterwards: `session` then reports the older result. That is not
 * hypothetical -- of the 31.7k questions with rows in both tables, 15.1k have a
 * newer `user_progress` row. Both rules predate this service and are kept as
 * they were; picking one changes what users see and belongs in its own commit.
 */
export type ProgressPreference = 'session' | 'latest';

export interface QuestionProgress {
  questionId: string;
  isCorrect: boolean | null;
  /** Nullable in `user_progress`; always set on session rows. */
  attemptsCount: number | null;
  createdAt: string;
  updatedAt: string | null;
  source: ProgressSource;
}

export interface ProgressActivityRow {
  questionId: string;
  createdAt: string;
  updatedAt: string | null;
  attemptsCount: number | null;
  /** Only session rows carry one; `null` for `user_progress`. */
  sessionId: string | null;
  source: ProgressSource;
}

interface ProgressRow {
  question_id: string | null;
  is_correct?: boolean | null;
  attempts_count?: number | null;
  created_at: string;
  updated_at: string | null;
  session_id?: string;
}

const batchQuestionIds = (questionIds: string[]): string[][] => {
  const batches: string[][] = [];
  for (let i = 0; i < questionIds.length; i += QUESTION_ID_BATCH_SIZE) {
    batches.push(questionIds.slice(i, i + QUESTION_ID_BATCH_SIZE));
  }
  return batches;
};

/** A row's point in time. `updated_at` is null on untouched `user_progress` rows. */
const timestampOf = (row: { createdAt: string; updatedAt: string | null }): number =>
  new Date(row.updatedAt || row.createdAt).getTime();

const toQuestionProgress = (row: ProgressRow, source: ProgressSource): QuestionProgress | null => {
  // `user_progress.question_id` is nullable: a row survives its question being
  // deleted. Such a row describes no question, so no caller can use it.
  if (!row.question_id) return null;

  return {
    questionId: row.question_id,
    isCorrect: row.is_correct ?? null,
    attemptsCount: row.attempts_count ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    source,
  };
};

/** Keeps the most recent row per question -- a question may appear in several sessions. */
const latestPerQuestion = (rows: QuestionProgress[]): Map<string, QuestionProgress> => {
  const byQuestion = new Map<string, QuestionProgress>();

  rows.forEach((row) => {
    const existing = byQuestion.get(row.questionId);
    if (!existing || timestampOf(row) > timestampOf(existing)) {
      byQuestion.set(row.questionId, row);
    }
  });

  return byQuestion;
};

/**
 * The progress for `questionIds`, merged across both tables.
 *
 * Questions without any progress are absent from the map rather than present
 * with an empty entry -- "never answered" is a filter criterion of its own.
 */
export const fetchMergedQuestionProgress = async (
  userId: string,
  questionIds: string[],
  preference: ProgressPreference = 'session',
): Promise<Map<string, QuestionProgress>> => {
  if (!userId || questionIds.length === 0) return new Map();

  const merged = new Map<string, QuestionProgress>();

  for (const batch of batchQuestionIds(questionIds)) {
    const [sessionResult, userResult] = await Promise.all([
      supabase
        .from('session_question_progress')
        .select('question_id, is_correct, attempts_count, created_at, updated_at')
        .eq('user_id', userId)
        .in('question_id', batch),
      supabase
        .from('user_progress')
        .select('question_id, is_correct, attempts_count, created_at, updated_at')
        .eq('user_id', userId)
        .in('question_id', batch),
    ]);

    if (sessionResult.error) {
      console.error('Error loading session progress batch:', sessionResult.error);
    }
    if (userResult.error) {
      console.error('Error loading user progress batch:', userResult.error);
    }

    const sessionProgress = latestPerQuestion(
      (sessionResult.data || [])
        .map((row) => toQuestionProgress(row, 'session'))
        .filter((row): row is QuestionProgress => row !== null),
    );

    sessionProgress.forEach((row, questionId) => merged.set(questionId, row));

    (userResult.data || []).forEach((row) => {
      const progress = toQuestionProgress(row, 'user');
      if (!progress) return;

      const sessionRow = sessionProgress.get(progress.questionId);
      if (!sessionRow) {
        merged.set(progress.questionId, progress);
        return;
      }

      if (preference === 'latest' && timestampOf(progress) > timestampOf(sessionRow)) {
        merged.set(progress.questionId, progress);
      }
    });
  }

  return merged;
};

export interface TrainingProgressMaps {
  /** Last known result per question; questions answered without a result are absent. */
  results: Map<string, boolean>;
  /** Attempts per question, for sorting by attempt count. */
  attempts: Map<string, number>;
}

/**
 * The two lookup maps the training filters need (`filterQuestions`,
 * `prioritizeQuestions`), so that every screen configuring a training run sees
 * the same progress.
 */
export const fetchTrainingProgressMaps = async (
  userId: string,
  questionIds: string[],
): Promise<TrainingProgressMaps> => {
  const merged = await fetchMergedQuestionProgress(userId, questionIds);
  const results = new Map<string, boolean>();
  const attempts = new Map<string, number>();

  merged.forEach((progress, questionId) => {
    if (progress.isCorrect !== null) results.set(questionId, progress.isCorrect);
    if (progress.attemptsCount !== null) attempts.set(questionId, progress.attemptsCount);
  });

  return { results, attempts };
};

export interface ProgressActivityFilter {
  /** Rows created at or after this timestamp. */
  createdFrom?: string | null;
  /** Rows created at or before this timestamp. */
  createdTo?: string | null;
  /** Rows updated at or after this timestamp. */
  updatedFrom?: string | null;
}

/**
 * Raw progress rows from both tables in a time window, for counting activity.
 *
 * Unlike `fetchMergedQuestionProgress` this does not merge: a question answered
 * in both a session and a one-off run yields two rows, which is what the
 * "repeated today" and "attempts" statistics count.
 */
export const fetchProgressActivity = async (
  userId: string,
  filter: ProgressActivityFilter = {},
): Promise<ProgressActivityRow[]> => {
  if (!userId) return [];

  let sessionQuery = supabase
    .from('session_question_progress')
    .select('question_id, attempts_count, created_at, updated_at, session_id')
    .eq('user_id', userId);

  let userQuery = supabase
    .from('user_progress')
    .select('question_id, attempts_count, created_at, updated_at')
    .eq('user_id', userId);

  if (filter.createdFrom) {
    sessionQuery = sessionQuery.gte('created_at', filter.createdFrom);
    userQuery = userQuery.gte('created_at', filter.createdFrom);
  }
  if (filter.createdTo) {
    sessionQuery = sessionQuery.lte('created_at', filter.createdTo);
    userQuery = userQuery.lte('created_at', filter.createdTo);
  }
  if (filter.updatedFrom) {
    sessionQuery = sessionQuery.gte('updated_at', filter.updatedFrom);
    userQuery = userQuery.gte('updated_at', filter.updatedFrom);
  }

  const [sessionResult, userResult] = await Promise.all([sessionQuery, userQuery]);

  if (sessionResult.error) throw sessionResult.error;
  if (userResult.error) throw userResult.error;

  const rows: ProgressActivityRow[] = [];

  (sessionResult.data || []).forEach((row) => {
    if (!row.question_id) return;
    rows.push({
      questionId: row.question_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      attemptsCount: row.attempts_count ?? null,
      sessionId: row.session_id,
      source: 'session',
    });
  });

  (userResult.data || []).forEach((row) => {
    if (!row.question_id) return;
    rows.push({
      questionId: row.question_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      attemptsCount: row.attempts_count ?? null,
      sessionId: null,
      source: 'user',
    });
  });

  return rows;
};

/**
 * Of `questionIds`, those the user already had progress on before `before`.
 *
 * This is what separates a question answered for the first time today from one
 * that was only repeated today.
 */
export const fetchQuestionIdsWithProgressBefore = async (
  userId: string,
  questionIds: string[],
  before: string,
): Promise<Set<string>> => {
  if (!userId || questionIds.length === 0) return new Set();

  const batchResults = await Promise.all(
    batchQuestionIds(questionIds).map((batch) =>
      Promise.all([
        supabase
          .from('session_question_progress')
          .select('question_id')
          .eq('user_id', userId)
          .in('question_id', batch)
          .lt('created_at', before),
        supabase
          .from('user_progress')
          .select('question_id')
          .eq('user_id', userId)
          .in('question_id', batch)
          .lt('created_at', before),
      ]),
    ),
  );

  const seen = new Set<string>();
  batchResults.forEach(([sessionResult, userResult]) => {
    if (sessionResult.error) throw sessionResult.error;
    if (userResult.error) throw userResult.error;

    [...(sessionResult.data || []), ...(userResult.data || [])].forEach((row) => {
      if (row.question_id) seen.add(row.question_id);
    });
  });

  return seen;
};

export interface UserQuestionProgress {
  attemptsCount: number;
  /** The difficulty the user set for themselves, overriding the question's own. */
  userDifficulty: number | null;
}

/** The user's own `user_progress` row for a question, or null if there is none. */
export const fetchUserQuestionProgress = async (
  userId: string,
  questionId: string,
): Promise<UserQuestionProgress | null> => {
  if (!userId || !questionId) return null;

  const { data, error } = await supabase
    .from('user_progress')
    .select('attempts_count, user_difficulty')
    .eq('user_id', userId)
    .eq('question_id', questionId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    attemptsCount: data.attempts_count || 0,
    userDifficulty: data.user_difficulty,
  };
};

/**
 * The user's personal difficulties for a set of questions.
 *
 * Questions the user never rated are absent from the record, so that the
 * question's own difficulty stays in effect.
 */
export const fetchUserDifficultiesForQuestions = async (
  userId: string,
  questionIds: string[],
): Promise<Record<string, number>> => {
  if (!userId || questionIds.length === 0) return {};

  const userDifficulties: Record<string, number> = {};

  const batchPromises = batchQuestionIds(questionIds).map((batch) =>
    supabase
      .from('user_progress')
      .select('question_id, user_difficulty')
      .eq('user_id', userId)
      .in('question_id', batch)
      .not('user_difficulty', 'is', null),
  );

  try {
    const results = await Promise.all(batchPromises);

    results
      .flatMap((result) => result.data || [])
      .forEach((row) => {
        if (row.question_id && row.user_difficulty !== null) {
          userDifficulties[row.question_id] = row.user_difficulty;
        }
      });
  } catch (error) {
    console.error('Error fetching user difficulties:', error);
  }

  return userDifficulties;
};

/**
 * Sets the user's personal difficulty for a question, creating the progress row
 * if the question has not been answered yet.
 */
export const setUserDifficulty = async (
  userId: string,
  questionId: string,
  difficulty: number,
): Promise<void> => {
  const { data: existingProgress, error: fetchError } = await supabase
    .from('user_progress')
    .select('id')
    .eq('user_id', userId)
    .eq('question_id', questionId)
    .maybeSingle();

  if (fetchError) throw fetchError;

  if (existingProgress) {
    const { error } = await supabase
      .from('user_progress')
      .update({ user_difficulty: difficulty })
      .eq('id', existingProgress.id);

    if (error) throw error;
    return;
  }

  const { error } = await supabase.from('user_progress').insert({
    user_id: userId,
    question_id: questionId,
    user_difficulty: difficulty,
    attempts_count: 0,
  });

  if (error) throw error;
};

export interface AnswerAttempt {
  userId: string;
  questionId: string;
  /** An option letter, or `SOLUTION_VIEWED` when the solution was revealed instead. */
  answer: string;
  isCorrect: boolean;
  /** Whether this was the user's first attempt at the question in this run. */
  isFirstAttempt: boolean;
  /** The user's "show feedback immediately" preference, see `nextIsCorrect`. */
  immediateFeedback: boolean;
}

/**
 * Whether the question counts as answered correctly after this attempt.
 *
 * Revealing the solution counts as a wrong attempt, but never downgrades a
 * question that was already correct. A correct answer only counts when it was
 * the first attempt, or when the user trains with immediate feedback, where
 * retrying after seeing the result would otherwise be free.
 */
const nextIsCorrect = (
  attempt: AnswerAttempt,
  previousIsCorrect: boolean | null,
): boolean | null => {
  if (attempt.answer === SOLUTION_VIEWED) return previousIsCorrect === true;
  if (attempt.isCorrect) return attempt.immediateFeedback || attempt.isFirstAttempt;
  return previousIsCorrect;
};

/** Records an answer outside a training session, in `user_progress`. */
export const recordAnswerAttempt = async (attempt: AnswerAttempt): Promise<void> => {
  const { userId, questionId, answer } = attempt;

  const { data: existingProgress, error: fetchError } = await supabase
    .from('user_progress')
    .select('is_correct, attempts_count')
    .eq('user_id', userId)
    .eq('question_id', questionId)
    .maybeSingle();

  if (fetchError) throw fetchError;

  if (!existingProgress) {
    const { error: insertError } = await supabase.from('user_progress').insert({
      user_id: userId,
      question_id: questionId,
      user_answer: answer,
      is_correct: answer === SOLUTION_VIEWED ? false : attempt.isCorrect,
      attempts_count: 1,
    });

    if (insertError) throw insertError;
    return;
  }

  const { error: updateError } = await supabase
    .from('user_progress')
    .update({
      user_answer: answer,
      attempts_count: (existingProgress.attempts_count || 1) + 1,
      is_correct: nextIsCorrect(attempt, existingProgress.is_correct),
    })
    .eq('user_id', userId)
    .eq('question_id', questionId);

  if (updateError) throw updateError;
};

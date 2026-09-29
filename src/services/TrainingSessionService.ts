import { supabase } from '@/integrations/supabase/client';
import type {
  TrainingSession,
  CreateTrainingSessionInput,
  TrainingSessionStatus,
} from '@/types/TrainingSession';

/**
 * Question IDs go into the URL as an `in.(...)` filter, so a long list is split
 * -- the same limit `UserProgressService` uses.
 */
const QUESTION_ID_BATCH_SIZE = 300;

/** One `session_question_progress` row, as the statistics read it. */
export interface SessionProgressRow {
  sessionId: string;
  questionId: string;
  isCorrect: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export class TrainingSessionService {
  /**
   * The exam a session was started from, or null for a session built from
   * filters. `filter_settings` is jsonb, so its shape is checked, not assumed.
   */
  static examIdOf(filterSettings: unknown): string | null {
    if (typeof filterSettings !== 'object' || filterSettings === null) return null;
    const settings = filterSettings as Record<string, unknown>;
    return settings.source === 'exam' && typeof settings.examId === 'string'
      ? settings.examId
      : null;
  }

  static async create(userId: string, input: CreateTrainingSessionInput): Promise<TrainingSession> {
    const { data, error } = await supabase
      .from('training_sessions')
      .insert({
        user_id: userId,
        title: input.title,
        filter_settings: input.filter_settings,
        question_ids: input.question_ids,
        current_index: 0,
        total_questions: input.question_ids.length,
        status: 'active',
      })
      .select('*')
      .single();

    if (error) throw error;
    return data as TrainingSession;
  }

  static async list(userId: string): Promise<TrainingSession[]> {
    const { data, error } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return (data || []) as TrainingSession[];
  }

  /**
   * The user's sessions started from `examId`, newest first.
   *
   * The link lives in the `filter_settings` jsonb, so the filter reads it by
   * path; it matches exactly the sessions `examIdOf` attributes to the exam.
   */
  static async listForExam(userId: string, examId: string): Promise<TrainingSession[]> {
    const { data, error } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('filter_settings->>source', 'exam')
      .eq('filter_settings->>examId', examId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return (data || []) as TrainingSession[];
  }

  /** The IDs of `listForExam`, without loading each session's question list. */
  static async listIdsForExam(userId: string, examId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('training_sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('filter_settings->>source', 'exam')
      .eq('filter_settings->>examId', examId);

    if (error) throw error;
    return (data || []).map((session) => session.id);
  }

  static async getById(sessionId: string, userId: string): Promise<TrainingSession | null> {
    const { data, error } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return (data as TrainingSession) ?? null;
  }

  static async updateStatus(sessionId: string, status: TrainingSessionStatus): Promise<void> {
    const { error } = await supabase
      .from('training_sessions')
      .update({ status })
      .eq('id', sessionId);

    if (error) throw error;
  }

  static async updateIndex(sessionId: string, currentIndex: number): Promise<void> {
    const { error } = await supabase
      .from('training_sessions')
      .update({ current_index: currentIndex })
      .eq('id', sessionId);

    if (error) throw error;
  }

  static async appendQuestions(sessionId: string, questionIds: string[]): Promise<void> {
    const { data: current, error: fetchError } = await supabase
      .from('training_sessions')
      .select('question_ids, total_questions')
      .eq('id', sessionId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    const newList = [...(current?.question_ids || []), ...questionIds];
    const { error } = await supabase
      .from('training_sessions')
      .update({ question_ids: newList, total_questions: newList.length })
      .eq('id', sessionId);

    if (error) throw error;
  }

  static async rename(sessionId: string, title: string): Promise<void> {
    const { error } = await supabase
      .from('training_sessions')
      .update({ title })
      .eq('id', sessionId);

    if (error) throw error;
  }

  static async remove(sessionId: string): Promise<void> {
    const { error } = await supabase.from('training_sessions').delete().eq('id', sessionId);

    if (error) throw error;
  }

  /**
   * Every progress row the user has in these sessions.
   *
   * There is at most one row per session and question: the table is unique on
   * (session_id, user_id, question_id).
   */
  static async fetchProgress(userId: string, sessionIds: string[]): Promise<SessionProgressRow[]> {
    if (sessionIds.length === 0) return [];

    const { data, error } = await supabase
      .from('session_question_progress')
      .select('session_id, question_id, is_correct, created_at, updated_at')
      .eq('user_id', userId)
      .in('session_id', sessionIds);

    if (error) throw error;
    return (data || []).map((row) => ({
      sessionId: row.session_id,
      questionId: row.question_id,
      isCorrect: row.is_correct,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  /**
   * The latest result per question across these sessions, for `questionIds`.
   *
   * A question answered in several sessions counts once, with the result of the
   * most recently updated row. Questions without a row are absent from the map;
   * a present `null` means answered without a result.
   *
   * Only `session_question_progress` is read. That is deliberate: a statistic
   * about an exam's sessions leaves out one-off runs (`user_progress`).
   */
  static async fetchLatestResults(
    userId: string,
    sessionIds: string[],
    questionIds: string[],
  ): Promise<Map<string, boolean | null>> {
    if (sessionIds.length === 0 || questionIds.length === 0) return new Map();

    const batches: string[][] = [];
    for (let i = 0; i < questionIds.length; i += QUESTION_ID_BATCH_SIZE) {
      batches.push(questionIds.slice(i, i + QUESTION_ID_BATCH_SIZE));
    }

    const results = await Promise.all(
      batches.map((batch) =>
        supabase
          .from('session_question_progress')
          .select('question_id, is_correct, updated_at')
          .eq('user_id', userId)
          .in('session_id', sessionIds)
          .in('question_id', batch),
      ),
    );

    const latest = new Map<string, { isCorrect: boolean | null; ts: number }>();
    results.forEach(({ data, error }) => {
      if (error) throw error;
      (data || []).forEach((row) => {
        // `updated_at` is set on insert and never null, so it alone orders the rows.
        const ts = new Date(row.updated_at).getTime();
        const existing = latest.get(row.question_id);
        if (!existing || ts > existing.ts) {
          latest.set(row.question_id, { isCorrect: row.is_correct, ts });
        }
      });
    });

    return new Map([...latest].map(([questionId, { isCorrect }]) => [questionId, isCorrect]));
  }

  // Get progress for a specific question in a session
  static async getQuestionProgress(params: {
    sessionId: string;
    userId: string;
    questionId: string;
  }): Promise<{
    last_answer: string | null;
    initial_answer: string | null;
    attempts_count: number;
    is_correct: boolean | null;
    viewed_solution: boolean;
  } | null> {
    const { sessionId, userId, questionId } = params;

    const { data, error } = await supabase
      .from('session_question_progress')
      .select('last_answer, initial_answer, attempts_count, is_correct, viewed_solution')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  // Per-question per-session progress to support resume and stats
  static async recordAttempt(params: {
    sessionId: string;
    userId: string;
    questionId: string;
    answer: string;
    isCorrect: boolean;
    viewedSolution?: boolean;
    isFirstAttempt?: boolean;
  }): Promise<void> {
    const { sessionId, userId, questionId, answer, isCorrect, viewedSolution, isFirstAttempt } =
      params;

    // Upsert into session_question_progress
    const { data: existing, error: fetchError } = await supabase
      .from('session_question_progress')
      .select('id, attempts_count, is_correct, initial_answer')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!existing) {
      // First attempt - save as initial answer
      const { error: insertError } = await supabase.from('session_question_progress').insert({
        session_id: sessionId,
        user_id: userId,
        question_id: questionId,
        last_answer: answer,
        attempts_count: 1,
        is_correct: isCorrect,
        viewed_solution: viewedSolution ?? false,
        initial_answer: answer,
      });
      if (insertError) throw insertError;
    } else {
      // Update existing progress - preserve initial_answer if it exists
      // Handle is_correct logic:
      // - If viewing solution: keep existing is_correct if true, otherwise false
      // - If answer is correct: only set to true if it's the first attempt
      // - If answer is wrong: set to false (don't preserve previous correct state)
      const nextIsCorrect =
        answer === 'solution_viewed'
          ? existing.is_correct === true
            ? true
            : false
          : isCorrect
            ? isFirstAttempt
              ? true
              : false
            : false;

      const { error: updateError } = await supabase
        .from('session_question_progress')
        .update({
          last_answer: answer,
          attempts_count: (existing.attempts_count || 0) + 1,
          is_correct: nextIsCorrect,
          viewed_solution: viewedSolution ?? false,
          // Only set initial_answer if it doesn't exist yet
          ...(!existing.initial_answer && { initial_answer: answer }),
        })
        .eq('id', existing.id);
      if (updateError) throw updateError;
    }
  }
}

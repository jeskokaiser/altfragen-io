import { supabase } from '@/integrations/supabase/client';
import type { TrainingSession, CreateTrainingSessionInput, TrainingSessionStatus } from '@/types/TrainingSession';

export class TrainingSessionService {
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

    const newList = [ ...(current?.question_ids || []), ...questionIds ];
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
    const { error } = await supabase
      .from('training_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) throw error;
  }

  // Per-question per-session progress to support resume and stats
  static async recordAttempt(params: {
    sessionId: string;
    userId: string;
    questionId: string;
    answer: string;
    isCorrect: boolean;
    viewedSolution?: boolean;
  }): Promise<void> {
    const { sessionId, userId, questionId, answer, isCorrect, viewedSolution } = params;

    // Upsert into session_question_progress
    const { data: existing, error: fetchError } = await supabase
      .from('session_question_progress')
      .select('id, attempts_count, is_correct')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!existing) {
      const { error: insertError } = await supabase
        .from('session_question_progress')
        .insert({
          session_id: sessionId,
          user_id: userId,
          question_id: questionId,
          last_answer: answer,
          attempts_count: 1,
          is_correct: isCorrect,
          viewed_solution: viewedSolution ?? false,
        });
      if (insertError) throw insertError;
    } else {
      const { error: updateError } = await supabase
        .from('session_question_progress')
        .update({
          last_answer: answer,
          attempts_count: (existing.attempts_count || 0) + 1,
          is_correct: isCorrect ? true : existing.is_correct,
          viewed_solution: viewedSolution ?? false,
        })
        .eq('id', existing.id);
      if (updateError) throw updateError;
    }
  }
}

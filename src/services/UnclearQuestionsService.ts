import { supabase } from '@/integrations/supabase/client';
import { Question } from '@/types/Question';
import { mapQuestionRow } from './questionRowMapper';

export interface UserUnclearQuestion {
  id: string;
  user_id: string;
  question_id: string;
  marked_unclear_at: string;
  created_at: string;
}

// The joined question columns the unclear-question views need. Kept next to
// the queries that use it so the select and the mapper cannot drift apart.
const JOINED_QUESTION_COLUMNS = `
  id,
  question,
  option_a,
  option_b,
  option_c,
  option_d,
  option_e,
  subject,
  correct_answer,
  comment,
  filename,
  difficulty,
  created_at,
  user_id,
  visibility,
  university_id,
  exam_semester,
  exam_year,
  image_key,
  show_image_after_answer,
  exam_name,
  question_case,
  case_text
`;

/**
 * A dataset is addressed by either `filename` or `exam_name`, depending on how
 * it was imported, so both have to be checked.
 */
const belongsToDataset = (question: { filename?: string; exam_name?: string }, dataset: string) =>
  question.filename === dataset || question.exam_name === dataset;

export class UnclearQuestionsService {
  static async markQuestionUnclear(questionId: string): Promise<{ error?: any }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { error: 'User not authenticated' };
      }

      const { error } = await supabase.from('user_ignored_questions').upsert(
        {
          user_id: user.id,
          question_id: questionId,
          marked_unclear_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,question_id',
        },
      );

      return { error };
    } catch (error) {
      return { error };
    }
  }

  static async unmarkQuestionUnclear(questionId: string): Promise<{ error?: any }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { error: 'User not authenticated' };
      }

      const { error } = await supabase
        .from('user_ignored_questions')
        .delete()
        .eq('user_id', user.id)
        .eq('question_id', questionId);

      return { error };
    } catch (error) {
      return { error };
    }
  }

  static async getUserUnclearQuestions(
    userId?: string,
  ): Promise<{ data?: UserUnclearQuestion[]; error?: any }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;

      if (!targetUserId) {
        return { error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('user_ignored_questions')
        .select('*')
        .eq('user_id', targetUserId);

      return { data: data as UserUnclearQuestion[], error };
    } catch (error) {
      return { error };
    }
  }

  static async isQuestionUnclearForUser(questionId: string): Promise<boolean> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('user_ignored_questions')
        .select('id')
        .eq('user_id', user.id)
        .eq('question_id', questionId)
        .maybeSingle();

      // If there's an error or no data, the question is not marked as unclear
      return !error && !!data;
    } catch {
      return false;
    }
  }

  /**
   * The user's unclear questions as full domain objects, newest first.
   * Pass `dataset` to keep only the ones belonging to that dataset.
   */
  static async listUnclearWithQuestions(userId: string, dataset?: string): Promise<Question[]> {
    const { data, error } = await supabase
      .from('user_ignored_questions')
      .select(
        `id, question_id, marked_unclear_at, questions:question_id (${JOINED_QUESTION_COLUMNS})`,
      )
      .eq('user_id', userId)
      .order('marked_unclear_at', { ascending: false });

    if (error) throw error;

    return (data ?? [])
      .filter((row) => !!row.questions && (!dataset || belongsToDataset(row.questions, dataset)))
      .map((row) => ({
        ...mapQuestionRow(row.questions),
        is_unclear: true,
        marked_unclear_at: row.marked_unclear_at ?? undefined,
      }));
  }

  /** How many of the user's unclear questions belong to one dataset. */
  static async countUnclearInDataset(userId: string, dataset: string): Promise<number> {
    const { data, error } = await supabase
      .from('user_ignored_questions')
      .select('id, questions:question_id (filename, exam_name)')
      .eq('user_id', userId);

    if (error) throw error;

    return (data ?? []).filter((row) => row.questions && belongsToDataset(row.questions, dataset))
      .length;
  }
}


import { supabase } from '@/integrations/supabase/client';

export interface UserUnclearQuestion {
  id: string;
  user_id: string;
  question_id: string;
  marked_unclear_at: string;
  created_at: string;
}

export class UnclearQuestionsService {
  static async markQuestionUnclear(questionId: string): Promise<{ error?: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { error: 'User not authenticated' };
      }

      // Use any type to bypass TypeScript errors until types are regenerated
      const { error } = await (supabase as any)
        .from('user_ignored_questions')
        .upsert({
          user_id: user.id,
          question_id: questionId,
          marked_unclear_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,question_id'
        });

      return { error };
    } catch (error) {
      return { error };
    }
  }

  static async unmarkQuestionUnclear(questionId: string): Promise<{ error?: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { error: 'User not authenticated' };
      }

      const { error } = await (supabase as any)
        .from('user_ignored_questions')
        .delete()
        .eq('user_id', user.id)
        .eq('question_id', questionId);

      return { error };
    } catch (error) {
      return { error };
    }
  }

  static async getUserUnclearQuestions(userId?: string): Promise<{ data?: UserUnclearQuestion[], error?: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;
      
      if (!targetUserId) {
        return { error: 'User not authenticated' };
      }

      const { data, error } = await (supabase as any)
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await (supabase as any)
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
}

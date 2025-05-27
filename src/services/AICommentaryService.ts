
import { supabase } from '@/integrations/supabase/client';
import { AICommentary, AICommentarySummary, AICommentarySettings } from '@/types/AICommentary';
import { AIAnswerComments, AICommentarySummaryExtended } from '@/types/AIAnswerComments';

export class AICommentaryService {
  static async getSettings(): Promise<AICommentarySettings | null> {
    const { data, error } = await supabase
      .from('ai_commentary_settings')
      .select('*')
      .single();

    if (error) {
      console.error('Error fetching AI commentary settings:', error);
      return null;
    }

    // Type cast the models_enabled from Json to the expected type
    return {
      ...data,
      models_enabled: data.models_enabled as { openai: boolean; claude: boolean; gemini: boolean; }
    };
  }

  static async updateSettings(settings: Partial<AICommentarySettings>): Promise<boolean> {
    const { error } = await supabase
      .from('ai_commentary_settings')
      .update(settings)
      .eq('id', settings.id);

    if (error) {
      console.error('Error updating AI commentary settings:', error);
      return false;
    }

    return true;
  }

  static async getCommentariesForQuestion(questionId: string): Promise<AICommentary[]> {
    const { data, error } = await supabase
      .from('ai_commentaries')
      .select('*')
      .eq('question_id', questionId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching AI commentaries:', error);
      return [];
    }

    return data || [];
  }

  static async getSummaryForQuestion(questionId: string): Promise<AICommentarySummary | null> {
    const { data, error } = await supabase
      .from('ai_commentary_summaries')
      .select('*')
      .eq('question_id', questionId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching AI commentary summary:', error);
      return null;
    }

    return data;
  }

  // New methods for enhanced AI commentary
  static async getAnswerCommentsForQuestion(questionId: string): Promise<AIAnswerComments | null> {
    const { data, error } = await supabase
      .from('ai_answer_comments')
      .select('*')
      .eq('question_id', questionId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching AI answer comments:', error);
      return null;
    }

    return data;
  }

  static async getExtendedSummaryForQuestion(questionId: string): Promise<AICommentarySummaryExtended | null> {
    const { data, error } = await supabase
      .from('ai_commentary_summaries')
      .select('*')
      .eq('question_id', questionId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching extended summary:', error);
      return null;
    }

    return data;
  }

  static async queueQuestionForCommentary(questionId: string): Promise<boolean> {
    const { error } = await supabase
      .from('questions')
      .update({
        ai_commentary_status: 'pending',
        ai_commentary_queued_at: new Date().toISOString()
      })
      .eq('id', questionId);

    if (error) {
      console.error('Error queueing question for AI commentary:', error);
      return false;
    }

    return true;
  }

  static async updateQuestionCommentaryStatus(
    questionId: string, 
    status: 'pending' | 'processing' | 'completed' | 'failed'
  ): Promise<boolean> {
    const updateData: any = { ai_commentary_status: status };
    
    if (status === 'completed') {
      updateData.ai_commentary_processed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('questions')
      .update(updateData)
      .eq('id', questionId);

    if (error) {
      console.error('Error updating question commentary status:', error);
      return false;
    }

    return true;
  }

  static async addCommentary(
    questionId: string,
    modelName: string,
    commentaryText: string
  ): Promise<boolean> {
    const { error } = await supabase
      .from('ai_commentaries')
      .insert({
        question_id: questionId,
        model_name: modelName,
        commentary_text: commentaryText,
        processing_status: 'completed'
      });

    if (error) {
      console.error('Error adding AI commentary:', error);
      return false;
    }

    return true;
  }

  static async addSummary(questionId: string, summaryText: string): Promise<boolean> {
    const { error } = await supabase
      .from('ai_commentary_summaries')
      .upsert({
        question_id: questionId,
        summary_text: summaryText
      });

    if (error) {
      console.error('Error adding AI commentary summary:', error);
      return false;
    }

    return true;
  }

  static async getPendingQuestions(limit: number = 10): Promise<any[]> {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('ai_commentary_status', 'pending')
      .order('ai_commentary_queued_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching pending questions:', error);
      return [];
    }

    return data || [];
  }

  // Enhanced stats including answer comments
  static async getEnhancedStats() {
    try {
      // Get basic question stats
      const { data: totalQuestions, error: totalError } = await supabase
        .from('questions')
        .select('id', { count: 'exact' });

      const { data: pendingQuestions, error: pendingError } = await supabase
        .from('questions')
        .select('id', { count: 'exact' })
        .eq('ai_commentary_status', 'pending');

      const { data: completedQuestions, error: completedError } = await supabase
        .from('questions')
        .select('id', { count: 'exact' })
        .eq('ai_commentary_status', 'completed');

      // Get answer comments stats
      const { data: answerComments, error: answerError } = await supabase
        .from('ai_answer_comments')
        .select('question_id', { count: 'exact' });

      // Get summary stats
      const { data: summaries, error: summaryError } = await supabase
        .from('ai_commentary_summaries')
        .select('question_id', { count: 'exact' });

      if (totalError || pendingError || completedError || answerError || summaryError) {
        console.error('Error fetching enhanced stats:', { 
          totalError, pendingError, completedError, answerError, summaryError 
        });
        return null;
      }

      return {
        total: totalQuestions?.length || 0,
        pending: pendingQuestions?.length || 0,
        completed: completedQuestions?.length || 0,
        withAnswerComments: answerComments?.length || 0,
        withSummaries: summaries?.length || 0
      };
    } catch (error) {
      console.error('Error getting enhanced stats:', error);
      return null;
    }
  }
}

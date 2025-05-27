
import { supabase } from '@/integrations/supabase/client';
import { AICommentary, AICommentarySummary, AICommentarySettings } from '@/types/AICommentary';

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

    return data;
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
}

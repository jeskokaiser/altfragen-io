
import { supabase } from '@/integrations/supabase/client';
import { AIAnswerComments, AICommentarySummaryExtended, AICommentaryData } from '@/types/AIAnswerComments';

export class AIAnswerCommentaryService {
  static async getCommentaryForQuestion(questionId: string): Promise<AICommentaryData | null> {
    try {
      // Fetch answer comments
      const { data: answerComments, error: answerError } = await supabase
        .from('ai_answer_comments')
        .select('*')
        .eq('question_id', questionId)
        .maybeSingle();

      if (answerError) {
        console.error('Error fetching answer comments:', answerError);
      }

      // Fetch summary comments
      const { data: summary, error: summaryError } = await supabase
        .from('ai_commentary_summaries')
        .select('*')
        .eq('question_id', questionId)
        .maybeSingle();

      if (summaryError) {
        console.error('Error fetching summary comments:', summaryError);
      }

      if (!answerComments && !summary) {
        return null;
      }

      // Transform data into structured format
      const models = {
        openai: {
          general: answerComments?.openai_general_comment,
          answers: {
            a: answerComments?.openai_comment_a,
            b: answerComments?.openai_comment_b,
            c: answerComments?.openai_comment_c,
            d: answerComments?.openai_comment_d,
            e: answerComments?.openai_comment_e,
          }
        },
        claude: {
          general: answerComments?.claude_general_comment,
          answers: {
            a: answerComments?.claude_comment_a,
            b: answerComments?.claude_comment_b,
            c: answerComments?.claude_comment_c,
            d: answerComments?.claude_comment_d,
            e: answerComments?.claude_comment_e,
          }
        },
        gemini: {
          general: answerComments?.gemini_general_comment,
          answers: {
            a: answerComments?.gemini_comment_a,
            b: answerComments?.gemini_comment_b,
            c: answerComments?.gemini_comment_c,
            d: answerComments?.gemini_comment_d,
            e: answerComments?.gemini_comment_e,
          }
        }
      };

      return {
        answerComments: answerComments || undefined,
        summary: summary || undefined,
        models
      };
    } catch (error) {
      console.error('Error fetching AI commentary:', error);
      return null;
    }
  }

  static async triggerProcessing(): Promise<{ processed: number } | null> {
    try {
      const { data, error } = await supabase.functions.invoke('process-ai-commentary');
      
      if (error) {
        console.error('Error triggering AI processing:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error invoking process function:', error);
      return null;
    }
  }

  static async getProcessingStats() {
    try {
      const { data: totalQuestions, error: totalError } = await supabase
        .from('questions')
        .select('id', { count: 'exact' });

      const { data: pendingQuestions, error: pendingError } = await supabase
        .from('questions')
        .select('id', { count: 'exact' })
        .eq('ai_commentary_status', 'pending');

      const { data: processedQuestions, error: processedError } = await supabase
        .from('questions')
        .select('id', { count: 'exact' })
        .eq('ai_commentary_status', 'completed');

      const { data: commentedQuestions, error: commentedError } = await supabase
        .from('ai_answer_comments')
        .select('question_id', { count: 'exact' });

      if (totalError || pendingError || processedError || commentedError) {
        console.error('Error fetching stats:', { totalError, pendingError, processedError, commentedError });
        return null;
      }

      return {
        total: totalQuestions?.length || 0,
        pending: pendingQuestions?.length || 0,
        processed: processedQuestions?.length || 0,
        withComments: commentedQuestions?.length || 0
      };
    } catch (error) {
      console.error('Error getting processing stats:', error);
      return null;
    }
  }
}

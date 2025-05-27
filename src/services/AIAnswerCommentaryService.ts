
import { supabase } from '@/integrations/supabase/client';
import { AIAnswerComments, AICommentarySummaryExtended, AICommentaryData } from '@/types/AIAnswerComments';

// Define the expected structure for ai_answer_comments
interface AIAnswerCommentsRow {
  id: string;
  question_id: string;
  openai_general_comment?: string | null;
  claude_general_comment?: string | null;
  gemini_general_comment?: string | null;
  openai_comment_a?: string | null;
  openai_comment_b?: string | null;
  openai_comment_c?: string | null;
  openai_comment_d?: string | null;
  openai_comment_e?: string | null;
  claude_comment_a?: string | null;
  claude_comment_b?: string | null;
  claude_comment_c?: string | null;
  claude_comment_d?: string | null;
  claude_comment_e?: string | null;
  gemini_comment_a?: string | null;
  gemini_comment_b?: string | null;
  gemini_comment_c?: string | null;
  gemini_comment_d?: string | null;
  gemini_comment_e?: string | null;
  processing_status: string;
  created_at: string;
  updated_at: string;
}

export class AIAnswerCommentaryService {
  static async getCommentaryForQuestion(questionId: string): Promise<AICommentaryData | null> {
    try {
      // Direct query to ai_answer_comments table with proper error handling
      let answerComments: AIAnswerCommentsRow | null = null;
      
      try {
        const { data: answerCommentsData, error: answerError } = await supabase
          .from('questions')
          .select(`
            ai_answer_comments!inner(*)
          `)
          .eq('id', questionId)
          .single();

        if (!answerError && answerCommentsData?.ai_answer_comments) {
          answerComments = answerCommentsData.ai_answer_comments as unknown as AIAnswerCommentsRow;
        }
      } catch (joinError) {
        console.log('Join query failed, trying direct approach');
        
        // Fallback: try to get answer comments directly by question_id
        try {
          const { data: directData, error: directError } = await supabase
            .from('questions')
            .select('*')
            .eq('id', questionId)
            .single();
          
          if (!directError && directData) {
            // Since we can't access ai_answer_comments directly, we'll return null for now
            // This will be handled gracefully by the UI
            console.log('Question found but no direct access to ai_answer_comments table');
          }
        } catch (directError) {
          console.log('Direct query also failed:', directError);
        }
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
          general: answerComments?.openai_general_comment || undefined,
          answers: {
            a: answerComments?.openai_comment_a || undefined,
            b: answerComments?.openai_comment_b || undefined,
            c: answerComments?.openai_comment_c || undefined,
            d: answerComments?.openai_comment_d || undefined,
            e: answerComments?.openai_comment_e || undefined,
          }
        },
        claude: {
          general: answerComments?.claude_general_comment || undefined,
          answers: {
            a: answerComments?.claude_comment_a || undefined,
            b: answerComments?.claude_comment_b || undefined,
            c: answerComments?.claude_comment_c || undefined,
            d: answerComments?.claude_comment_d || undefined,
            e: answerComments?.claude_comment_e || undefined,
          }
        },
        gemini: {
          general: answerComments?.gemini_general_comment || undefined,
          answers: {
            a: answerComments?.gemini_comment_a || undefined,
            b: answerComments?.gemini_comment_b || undefined,
            c: answerComments?.gemini_comment_c || undefined,
            d: answerComments?.gemini_comment_d || undefined,
            e: answerComments?.gemini_comment_e || undefined,
          }
        }
      };

      return {
        answerComments: answerComments ? {
          id: answerComments.id,
          question_id: answerComments.question_id,
          openai_general_comment: answerComments.openai_general_comment,
          claude_general_comment: answerComments.claude_general_comment,
          gemini_general_comment: answerComments.gemini_general_comment,
          openai_comment_a: answerComments.openai_comment_a,
          openai_comment_b: answerComments.openai_comment_b,
          openai_comment_c: answerComments.openai_comment_c,
          openai_comment_d: answerComments.openai_comment_d,
          openai_comment_e: answerComments.openai_comment_e,
          claude_comment_a: answerComments.claude_comment_a,
          claude_comment_b: answerComments.claude_comment_b,
          claude_comment_c: answerComments.claude_comment_c,
          claude_comment_d: answerComments.claude_comment_d,
          claude_comment_e: answerComments.claude_comment_e,
          gemini_comment_a: answerComments.gemini_comment_a,
          gemini_comment_b: answerComments.gemini_comment_b,
          gemini_comment_c: answerComments.gemini_comment_c,
          gemini_comment_d: answerComments.gemini_comment_d,
          gemini_comment_e: answerComments.gemini_comment_e,
          processing_status: answerComments.processing_status,
          created_at: answerComments.created_at,
          updated_at: answerComments.updated_at,
        } : undefined,
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

      // Use completed questions as proxy for questions with comments
      const { data: questionsWithComments, error: commentsError } = await supabase
        .from('questions')
        .select('id', { count: 'exact' })
        .eq('ai_commentary_status', 'completed');

      if (totalError || pendingError || processedError || commentsError) {
        console.error('Error fetching stats:', { totalError, pendingError, processedError, commentsError });
        return null;
      }

      return {
        total: totalQuestions?.length || 0,
        pending: pendingQuestions?.length || 0,
        processed: processedQuestions?.length || 0,
        withComments: questionsWithComments?.length || 0
      };
    } catch (error) {
      console.error('Error getting processing stats:', error);
      return null;
    }
  }
}

import { supabase } from '@/integrations/supabase/client';
import { AIAnswerComments, AICommentarySummaryExtended, AICommentaryData } from '@/types/AIAnswerComments';

// Define the expected structure for ai_answer_comments
interface AIAnswerCommentsRow {
  id: string;
  question_id: string;
  // Legacy columns
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
  // New model columns
  chatgpt_chosen_answer?: string | null;
  chatgpt_general_comment?: string | null;
  chatgpt_comment_a?: string | null;
  chatgpt_comment_b?: string | null;
  chatgpt_comment_c?: string | null;
  chatgpt_comment_d?: string | null;
  chatgpt_comment_e?: string | null;
  chatgpt_regenerated_question?: string | null;
  chatgpt_regenerated_option_a?: string | null;
  chatgpt_regenerated_option_b?: string | null;
  chatgpt_regenerated_option_c?: string | null;
  chatgpt_regenerated_option_d?: string | null;
  chatgpt_regenerated_option_e?: string | null;
  gemini_chosen_answer?: string | null;
  gemini_new_general_comment?: string | null;
  gemini_new_comment_a?: string | null;
  gemini_new_comment_b?: string | null;
  gemini_new_comment_c?: string | null;
  gemini_new_comment_d?: string | null;
  gemini_new_comment_e?: string | null;
  gemini_regenerated_question?: string | null;
  gemini_regenerated_option_a?: string | null;
  gemini_regenerated_option_b?: string | null;
  gemini_regenerated_option_c?: string | null;
  gemini_regenerated_option_d?: string | null;
  gemini_regenerated_option_e?: string | null;
  mistral_chosen_answer?: string | null;
  mistral_general_comment?: string | null;
  mistral_comment_a?: string | null;
  mistral_comment_b?: string | null;
  mistral_comment_c?: string | null;
  mistral_comment_d?: string | null;
  mistral_comment_e?: string | null;
  perplexity_chosen_answer?: string | null;
  perplexity_general_comment?: string | null;
  perplexity_comment_a?: string | null;
  perplexity_comment_b?: string | null;
  perplexity_comment_c?: string | null;
  perplexity_comment_d?: string | null;
  perplexity_comment_e?: string | null;
  deepseek_chosen_answer?: string | null;
  deepseek_general_comment?: string | null;
  deepseek_comment_a?: string | null;
  deepseek_comment_b?: string | null;
  deepseek_comment_c?: string | null;
  deepseek_comment_d?: string | null;
  deepseek_comment_e?: string | null;
  processing_status: string;
  created_at: string;
  updated_at: string;
}

export class AIAnswerCommentaryService {
  static async getCommentaryForQuestion(questionId: string): Promise<AICommentaryData | null> {
    try {
      // Try to get answer comments - using the more direct approach first
      let answerComments: AIAnswerCommentsRow | null = null;
      
      try {
        const { data: answerCommentsData, error: answerError } = await supabase
          .from('ai_answer_comments')
          .select('*')
          .eq('question_id', questionId)
          .maybeSingle();

        if (!answerError && answerCommentsData) {
          answerComments = answerCommentsData as AIAnswerCommentsRow;
        }
      } catch (answerError) {
        console.log('Direct answer comments query failed:', answerError);
      }

      // Fetch summary comments - get the most recent one to avoid multiple rows error
      let summary: AICommentarySummaryExtended | null = null;
      try {
        const { data: summaryData, error: summaryError } = await supabase
          .from('ai_commentary_summaries')
          .select('*')
          .eq('question_id', questionId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!summaryError && summaryData) {
          summary = summaryData as AICommentarySummaryExtended;
        } else if (summaryError) {
          console.error('Error fetching summary comments:', summaryError);
        }
      } catch (summaryError) {
        console.error('Summary query failed:', summaryError);
      }

      if (!answerComments && !summary) {
        return null;
      }

      // Check if new model columns exist (backwards compatibility check)
      const hasNewModels = !!(
        answerComments?.chatgpt_general_comment ||
        answerComments?.mistral_general_comment ||
        answerComments?.perplexity_general_comment ||
        answerComments?.deepseek_general_comment ||
        answerComments?.gemini_new_general_comment
      );

      // Transform data into structured format
      const models: AICommentaryData['models'] = {};

      if (hasNewModels) {
        // Only include new models if they exist
        if (answerComments?.chatgpt_general_comment || answerComments?.chatgpt_comment_a) {
          models.chatgpt = {
            general: answerComments.chatgpt_general_comment || undefined,
            chosenAnswer: answerComments.chatgpt_chosen_answer || undefined,
            answers: {
              a: answerComments.chatgpt_comment_a || undefined,
              b: answerComments.chatgpt_comment_b || undefined,
              c: answerComments.chatgpt_comment_c || undefined,
              d: answerComments.chatgpt_comment_d || undefined,
              e: answerComments.chatgpt_comment_e || undefined,
            }
          };
        }

        if (answerComments?.gemini_new_general_comment || answerComments?.gemini_new_comment_a) {
          models['new-gemini'] = {
            general: answerComments.gemini_new_general_comment || undefined,
            chosenAnswer: answerComments.gemini_chosen_answer || undefined,
            answers: {
              a: answerComments.gemini_new_comment_a || undefined,
              b: answerComments.gemini_new_comment_b || undefined,
              c: answerComments.gemini_new_comment_c || undefined,
              d: answerComments.gemini_new_comment_d || undefined,
              e: answerComments.gemini_new_comment_e || undefined,
            }
          };
        }

        if (answerComments?.mistral_general_comment || answerComments?.mistral_comment_a) {
          models.mistral = {
            general: answerComments.mistral_general_comment || undefined,
            chosenAnswer: answerComments.mistral_chosen_answer || undefined,
            answers: {
              a: answerComments.mistral_comment_a || undefined,
              b: answerComments.mistral_comment_b || undefined,
              c: answerComments.mistral_comment_c || undefined,
              d: answerComments.mistral_comment_d || undefined,
              e: answerComments.mistral_comment_e || undefined,
            }
          };
        }

        if (answerComments?.perplexity_general_comment || answerComments?.perplexity_comment_a) {
          models.perplexity = {
            general: answerComments.perplexity_general_comment || undefined,
            chosenAnswer: answerComments.perplexity_chosen_answer || undefined,
            answers: {
              a: answerComments.perplexity_comment_a || undefined,
              b: answerComments.perplexity_comment_b || undefined,
              c: answerComments.perplexity_comment_c || undefined,
              d: answerComments.perplexity_comment_d || undefined,
              e: answerComments.perplexity_comment_e || undefined,
            }
          };
        }

        if (answerComments?.deepseek_general_comment || answerComments?.deepseek_comment_a) {
          models.deepseek = {
            general: answerComments.deepseek_general_comment || undefined,
            chosenAnswer: answerComments.deepseek_chosen_answer || undefined,
            answers: {
              a: answerComments.deepseek_comment_a || undefined,
              b: answerComments.deepseek_comment_b || undefined,
              c: answerComments.deepseek_comment_c || undefined,
              d: answerComments.deepseek_comment_d || undefined,
              e: answerComments.deepseek_comment_e || undefined,
            }
          };
        }
      } else {
        // Only include legacy models if new models don't exist
        if (answerComments?.openai_general_comment || answerComments?.openai_comment_a) {
          models.openai = {
            general: answerComments.openai_general_comment || undefined,
            answers: {
              a: answerComments.openai_comment_a || undefined,
              b: answerComments.openai_comment_b || undefined,
              c: answerComments.openai_comment_c || undefined,
              d: answerComments.openai_comment_d || undefined,
              e: answerComments.openai_comment_e || undefined,
            }
          };
        }

        if (answerComments?.claude_general_comment || answerComments?.claude_comment_a) {
          models.claude = {
            general: answerComments.claude_general_comment || undefined,
            answers: {
              a: answerComments.claude_comment_a || undefined,
              b: answerComments.claude_comment_b || undefined,
              c: answerComments.claude_comment_c || undefined,
              d: answerComments.claude_comment_d || undefined,
              e: answerComments.claude_comment_e || undefined,
            }
          };
        }

        if (answerComments?.gemini_general_comment || answerComments?.gemini_comment_a) {
          models.gemini = {
            general: answerComments.gemini_general_comment || undefined,
            answers: {
              a: answerComments.gemini_comment_a || undefined,
              b: answerComments.gemini_comment_b || undefined,
              c: answerComments.gemini_comment_c || undefined,
              d: answerComments.gemini_comment_d || undefined,
              e: answerComments.gemini_comment_e || undefined,
            }
          };
        }
      }

      return {
        answerComments: answerComments ? {
          id: answerComments.id,
          question_id: answerComments.question_id,
          // Legacy fields
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
          // New model fields
          chatgpt_chosen_answer: answerComments.chatgpt_chosen_answer,
          chatgpt_general_comment: answerComments.chatgpt_general_comment,
          chatgpt_comment_a: answerComments.chatgpt_comment_a,
          chatgpt_comment_b: answerComments.chatgpt_comment_b,
          chatgpt_comment_c: answerComments.chatgpt_comment_c,
          chatgpt_comment_d: answerComments.chatgpt_comment_d,
          chatgpt_comment_e: answerComments.chatgpt_comment_e,
          chatgpt_regenerated_question: answerComments.chatgpt_regenerated_question,
          chatgpt_regenerated_option_a: answerComments.chatgpt_regenerated_option_a,
          chatgpt_regenerated_option_b: answerComments.chatgpt_regenerated_option_b,
          chatgpt_regenerated_option_c: answerComments.chatgpt_regenerated_option_c,
          chatgpt_regenerated_option_d: answerComments.chatgpt_regenerated_option_d,
          chatgpt_regenerated_option_e: answerComments.chatgpt_regenerated_option_e,
          gemini_chosen_answer: answerComments.gemini_chosen_answer,
          gemini_new_general_comment: answerComments.gemini_new_general_comment,
          gemini_new_comment_a: answerComments.gemini_new_comment_a,
          gemini_new_comment_b: answerComments.gemini_new_comment_b,
          gemini_new_comment_c: answerComments.gemini_new_comment_c,
          gemini_new_comment_d: answerComments.gemini_new_comment_d,
          gemini_new_comment_e: answerComments.gemini_new_comment_e,
          gemini_regenerated_question: answerComments.gemini_regenerated_question,
          gemini_regenerated_option_a: answerComments.gemini_regenerated_option_a,
          gemini_regenerated_option_b: answerComments.gemini_regenerated_option_b,
          gemini_regenerated_option_c: answerComments.gemini_regenerated_option_c,
          gemini_regenerated_option_d: answerComments.gemini_regenerated_option_d,
          gemini_regenerated_option_e: answerComments.gemini_regenerated_option_e,
          mistral_chosen_answer: answerComments.mistral_chosen_answer,
          mistral_general_comment: answerComments.mistral_general_comment,
          mistral_comment_a: answerComments.mistral_comment_a,
          mistral_comment_b: answerComments.mistral_comment_b,
          mistral_comment_c: answerComments.mistral_comment_c,
          mistral_comment_d: answerComments.mistral_comment_d,
          mistral_comment_e: answerComments.mistral_comment_e,
          perplexity_chosen_answer: answerComments.perplexity_chosen_answer,
          perplexity_general_comment: answerComments.perplexity_general_comment,
          perplexity_comment_a: answerComments.perplexity_comment_a,
          perplexity_comment_b: answerComments.perplexity_comment_b,
          perplexity_comment_c: answerComments.perplexity_comment_c,
          perplexity_comment_d: answerComments.perplexity_comment_d,
          perplexity_comment_e: answerComments.perplexity_comment_e,
          deepseek_chosen_answer: answerComments.deepseek_chosen_answer,
          deepseek_general_comment: answerComments.deepseek_general_comment,
          deepseek_comment_a: answerComments.deepseek_comment_a,
          deepseek_comment_b: answerComments.deepseek_comment_b,
          deepseek_comment_c: answerComments.deepseek_comment_c,
          deepseek_comment_d: answerComments.deepseek_comment_d,
          deepseek_comment_e: answerComments.deepseek_comment_e,
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

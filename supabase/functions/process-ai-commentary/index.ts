import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
// Rate limiting configuration
// We support 5 explicit models for commentary generation:
// - chatgpt   (OpenAI)
// - gemini    (Google Gemini)
// - mistral   (Mistral AI)
// - perplexity (Perplexity AI)
// - deepseek  (Deepseek)
const RATE_LIMITS = {
  chatgpt: {
    maxConcurrent: 5,
    delayMs: 100
  },
  gemini: {
    maxConcurrent: 4,
    delayMs: 150
  },
  mistral: {
    maxConcurrent: 1,
    delayMs: 500
  },
  perplexity: {
    maxConcurrent: 3,
    delayMs: 300
  },
  deepseek: {
    maxConcurrent: 3,
    delayMs: 300
  }
};
// Timeout configuration (in milliseconds)
const API_TIMEOUT = 60000; // 60 seconds per API call
// Simple rate limiter implementation
class RateLimiter {
  maxConcurrent;
  delayMs;
  queue;
  activeCount;
  constructor(maxConcurrent, delayMs){
    this.maxConcurrent = maxConcurrent;
    this.delayMs = delayMs;
    this.queue = [];
    this.activeCount = 0;
  }
  async acquire() {
    if (this.activeCount >= this.maxConcurrent) {
      await new Promise((resolve)=>this.queue.push(resolve));
    }
    this.activeCount++;
    if (this.delayMs > 0) {
      await new Promise((resolve)=>setTimeout(resolve, this.delayMs));
    }
  }
  release() {
    this.activeCount--;
    const next = this.queue.shift();
    if (next) next();
  }
}
// Create rate limiters for each model
const rateLimiters: {
  [key in 'chatgpt' | 'gemini' | 'mistral' | 'perplexity' | 'deepseek']: RateLimiter;
} = {
  chatgpt: new RateLimiter(RATE_LIMITS.chatgpt.maxConcurrent, RATE_LIMITS.chatgpt.delayMs),
  gemini: new RateLimiter(RATE_LIMITS.gemini.maxConcurrent, RATE_LIMITS.gemini.delayMs),
  mistral: new RateLimiter(RATE_LIMITS.mistral.maxConcurrent, RATE_LIMITS.mistral.delayMs),
  perplexity: new RateLimiter(RATE_LIMITS.perplexity.maxConcurrent, RATE_LIMITS.perplexity.delayMs),
  deepseek: new RateLimiter(RATE_LIMITS.deepseek.maxConcurrent, RATE_LIMITS.deepseek.delayMs)
};
// Helper function to add timeout to promises
function withTimeout(promise, timeoutMs, errorMessage) {
  return Promise.race([
    promise,
    new Promise((_, reject)=>setTimeout(()=>reject(new Error(errorMessage)), timeoutMs))
  ]);
}
// Helper function to properly log Supabase errors
function logSupabaseError(context, error, additionalData) {
  console.error(`${context}:`, {
    message: error?.message || 'Unknown error',
    details: error?.details || null,
    hint: error?.hint || null,
    code: error?.code || null,
    fullError: String(error)
  });
  if (additionalData) {
    console.error(`${context} - Additional Data:`, JSON.stringify(additionalData, null, 2));
  }
}
serve(async (req)=>{
  console.log('Edge Function Version: 4.0 - 5 Models');
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    console.log('AI Commentary processing started');
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);
    // Get AI commentary settings
    const { data: settings, error: settingsError } = await supabase.from('ai_commentary_settings').select('*').single();
    if (settingsError) {
      console.error('Error fetching settings:', settingsError);
      return new Response(JSON.stringify({
        error: 'Settings not found'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const aiSettings = {
      batch_size: settings.batch_size || 5,
      processing_delay_minutes: settings.processing_delay_minutes || 60,
      models_enabled: settings.models_enabled
    };
    console.log('Settings loaded:', aiSettings);
    // Check if feature is enabled
    if (!settings.feature_enabled) {
      console.log('AI Commentary feature is disabled');
      return new Response(JSON.stringify({
        message: 'AI Commentary feature is disabled',
        processed: 0
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Calculate the delay threshold
    const delayThreshold = new Date();
    delayThreshold.setMinutes(delayThreshold.getMinutes() - aiSettings.processing_delay_minutes);
    // Get pending questions that are older than the delay threshold
    const { data: pendingCandidates, error: pendingError } = await supabase.from('questions').select('id, ai_commentary_status').eq('ai_commentary_status', 'pending').lt('ai_commentary_queued_at', delayThreshold.toISOString()).limit(aiSettings.batch_size);
    if (pendingError) {
      console.error('Error fetching pending questions:', pendingError);
      return new Response(JSON.stringify({
        error: 'Failed to fetch pending questions'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Also get questions stuck in processing state for more than 30 minutes
    const stuckThreshold = new Date();
    stuckThreshold.setMinutes(stuckThreshold.getMinutes() - 30); // 30 minutes timeout for processing
    const { data: stuckCandidates, error: stuckError } = await supabase.from('questions').select('id, ai_commentary_status').eq('ai_commentary_status', 'processing').lt('ai_commentary_queued_at', stuckThreshold.toISOString()).limit(aiSettings.batch_size);
    if (stuckError) {
      console.error('Error fetching stuck processing questions:', stuckError);
      return new Response(JSON.stringify({
        error: 'Failed to fetch stuck questions'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Get questions that have commentary but are missing summaries
    // First get all questions that have commentary
    const { data: questionsWithCommentary, error: commentaryError } = await supabase.from('ai_answer_comments').select('question_id').limit(aiSettings.batch_size * 2);
    if (commentaryError) {
      console.error('Error fetching questions with commentary:', commentaryError);
      return new Response(JSON.stringify({
        error: 'Failed to fetch questions with commentary'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Get all questions that have summaries
    const { data: questionsWithSummaries, error: summariesError2 } = await supabase.from('ai_commentary_summaries').select('question_id');
    if (summariesError2) {
      console.error('Error fetching questions with summaries:', summariesError2);
      return new Response(JSON.stringify({
        error: 'Failed to fetch questions with summaries'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Find questions that have commentary but no summaries
    const summaryQuestionIds = new Set(questionsWithSummaries?.map((q)=>q.question_id) || []);
    const needingSummaryIds = (questionsWithCommentary || []).map((q)=>q.question_id).filter((id)=>!summaryQuestionIds.has(id)).slice(0, aiSettings.batch_size);
    // Get the actual question records for those needing summaries
    let commentaryOnlyQuestions = [];
    if (needingSummaryIds.length > 0) {
      const { data: questionsNeedingSummaries, error: commentaryOnlyError } = await supabase.from('questions').select('id, ai_commentary_status').in('id', needingSummaryIds).in('ai_commentary_status', [
        'completed',
        'processing'
      ]);
      if (commentaryOnlyError) {
        console.error('Error fetching questions needing summaries:', commentaryOnlyError);
        return new Response(JSON.stringify({
          error: 'Failed to fetch questions needing summaries'
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      commentaryOnlyQuestions = questionsNeedingSummaries || [];
    }
    // Combine candidates
    const candidateQuestions = [
      ...pendingCandidates || [],
      ...stuckCandidates || [],
      ...commentaryOnlyQuestions || []
    ];
    if (!candidateQuestions || candidateQuestions.length === 0) {
      return new Response(JSON.stringify({
        message: 'No new questions to process at this time.',
        processed: 0
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log(`Found ${pendingCandidates?.length || 0} pending, ${stuckCandidates?.length || 0} stuck processing, and ${commentaryOnlyQuestions?.length || 0} questions needing summaries`);
    const candidateIds = candidateQuestions.map((q)=>q.id);
    // For the candidates, check which ones already have comments or summaries
    // Also fetch general comments to check for errors
    const { data: existingComments, error: commentsError } = await supabase.from('ai_answer_comments').select('question_id, openai_general_comment, gemini_general_comment, chatgpt_general_comment, mistral_general_comment, perplexity_general_comment, deepseek_general_comment').in('question_id', candidateIds);
    if (commentsError) {
      console.error('Error checking for existing comments:', commentsError);
      return new Response(JSON.stringify({
        error: 'Failed to check for existing comments'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const { data: existingSummaries, error: summariesError } = await supabase.from('ai_commentary_summaries').select('question_id').in('question_id', candidateIds);
    if (summariesError) {
      console.error('Error checking for existing summaries:', summariesError);
      return new Response(JSON.stringify({
        error: 'Failed to check for existing summaries'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Create a set of question IDs that have errors in their general comments
    const questionsWithErrors = new Set();
    if (existingComments) {
      for (const comment of existingComments){
        const hasError = (comment.openai_general_comment && comment.openai_general_comment.includes('Fehler:')) || (comment.gemini_general_comment && comment.gemini_general_comment.includes('Fehler:')) || (comment.chatgpt_general_comment && comment.chatgpt_general_comment.includes('Fehler:')) || (comment.mistral_general_comment && comment.mistral_general_comment.includes('Fehler:')) || (comment.perplexity_general_comment && comment.perplexity_general_comment.includes('Fehler:')) || (comment.deepseek_general_comment && comment.deepseek_general_comment.includes('Fehler:'));
        if (hasError) {
          questionsWithErrors.add(comment.question_id);
          console.log(`Question ${comment.question_id} has error in general comments, will be reprocessed`);
        }
      }
    }
    const existingQuestionIds = new Set([
      ...existingComments?.map((item)=>item.question_id) || [],
      ...existingSummaries?.map((item)=>item.question_id) || []
    ]);
    const idsToProcessRaw = [];
    const idsToCleanup = [];
    for (const id of candidateIds){
      if (existingQuestionIds.has(id)) {
        // Check if this question has errors in its general comments
        if (questionsWithErrors.has(id)) {
          // This question has errors, reprocess it
          idsToProcessRaw.push(id);
        } else if ((commentaryOnlyQuestions || []).some((q)=>q.id === id)) {
          // This question needs summary generation, don't clean it up
          idsToProcessRaw.push(id);
        } else {
          // This question is truly stuck/completed, clean it up
          idsToCleanup.push(id);
        }
      } else {
        idsToProcessRaw.push(id);
      }
    }
    // Asynchronously clean up questions that are marked 'pending' but already have commentary AND summaries
    if (idsToCleanup.length > 0) {
      console.log(`Found ${idsToCleanup.length} questions that already have both commentary and summaries. Cleaning them up.`);
      supabase.from('questions').update({
        ai_commentary_status: 'completed',
        ai_commentary_processed_at: new Date().toISOString()
      }).in('id', idsToCleanup).eq('ai_commentary_status', 'pending').then(({ error })=>{
        if (error) {
          logSupabaseError('Error cleaning up completed questions', error, {
            count: idsToCleanup.length
          });
        } else {
          console.log(`Successfully cleaned up ${idsToCleanup.length} completed questions.`);
        }
      });
    }
    const idsToProcess = idsToProcessRaw.slice(0, aiSettings.batch_size);
    if (idsToProcess.length === 0) {
      console.log('No new questions to process in this batch, waiting for new questions.');
      return new Response(JSON.stringify({
        message: 'No new questions to process in this batch.',
        processed: 0
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Atomically claim the questions to process
    const { data: pendingQuestions, error: claimError } = await supabase.from('questions').update({
      ai_commentary_status: 'processing'
    }).in('id', idsToProcess).select('*');
    if (claimError) {
      console.error('Error claiming questions for processing:', claimError);
      return new Response(JSON.stringify({
        error: 'Failed to claim questions'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log(`Claimed ${pendingQuestions?.length || 0} questions for processing.`);
    if (!pendingQuestions || pendingQuestions.length === 0) {
      return new Response(JSON.stringify({
        message: 'No questions to process',
        processed: 0
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    let processedCount = 0;
    // Map settings to supported model keys for the new 5-model setup
    const SUPPORTED_MODELS = [
      'chatgpt',
      'gemini',
      'mistral',
      'perplexity',
      'deepseek'
    ] as const;
    const enabledModels = Object.entries(aiSettings.models_enabled || {}).filter(([model, enabled])=>enabled && SUPPORTED_MODELS.includes(model as any)).map(([model])=>model);
    const unknownModels = Object.keys(aiSettings.models_enabled || {}).filter((model)=>!SUPPORTED_MODELS.includes(model as any));
    console.log('Enabled models (filtered to supported models):', enabledModels);
    if (unknownModels.length > 0) {
      console.log('Ignoring unsupported models in ai_commentary_settings.models_enabled:', unknownModels);
    }
    // Configure concurrent processing
    const MAX_CONCURRENT_QUESTIONS = 3; // Process up to 3 questions at the same time
    const questionBatches = [];
    // Split questions into batches for controlled concurrent processing
    for(let i = 0; i < pendingQuestions.length; i += MAX_CONCURRENT_QUESTIONS){
      questionBatches.push(pendingQuestions.slice(i, i + MAX_CONCURRENT_QUESTIONS));
    }
    console.log(`Processing ${pendingQuestions.length} questions in ${questionBatches.length} batches`);
    const allResults = [];
    // Process batches sequentially, but questions within each batch in parallel
    for (const [batchIndex, batch] of questionBatches.entries()){
      console.log(`Processing batch ${batchIndex + 1} of ${questionBatches.length} (${batch.length} questions)`);
      // Process all questions in current batch in parallel
      const batchResults = await Promise.allSettled(batch.map(async (question)=>{
        try {
          // NOTE: Status is already updated to 'processing' during the claim phase
          console.log(`Processing question ${question.id}`);
          // Check if this question already has commentary
          const { data: existingCommentary, error: commentaryCheckError } = await supabase.from('ai_answer_comments').select('*').eq('question_id', question.id).single();
          let answerComments: Record<string, any> = {};
          let shouldRegenerateCommentary = false;
          if (existingCommentary && !commentaryCheckError) {
            // Check if any general comment contains "Fehler:"
            const hasError = (existingCommentary.openai_general_comment && existingCommentary.openai_general_comment.includes('Fehler:')) || (existingCommentary.gemini_general_comment && existingCommentary.gemini_general_comment.includes('Fehler:')) || (existingCommentary.chatgpt_general_comment && existingCommentary.chatgpt_general_comment.includes('Fehler:')) || (existingCommentary.mistral_general_comment && existingCommentary.mistral_general_comment.includes('Fehler:')) || (existingCommentary.perplexity_general_comment && existingCommentary.perplexity_general_comment.includes('Fehler:')) || (existingCommentary.deepseek_general_comment && existingCommentary.deepseek_general_comment.includes('Fehler:'));
            if (hasError) {
              // Commentary has errors, regenerate it
              console.log(`Question ${question.id} has errors in existing commentary, regenerating`);
              shouldRegenerateCommentary = true;
            } else {
              // Question already has commentary without errors, use existing data
              console.log(`Question ${question.id} already has commentary, using existing data`);
              // Build unified answerComments map from new and legacy columns
              const buildModelFromColumns = (modelKey)=>{
                switch(modelKey){
                  case 'chatgpt':
                    return existingCommentary.chatgpt_general_comment || existingCommentary.openai_general_comment ? {
                      chosen_answer: existingCommentary.chatgpt_chosen_answer || null,
                      general_comment: existingCommentary.chatgpt_general_comment || existingCommentary.openai_general_comment,
                      comment_a: existingCommentary.chatgpt_comment_a || existingCommentary.openai_comment_a,
                      comment_b: existingCommentary.chatgpt_comment_b || existingCommentary.openai_comment_b,
                      comment_c: existingCommentary.chatgpt_comment_c || existingCommentary.openai_comment_c,
                      comment_d: existingCommentary.chatgpt_comment_d || existingCommentary.openai_comment_d,
                      comment_e: existingCommentary.chatgpt_comment_e || existingCommentary.openai_comment_e,
                      regenerated_question: existingCommentary.chatgpt_regenerated_question || null,
                      regenerated_option_a: existingCommentary.chatgpt_regenerated_option_a || null,
                      regenerated_option_b: existingCommentary.chatgpt_regenerated_option_b || null,
                      regenerated_option_c: existingCommentary.chatgpt_regenerated_option_c || null,
                      regenerated_option_d: existingCommentary.chatgpt_regenerated_option_d || null,
                      regenerated_option_e: existingCommentary.chatgpt_regenerated_option_e || null,
                      processing_status: 'completed'
                    } : undefined;
                  case 'gemini':
                    return existingCommentary.gemini_general_comment || existingCommentary.gemini_general_comment ? {
                      chosen_answer: existingCommentary.gemini_chosen_answer || null,
                      general_comment: existingCommentary.gemini_new_general_comment,
                      comment_a: existingCommentary.gemini_new_comment_a,
                      comment_b: existingCommentary.gemini_new_comment_b,
                      comment_c: existingCommentary.gemini_new_comment_c,
                      comment_d: existingCommentary.gemini_new_comment_d,
                      comment_e: existingCommentary.gemini_new_comment_e,
                      regenerated_question: existingCommentary.gemini_regenerated_question || null,
                      regenerated_option_a: existingCommentary.gemini_regenerated_option_a || null,
                      regenerated_option_b: existingCommentary.gemini_regenerated_option_b || null,
                      regenerated_option_c: existingCommentary.gemini_regenerated_option_c || null,
                      regenerated_option_d: existingCommentary.gemini_regenerated_option_d || null,
                      regenerated_option_e: existingCommentary.gemini_regenerated_option_e || null,
                      processing_status: 'completed'
                    } : undefined;
                  case 'mistral':
                    return existingCommentary.mistral_general_comment ? {
                      chosen_answer: existingCommentary.mistral_chosen_answer || null,
                      general_comment: existingCommentary.mistral_general_comment,
                      comment_a: existingCommentary.mistral_comment_a,
                      comment_b: existingCommentary.mistral_comment_b,
                      comment_c: existingCommentary.mistral_comment_c,
                      comment_d: existingCommentary.mistral_comment_d,
                      comment_e: existingCommentary.mistral_comment_e,
                      processing_status: 'completed'
                    } : undefined;
                  case 'perplexity':
                    return existingCommentary.perplexity_general_comment ? {
                      chosen_answer: existingCommentary.perplexity_chosen_answer || null,
                      general_comment: existingCommentary.perplexity_general_comment,
                      comment_a: existingCommentary.perplexity_comment_a,
                      comment_b: existingCommentary.perplexity_comment_b,
                      comment_c: existingCommentary.perplexity_comment_c,
                      comment_d: existingCommentary.perplexity_comment_d,
                      comment_e: existingCommentary.perplexity_comment_e,
                      processing_status: 'completed'
                    } : undefined;
                  case 'deepseek':
                    return existingCommentary.deepseek_general_comment ? {
                      chosen_answer: existingCommentary.deepseek_chosen_answer || null,
                      general_comment: existingCommentary.deepseek_general_comment,
                      comment_a: existingCommentary.deepseek_comment_a,
                      comment_b: existingCommentary.deepseek_comment_b,
                      comment_c: existingCommentary.deepseek_comment_c,
                      comment_d: existingCommentary.deepseek_comment_d,
                      comment_e: existingCommentary.deepseek_comment_e,
                      processing_status: 'completed'
                    } : undefined;
                  default:
                    return undefined;
                }
              };
              answerComments = {
                chatgpt: buildModelFromColumns('chatgpt'),
                gemini: buildModelFromColumns('gemini'),
                mistral: buildModelFromColumns('mistral'),
                perplexity: buildModelFromColumns('perplexity'),
                deepseek: buildModelFromColumns('deepseek')
              };
            }
          }
          if (!existingCommentary || commentaryCheckError || shouldRegenerateCommentary) {
            // Generate new commentaries for all enabled models in parallel
            console.log(`Generating new commentary for question ${question.id}`);
            const modelPromises = enabledModels.map(async (modelName)=>{
              try {
                const commentary = await generateCommentary(question, modelName);
                return {
                  modelName,
                  commentary: commentary ? {
                    ...commentary,
                    processing_status: 'completed'
                  } : null
                };
              } catch (error) {
                console.error(`Error generating commentary for ${modelName}:`, error);
                return {
                  modelName,
                  commentary: {
                    chosen_answer: null,
                    general_comment: `Fehler: ${error.message}`,
                    comment_a: `Fehler: ${error.message}`,
                    comment_b: `Fehler: ${error.message}`,
                    comment_c: `Fehler: ${error.message}`,
                    comment_d: `Fehler: ${error.message}`,
                    comment_e: `Fehler: ${error.message}`,
                    regenerated_question: null,
                    regenerated_option_a: null,
                    regenerated_option_b: null,
                    regenerated_option_c: null,
                    regenerated_option_d: null,
                    regenerated_option_e: null,
                    processing_status: 'failed'
                  }
                };
              }
            });
            // Wait for all model commentaries to complete
            const modelResults = await Promise.all(modelPromises);
            // Convert results to AnswerCommentsMap
            modelResults.forEach(({ modelName, commentary })=>{
              if (commentary) {
                answerComments[modelName] = commentary;
              }
            });
          }
          // Insert or update answer comments to database (only if new commentary was generated)
          if ((!existingCommentary || shouldRegenerateCommentary) && Object.keys(answerComments).length > 0) {
            console.log(`Preparing to ${shouldRegenerateCommentary ? 'update' : 'insert'} comments for question ${question.id}`);
            // Prepare data for insertion with separate columns for each model and answer
            const insertData = {
              question_id: question.id,
              // ChatGPT (primary OpenAI mapping)
              chatgpt_chosen_answer: answerComments.chatgpt?.chosen_answer || null,
              chatgpt_general_comment: answerComments.chatgpt?.general_comment || null,
              chatgpt_comment_a: answerComments.chatgpt?.comment_a || null,
              chatgpt_comment_b: answerComments.chatgpt?.comment_b || null,
              chatgpt_comment_c: answerComments.chatgpt?.comment_c || null,
              chatgpt_comment_d: answerComments.chatgpt?.comment_d || null,
              chatgpt_comment_e: answerComments.chatgpt?.comment_e || null,
              chatgpt_regenerated_question: answerComments.chatgpt?.regenerated_question || null,
              chatgpt_regenerated_option_a: answerComments.chatgpt?.regenerated_option_a || null,
              chatgpt_regenerated_option_b: answerComments.chatgpt?.regenerated_option_b || null,
              chatgpt_regenerated_option_c: answerComments.chatgpt?.regenerated_option_c || null,
              chatgpt_regenerated_option_d: answerComments.chatgpt?.regenerated_option_d || null,
              chatgpt_regenerated_option_e: answerComments.chatgpt?.regenerated_option_e || null,
              // Gemini (Google)
              gemini_chosen_answer: answerComments.gemini?.chosen_answer || null,
              gemini_new_general_comment: answerComments.gemini?.general_comment || null,
              gemini_new_comment_a: answerComments.gemini?.comment_a || null,
              gemini_new_comment_b: answerComments.gemini?.comment_b || null,
              gemini_new_comment_c: answerComments.gemini?.comment_c || null,
              gemini_new_comment_d: answerComments.gemini?.comment_d || null,
              gemini_new_comment_e: answerComments.gemini?.comment_e || null,
              gemini_regenerated_question: answerComments.gemini?.regenerated_question || null,
              gemini_regenerated_option_a: answerComments.gemini?.regenerated_option_a || null,
              gemini_regenerated_option_b: answerComments.gemini?.regenerated_option_b || null,
              gemini_regenerated_option_c: answerComments.gemini?.regenerated_option_c || null,
              gemini_regenerated_option_d: answerComments.gemini?.regenerated_option_d || null,
              gemini_regenerated_option_e: answerComments.gemini?.regenerated_option_e || null,
              // Mistral
              mistral_chosen_answer: answerComments.mistral?.chosen_answer || null,
              mistral_general_comment: answerComments.mistral?.general_comment || null,
              mistral_comment_a: answerComments.mistral?.comment_a || null,
              mistral_comment_b: answerComments.mistral?.comment_b || null,
              mistral_comment_c: answerComments.mistral?.comment_c || null,
              mistral_comment_d: answerComments.mistral?.comment_d || null,
              mistral_comment_e: answerComments.mistral?.comment_e || null,
              // Perplexity
              perplexity_chosen_answer: answerComments.perplexity?.chosen_answer || null,
              perplexity_general_comment: answerComments.perplexity?.general_comment || null,
              perplexity_comment_a: answerComments.perplexity?.comment_a || null,
              perplexity_comment_b: answerComments.perplexity?.comment_b || null,
              perplexity_comment_c: answerComments.perplexity?.comment_c || null,
              perplexity_comment_d: answerComments.perplexity?.comment_d || null,
              perplexity_comment_e: answerComments.perplexity?.comment_e || null,
              // Deepseek
              deepseek_chosen_answer: answerComments.deepseek?.chosen_answer || null,
              deepseek_general_comment: answerComments.deepseek?.general_comment || null,
              deepseek_comment_a: answerComments.deepseek?.comment_a || null,
              deepseek_comment_b: answerComments.deepseek?.comment_b || null,
              deepseek_comment_c: answerComments.deepseek?.comment_c || null,
              deepseek_comment_d: answerComments.deepseek?.comment_d || null,
              deepseek_comment_e: answerComments.deepseek?.comment_e || null,
              processing_status: 'completed'
            };
            const { error: insertError } = await supabase.from('ai_answer_comments').upsert(insertData);
            if (insertError) {
              logSupabaseError('Error inserting answer comments', insertError, insertData);
              throw insertError;
            }
          }
          // Update status to completed
          await supabase.from('questions').update({
            ai_commentary_status: 'completed',
            ai_commentary_processed_at: new Date().toISOString()
          }).eq('id', question.id);
          console.log(`Successfully processed question ${question.id}`);
          return {
            success: true,
            questionId: question.id
          };
        } catch (error) {
          console.error(`Error processing question ${question.id}:`, error);
          // Update status to failed
          await supabase.from('questions').update({
            ai_commentary_status: 'failed'
          }).eq('id', question.id);
          return {
            success: false,
            questionId: question.id,
            error: error.message
          };
        }
      }));
      allResults.push(...batchResults);
      // Log batch completion
      const batchSuccessCount = batchResults.filter((result)=>result.status === 'fulfilled' && result.value?.success).length;
      console.log(`Batch ${batchIndex + 1} completed: ${batchSuccessCount}/${batch.length} successful`);
    }
    // Count total successful processes
    processedCount = allResults.filter((result)=>result.status === 'fulfilled' && result.value?.success).length;
    console.log(`AI Commentary processing completed. Processed: ${processedCount} out of ${pendingQuestions.length}`);
    return new Response(JSON.stringify({
      message: 'Processing completed',
      processed: processedCount
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in process-ai-commentary function:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
// Generate commentary using real AI APIs
async function generateCommentary(question, modelName) {
  const prompt = `Analysiere diese Multiple-Choice-Frage und erstelle Kommentare für jede Antwortmöglichkeit:

Frage: ${question.question}
A) ${question.option_a}
B) ${question.option_b}
C) ${question.option_c}
D) ${question.option_d}
E) ${question.option_e}


Erstelle:
1. Einen kurzen, aber gehaltvollen Überblick (3–5 Sätze), der:
	- das Thema der Frage benennt,
	- den relevanten Fachkontext einordnet (z. B. Pathophysiologie, Klinik, Pharmakologie),
	- typische Stolperfallen oder prüfungsrelevante Aspekte hervorhebt,
	- das erwartete Denkmodell/den Lösungsweg skizziert.

2. Kommentar für jede Antwortoption (A–E)
  - Kennzeichne klar, ob die Antwortoption richtig oder falsch ist
  - Erkläre präzise und spezifisch die Begründung
  - Optional: Ergänze kurze Hinweise zu verwechselbaren Konzepten, typischen Fehlannahmen oder Eselsbrücken
  - Verwende medizinisch korrekte, jedoch kompakte Sprache, möglichst auf Deutsch
  - Länge pro Option: 2–4 Sätze`;
  const modelKey = modelName.toLowerCase();
  const rateLimiter = rateLimiters[modelKey];
  if (!rateLimiter) {
    throw new Error(`No rate limiter configured for model: ${modelName}`);
  }
  // Acquire rate limit slot
  await rateLimiter.acquire();
  try {
    let result;
    switch(modelKey){
      case 'chatgpt':
        result = await withTimeout(callChatGPT(prompt), API_TIMEOUT, `ChatGPT API timeout after ${API_TIMEOUT / 1000} seconds`);
        break;
      case 'gemini':
        try {
          result = await withTimeout(callGemini(prompt), API_TIMEOUT, 'Gemini API timeout after 30 seconds');
        } catch (geminiError) {
          // Check if it's a quota error based on the exact Gemini API error structure
          const errorMessage = geminiError.message || '';
          const isQuotaError = errorMessage.includes('429') || errorMessage.toLowerCase().includes('exceeded your current quota') || errorMessage.toLowerCase().includes('resource_exhausted') || errorMessage.toLowerCase().includes('quotafailure') || errorMessage.toLowerCase().includes('generaterequestsperday');
          if (isQuotaError) {
            console.log('Gemini 2.5 Pro quota exceeded, falling back to Gemini 2.5 Flash...');
            // Try Gemini 2.5 Flash as fallback
            try {
              result = await withTimeout(callGeminiFlash(prompt), API_TIMEOUT, `Gemini Flash API timeout after ${API_TIMEOUT / 1000} seconds`);
              console.log('Successfully used Gemini 2.5 Flash as fallback (data will be saved in gemini_* fields)');
            } catch (flashError) {
              console.error('Gemini Flash fallback also failed:', flashError);
              throw new Error(`Both Gemini Pro and Flash failed. Pro: ${geminiError.message}, Flash: ${flashError.message}`);
            }
          } else {
            // If it's not a quota error, throw the original error
            throw geminiError;
          }
        }
        break;
      case 'mistral':
        result = await withTimeout(callMistral(prompt), API_TIMEOUT, `Mistral API timeout after ${API_TIMEOUT / 1000} seconds`);
        break;
      case 'perplexity':
        result = await withTimeout(callPerplexity(prompt), API_TIMEOUT, `Perplexity API timeout after ${API_TIMEOUT / 1000} seconds`);
        break;
      case 'deepseek':
        result = await withTimeout(callDeepseek(prompt), API_TIMEOUT, `Deepseek API timeout after ${API_TIMEOUT / 1000} seconds`);
        break;
      default:
        throw new Error(`Unknown model: ${modelName}`);
    }
    return result;
  } finally{
    // Always release the rate limit slot
    rateLimiter.release();
  }
}
// OpenAI ChatGPT API call (ChatGPT model)
async function callChatGPT(prompt) {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-5.1',
      messages: [
        {
          role: 'system',
          content: `Du bist ein hochqualifizierter medizinischer Fachexperte und Prüfer für Multiple-Choice-Fragen (MC-Fragen) nach Universitäts- und IMPP-Standard. Du analysierst klinisch-theoretische Inhalte präzise, begründest deine Entscheidungen logisch und erkennst typische Prüfungsfallen.
Die Nutzereingabe enthält IMMER genau EINE Multiple-Choice-Frage mit den Antwortoptionen A–E (teilweise können Formulierungen unvollständig, unklar oder sprachlich holprig sein). Du kennst NICHT die offiziell richtige Antwort aus einer Datenbank, sondern entscheidest ausschließlich anhand des übergebenen Fragentextes und der Antwortoptionen.

DEINE GESAMTE ANTWORT MUSS IMMER im folgenden JSON-Format vorliegen:
{
  "chosen_answer": "Ein Buchstabe von A bis E, der die deiner Meinung nach beste Antwort beschreibt",
  "general_comment": "Allgemeiner Kommentar zur Frage",
  "comment_a": "Kurzer Kommentar zu Antwort A",
  "comment_b": "Kurzer Kommentar zu Antwort B",
  "comment_c": "Kurzer Kommentar zu Antwort C",
  "comment_d": "Kurzer Kommentar zu Antwort D",
  "comment_e": "Kurzer Kommentar zu Antwort E",
  "regenerated_question": "Neu formulierte, gut lesbare Version der Frage",
  "regenerated_option_a": "Neu formulierte Antwortoption A (falls leer oder unklar, sinnvoll und fachlich passend ergänzen)",
  "regenerated_option_b": "Neu formulierte Antwortoption B (falls leer oder unklar, sinnvoll und fachlich passend ergänzen)",
  "regenerated_option_c": "Neu formulierte Antwortoption C (falls leer oder unklar, sinnvoll und fachlich passend ergänzen)",
  "regenerated_option_d": "Neu formulierte Antwortoption D (falls leer oder unklar, sinnvoll und fachlich passend ergänzen)",
  "regenerated_option_e": "Neu formulierte Antwortoption E ((falls leer oder unklar, sinnvoll und fachlich passend ergänzen)"
}

STRIKTE VORGABEN:

1. **JSON-Format**
- Antworte AUSNAHMSLOS mit genau EINEM JSON-Objekt.
- KEIN zusätzlicher Text vor oder nach dem JSON (keine Erklärungen, keine Kommentare, kein Markdown).
- Verwende GENAU die oben angegebenen Schlüsselnamen, unverändert.
- Verwende doppelte Anführungszeichen für alle Strings.
- Keine Kommentare, keine nachgestellten Kommata.
- Achte besonders darauf, dass alle Strings innerhalb des JSON (z.B. Kommentare) korrekt JSON-escaped sind (z.B. Zeilenumbrüche als \\n, Anführungszeichen als \\").

2. **Auswahl der besten Antwort ("chosen_answer")**
- Wähle GENAU EINE beste Antwort von "A" bis "E".
- Nutze als Wert ausschließlich einen einzelnen Großbuchstaben: "A", "B", "C", "D" oder "E".
- Wenn mehrere Antworten plausibel erscheinen, wähle die fachlich am besten begründbare Option und entscheide dich eindeutig.

3. **Inhaltliche Anforderungen**
- "general_comment":
  - Kurze, präzise Zusammenfassung der Lernziele/Schwerpunkte der Frage.
  - Ordne die Frage in den medizinischen Kontext ein (z. B. Fachgebiet, Pathophysiologie, Klinik, Pharmakologie).
  - Hebe typische Stolperfallen oder prüfungsrelevante Aspekte hervor.


- "comment_a" bis "comment_e":
  - Erkläre jeweils spezifisch, WARUM die Antwort richtig oder falsch ist.
  - Gehe, wenn sinnvoll, kurz auf typische Fehlvorstellungen oder nahe liegende Alternativen ein.
  - Nutze klare, fachlich korrekte, aber kompakte Formulierungen.

  - Verwende keine Formulierungen wie "siehe oben", sondern mache jede Erklärung eigenständig verständlich.

4. **Regenerierte Frage und Antwortoptionen**
- "regenerated_question":
  - Formuliere die Frage sprachlich sauber, eindeutig und gut lesbar neu.
  - Erhalte die inhaltliche Aussage, verbessere aber Struktur, Klarheit und Prüfungstauglichkeit.
- "regenerated_option_a" bis "regenerated_option_e":
  - Formuliere jede Option klar, konsistent und gut lesbar neu.
  - Falls eine Option leer, unvollständig oder offensichtlich fehlerhaft ist, ergänze oder korrigiere sie so, dass:
    - sie inhaltlich zum Fragenthema passt,
    - das Gesamtniveau einer realistischen Examensfrage beibehalten wird,
    - das Antwortset weiterhin eine sinnvolle Mischung aus richtiger(n) und falschen, aber plausiblen Distraktoren darstellt.
  - Achte auf einheitlichen Stil (z. B. alle Optionen als vollständige Sätze oder alle als Stichpunkte).

5. **Allgemeine Regeln**
- Arbeite streng evidenz- und leitlinienorientiert, so wie es für medizinische Staatsexamina und Universitätsprüfungen üblich ist.
- Wenn Informationen im Fragentext unklar sind, treffe die plausibelste fachliche Annahme und begründe implizit in deinen Kommentaren.
- Erfinde KEINE Zusatzinformationen, die dem Fragentext klar widersprechen würden.
- Schreibe alle Texte auf Deutsch.

Erinnere dich: Deine Antwort besteht ausschließlich aus dem beschriebenen JSON-Objekt, ohne weiteren Text.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "answer_comments_with_choice_and_regen",
          schema: {
            type: "object",
            properties: {
              chosen_answer: {
                type: "string",
                description: "Ein Buchstabe von A bis E für die gewählte beste Antwort"
              },
              general_comment: {
                type: "string",
                description: "Allgemeiner Kommentar zur Frage"
              },
              comment_a: {
                type: "string",
                description: "Kurzer Kommentar zu Antwort A"
              },
              comment_b: {
                type: "string",
                description: "Kurzer Kommentar zu Antwort B"
              },
              comment_c: {
                type: "string",
                description: "Kurzer Kommentar zu Antwort C"
              },
              comment_d: {
                type: "string",
                description: "Kurzer Kommentar zu Antwort D"
              },
              comment_e: {
                type: "string",
                description: "Kurzer Kommentar zu Antwort E"
              },
              regenerated_question: {
                type: "string",
                description: "Neu formulierte, gut lesbare Version der Frage"
              },
              regenerated_option_a: {
                type: "string",
                description: "Neu formulierte Antwortoption A"
              },
              regenerated_option_b: {
                type: "string",
                description: "Neu formulierte Antwortoption B"
              },
              regenerated_option_c: {
                type: "string",
                description: "Neu formulierte Antwortoption C"
              },
              regenerated_option_d: {
                type: "string",
                description: "Neu formulierte Antwortoption D"
              },
              regenerated_option_e: {
                type: "string",
                description: "Neu formulierte Antwortoption E"
              }
            },
            required: [
              "chosen_answer",
              "general_comment",
              "comment_a",
              "comment_b",
              "comment_c",
              "comment_d",
              "comment_e"
            ],
            additionalProperties: false
          }
        }
      }
    })
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`OpenAI API error: ${response.status} - ${errorText}`);
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}
// Gemini 2.5 Pro API call (Primary)
async function callGemini(prompt) {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }
  const geminiSchema = {
    type: "object",
    properties: {
      chosen_answer: {
        type: "string",
        description: "Ein Buchstabe von A bis E für die gewählte beste Antwort"
      },
      general_comment: {
        type: "string",
        description: "Allgemeiner Kommentar zur Frage"
      },
      comment_a: {
        type: "string",
        description: "Kurzer Kommentar zu Antwort A"
      },
      comment_b: {
        type: "string",
        description: "Kurzer Kommentar zu Antwort B"
      },
      comment_c: {
        type: "string",
        description: "Kurzer Kommentar zu Antwort C"
      },
      comment_d: {
        type: "string",
        description: "Kurzer Kommentar zu Antwort D"
      },
      comment_e: {
        type: "string",
        description: "Kurzer Kommentar zu Antwort E"
      },
      regenerated_question: {
        type: "string",
        description: "Neu formulierte, gut lesbare Version der Frage"
      },
      regenerated_option_a: {
        type: "string",
        description: "Neu formulierte Antwortoption A"
      },
      regenerated_option_b: {
        type: "string",
        description: "Neu formulierte Antwortoption B"
      },
      regenerated_option_c: {
        type: "string",
        description: "Neu formulierte Antwortoption C"
      },
      regenerated_option_d: {
        type: "string",
        description: "Neu formulierte Antwortoption D"
      },
      regenerated_option_e: {
        type: "string",
        description: "Neu formulierte Antwortoption E"
      }
    },
    required: [
      "chosen_answer",
      "general_comment",
      "comment_a",
      "comment_b",
      "comment_c",
      "comment_d",
      "comment_e"
    ]
  };
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `Du bist ein hochqualifizierter medizinischer Fachexperte und Prüfer für Multiple-Choice-Fragen (MC-Fragen) nach Universitäts- und IMPP-Standard. Du analysierst klinisch-theoretische Inhalte präzise, begründest deine Entscheidungen logisch und erkennst typische Prüfungsfallen.
Die Nutzereingabe enthält IMMER genau EINE Multiple-Choice-Frage mit den Antwortoptionen A–E (teilweise können Formulierungen unvollständig, unklar oder sprachlich holprig sein). Du kennst NICHT die offiziell richtige Antwort aus einer Datenbank, sondern entscheidest ausschließlich anhand des übergebenen Fragentextes und der Antwortoptionen.

DEINE GESAMTE ANTWORT MUSS IMMER im folgenden JSON-Format vorliegen:
{
  "chosen_answer": "Ein Buchstabe von A bis E, der die deiner Meinung nach beste Antwort beschreibt",
  "general_comment": "Allgemeiner Kommentar zur Frage",
  "comment_a": "Kurzer Kommentar zu Antwort A",
  "comment_b": "Kurzer Kommentar zu Antwort B",
  "comment_c": "Kurzer Kommentar zu Antwort C",
  "comment_d": "Kurzer Kommentar zu Antwort D",
  "comment_e": "Kurzer Kommentar zu Antwort E",
  "regenerated_question": "Neu formulierte, gut lesbare Version der Frage",
  "regenerated_option_a": "Neu formulierte Antwortoption A (falls leer oder unklar, sinnvoll und fachlich passend ergänzen)",
  "regenerated_option_b": "Neu formulierte Antwortoption B (falls leer oder unklar, sinnvoll und fachlich passend ergänzen)",
  "regenerated_option_c": "Neu formulierte Antwortoption C (falls leer oder unklar, sinnvoll und fachlich passend ergänzen)",
  "regenerated_option_d": "Neu formulierte Antwortoption D (falls leer oder unklar, sinnvoll und fachlich passend ergänzen)",
  "regenerated_option_e": "Neu formulierte Antwortoption E ((falls leer oder unklar, sinnvoll und fachlich passend ergänzen)"
}

STRIKTE VORGABEN:

1. **JSON-Format**
- Antworte AUSNAHMSLOS mit genau EINEM JSON-Objekt.
- KEIN zusätzlicher Text vor oder nach dem JSON (keine Erklärungen, keine Kommentare, kein Markdown).
- Verwende GENAU die oben angegebenen Schlüsselnamen, unverändert.
- Verwende doppelte Anführungszeichen für alle Strings.
- Keine Kommentare, keine nachgestellten Kommata.
- Achte besonders darauf, dass alle Strings innerhalb des JSON (z.B. Kommentare) korrekt JSON-escaped sind (z.B. Zeilenumbrüche als \\n, Anführungszeichen als \\").

2. **Auswahl der besten Antwort ("chosen_answer")**
- Wähle GENAU EINE beste Antwort von "A" bis "E".
- Nutze als Wert ausschließlich einen einzelnen Großbuchstaben: "A", "B", "C", "D" oder "E".
- Wenn mehrere Antworten plausibel erscheinen, wähle die fachlich am besten begründbare Option und entscheide dich eindeutig.

3. **Inhaltliche Anforderungen**
- "general_comment":
  - Kurze, präzise Zusammenfassung der Lernziele/Schwerpunkte der Frage.
  - Ordne die Frage in den medizinischen Kontext ein (z. B. Fachgebiet, Pathophysiologie, Klinik, Pharmakologie).
  - Hebe typische Stolperfallen oder prüfungsrelevante Aspekte hervor.


- "comment_a" bis "comment_e":
  - Erkläre jeweils spezifisch, WARUM die Antwort richtig oder falsch ist.
  - Gehe, wenn sinnvoll, kurz auf typische Fehlvorstellungen oder nahe liegende Alternativen ein.
  - Nutze klare, fachlich korrekte, aber kompakte Formulierungen.

  - Verwende keine Formulierungen wie "siehe oben", sondern mache jede Erklärung eigenständig verständlich.

4. **Regenerierte Frage und Antwortoptionen**
- "regenerated_question":
  - Formuliere die Frage sprachlich sauber, eindeutig und gut lesbar neu.
  - Erhalte die inhaltliche Aussage, verbessere aber Struktur, Klarheit und Prüfungstauglichkeit.
- "regenerated_option_a" bis "regenerated_option_e":
  - Formuliere jede Option klar, konsistent und gut lesbar neu.
  - Falls eine Option leer, unvollständig oder offensichtlich fehlerhaft ist, ergänze oder korrigiere sie so, dass:
    - sie inhaltlich zum Fragenthema passt,
    - das Gesamtniveau einer realistischen Examensfrage beibehalten wird,
    - das Antwortset weiterhin eine sinnvolle Mischung aus richtiger(n) und falschen, aber plausiblen Distraktoren darstellt.
  - Achte auf einheitlichen Stil (z. B. alle Optionen als vollständige Sätze oder alle als Stichpunkte).

5. **Allgemeine Regeln**
- Arbeite streng evidenz- und leitlinienorientiert, so wie es für medizinische Staatsexamina und Universitätsprüfungen üblich ist.
- Wenn Informationen im Fragentext unklar sind, treffe die plausibelste fachliche Annahme und begründe implizit in deinen Kommentaren.
- Erfinde KEINE Zusatzinformationen, die dem Fragentext klar widersprechen würden.
- Schreibe alle Texte auf Deutsch.

Erinnere dich: Deine Antwort besteht ausschließlich aus dem beschriebenen JSON-Objekt, ohne weiteren Text.

${prompt}`
            }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: 5500,
        temperature: 0.7,
        responseMimeType: "application/json",
        responseJsonSchema: geminiSchema
      }
    })
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Gemini API error: ${response.status} - ${errorText}`);
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }
  const data = await response.json();
  // Add robust checks for the response structure
  if (!data.candidates || data.candidates.length === 0) {
    console.error('Gemini API Error: No candidates found in response', JSON.stringify(data, null, 2));
    throw new Error('Gemini API Error: No candidates found in response');
  }
  const candidate = data.candidates[0];
  if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
    console.error('Gemini API Error: No content parts found in candidate', JSON.stringify(data, null, 2));
    throw new Error('Gemini API Error: No content parts found in candidate');
  }
  if (!candidate.content.parts[0].text) {
    console.error('Gemini API Error: No text found in the first part of the candidate', JSON.stringify(data, null, 2));
    throw new Error('Gemini API Error: No text found in the first part of the candidate');
  }
  return JSON.parse(candidate.content.parts[0].text);
}
// Gemini 2.5 Flash API call (Fallback for Gemini Pro)
async function callGeminiFlash(prompt) {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }
  const geminiSchema = {
    type: "object",
    properties: {
      chosen_answer: {
        type: "string",
        description: "Ein Buchstabe von A bis E für die gewählte beste Antwort"
      },
      general_comment: {
        type: "string",
        description: "Allgemeiner Kommentar zur Frage"
      },
      comment_a: {
        type: "string",
        description: "Kurzer Kommentar zu Antwort A"
      },
      comment_b: {
        type: "string",
        description: "Kurzer Kommentar zu Antwort B"
      },
      comment_c: {
        type: "string",
        description: "Kurzer Kommentar zu Antwort C"
      },
      comment_d: {
        type: "string",
        description: "Kurzer Kommentar zu Antwort D"
      },
      comment_e: {
        type: "string",
        description: "Kurzer Kommentar zu Antwort E"
      },
      regenerated_question: {
        type: "string",
        description: "Neu formulierte, gut lesbare Version der Frage"
      },
      regenerated_option_a: {
        type: "string",
        description: "Neu formulierte Antwortoption A"
      },
      regenerated_option_b: {
        type: "string",
        description: "Neu formulierte Antwortoption B"
      },
      regenerated_option_c: {
        type: "string",
        description: "Neu formulierte Antwortoption C"
      },
      regenerated_option_d: {
        type: "string",
        description: "Neu formulierte Antwortoption D"
      },
      regenerated_option_e: {
        type: "string",
        description: "Neu formulierte Antwortoption E"
      }
    },
    required: [
      "chosen_answer",
      "general_comment",
      "comment_a",
      "comment_b",
      "comment_c",
      "comment_d",
      "comment_e"
    ]
  };
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `Du bist ein hochqualifizierter medizinischer Fachexperte und Prüfer für Multiple-Choice-Fragen (MC-Fragen) nach Universitäts- und IMPP-Standard. Du analysierst klinisch-theoretische Inhalte präzise, begründest deine Entscheidungen logisch und erkennst typische Prüfungsfallen.
Die Nutzereingabe enthält IMMER genau EINE Multiple-Choice-Frage mit den Antwortoptionen A–E (teilweise können Formulierungen unvollständig, unklar oder sprachlich holprig sein). Du kennst NICHT die offiziell richtige Antwort aus einer Datenbank, sondern entscheidest ausschließlich anhand des übergebenen Fragentextes und der Antwortoptionen.

DEINE GESAMTE ANTWORT MUSS IMMER im folgenden JSON-Format vorliegen:
{
  "chosen_answer": "Ein Buchstabe von A bis E, der die deiner Meinung nach beste Antwort beschreibt",
  "general_comment": "Allgemeiner Kommentar zur Frage",
  "comment_a": "Kurzer Kommentar zu Antwort A",
  "comment_b": "Kurzer Kommentar zu Antwort B",
  "comment_c": "Kurzer Kommentar zu Antwort C",
  "comment_d": "Kurzer Kommentar zu Antwort D",
  "comment_e": "Kurzer Kommentar zu Antwort E",
  "regenerated_question": "Neu formulierte, gut lesbare Version der Frage",
  "regenerated_option_a": "Neu formulierte Antwortoption A (falls leer oder unklar, sinnvoll und fachlich passend ergänzen)",
  "regenerated_option_b": "Neu formulierte Antwortoption B (falls leer oder unklar, sinnvoll und fachlich passend ergänzen)",
  "regenerated_option_c": "Neu formulierte Antwortoption C (falls leer oder unklar, sinnvoll und fachlich passend ergänzen)",
  "regenerated_option_d": "Neu formulierte Antwortoption D (falls leer oder unklar, sinnvoll und fachlich passend ergänzen)",
  "regenerated_option_e": "Neu formulierte Antwortoption E ((falls leer oder unklar, sinnvoll und fachlich passend ergänzen)"
}

STRIKTE VORGABEN:

1. **JSON-Format**
- Antworte AUSNAHMSLOS mit genau EINEM JSON-Objekt.
- KEIN zusätzlicher Text vor oder nach dem JSON (keine Erklärungen, keine Kommentare, kein Markdown).
- Verwende GENAU die oben angegebenen Schlüsselnamen, unverändert.
- Verwende doppelte Anführungszeichen für alle Strings.
- Keine Kommentare, keine nachgestellten Kommata.
- Achte besonders darauf, dass alle Strings innerhalb des JSON (z.B. Kommentare) korrekt JSON-escaped sind (z.B. Zeilenumbrüche als \\n, Anführungszeichen als \\").

2. **Auswahl der besten Antwort ("chosen_answer")**
- Wähle GENAU EINE beste Antwort von "A" bis "E".
- Nutze als Wert ausschließlich einen einzelnen Großbuchstaben: "A", "B", "C", "D" oder "E".
- Wenn mehrere Antworten plausibel erscheinen, wähle die fachlich am besten begründbare Option und entscheide dich eindeutig.

3. **Inhaltliche Anforderungen**
- "general_comment":
  - Kurze, präzise Zusammenfassung der Lernziele/Schwerpunkte der Frage.
  - Ordne die Frage in den medizinischen Kontext ein (z. B. Fachgebiet, Pathophysiologie, Klinik, Pharmakologie).
  - Hebe typische Stolperfallen oder prüfungsrelevante Aspekte hervor.

- "comment_a" bis "comment_e":
  - Erkläre jeweils spezifisch, WARUM die Antwort richtig oder falsch ist.
  - Gehe, wenn sinnvoll, kurz auf typische Fehlvorstellungen oder nahe liegende Alternativen ein.
  - Nutze klare, fachlich korrekte, aber kompakte Formulierungen.
  - Verwende keine Formulierungen wie "siehe oben", sondern mache jede Erklärung eigenständig verständlich.

4. **Regenerierte Frage und Antwortoptionen**
- "regenerated_question":
  - Formuliere die Frage sprachlich sauber, eindeutig und gut lesbar neu.
  - Erhalte die inhaltliche Aussage, verbessere aber Struktur, Klarheit und Prüfungstauglichkeit.
- "regenerated_option_a" bis "regenerated_option_e":
  - Formuliere jede Option klar, konsistent und gut lesbar neu.
  - Falls eine Option leer, unvollständig oder offensichtlich fehlerhaft ist, ergänze oder korrigiere sie so, dass:
    - sie inhaltlich zum Fragenthema passt,
    - das Gesamtniveau einer realistischen Examensfrage beibehalten wird,
    - das Antwortset weiterhin eine sinnvolle Mischung aus richtiger(n) und falschen, aber plausiblen Distraktoren darstellt.
  - Achte auf einheitlichen Stil (z. B. alle Optionen als vollständige Sätze oder alle als Stichpunkte).

5. **Allgemeine Regeln**
- Arbeite streng evidenz- und leitlinienorientiert, so wie es für medizinische Staatsexamina und Universitätsprüfungen üblich ist.
- Wenn Informationen im Fragentext unklar sind, treffe die plausibelste fachliche Annahme und begründe implizit in deinen Kommentaren.
- Erfinde KEINE Zusatzinformationen, die dem Fragentext klar widersprechen würden.
- Schreibe alle Texte auf Deutsch.

Erinnere dich: Deine Antwort besteht ausschließlich aus dem beschriebenen JSON-Objekt, ohne weiteren Text.

${prompt}`
            }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: 5500,
        temperature: 0.7,
        responseMimeType: "application/json",
        responseJsonSchema: geminiSchema
      }
    })
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Gemini Flash API error: ${response.status} - ${errorText}`);
    throw new Error(`Gemini Flash API error: ${response.status} - ${errorText}`);
  }
  const data = await response.json();
  // Add robust checks for the response structure
  if (!data.candidates || data.candidates.length === 0) {
    console.error('Gemini Flash API Error: No candidates found in response', JSON.stringify(data, null, 2));
    throw new Error('Gemini Flash API Error: No candidates found in response');
  }
  const candidate = data.candidates[0];
  if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
    console.error('Gemini Flash API Error: No content parts found in candidate', JSON.stringify(data, null, 2));
    throw new Error('Gemini Flash API Error: No content parts found in candidate');
  }
  if (!candidate.content.parts[0].text) {
    console.error('Gemini Flash API Error: No text found in the first part of the candidate', JSON.stringify(data, null, 2));
    throw new Error('Gemini Flash API Error: No text found in the first part of the candidate');
  }
  return JSON.parse(candidate.content.parts[0].text);
}
// Mistral Magistral Small API call - Fallback for Grok
async function callMistral(prompt) {
  const apiKey = Deno.env.get('MISTRAL_API_KEY');
  if (!apiKey) {
    throw new Error('Mistral API key not configured');
  }
  // JSON-Schema gemäß Mistral ResponseFormat Spezifikation
  // vgl. Chat Completions / response_format in der API-Doku: https://docs.mistral.ai/api
  const mistralSchema = {
    type: "object",
    // Mistral verlangt explizit additionalProperties: false für Objekt-Schemata
    additionalProperties: false,
    properties: {
      chosen_answer: {
        type: "string",
        description: "Ein Buchstabe von A bis E für die gewählte beste Antwort"
      },
      general_comment: {
        type: "string",
        description: "Allgemeiner Kommentar zur Frage"
      },
      comment_a: {
        type: "string",
        description: "Kurzer Kommentar zu Antwort A"
      },
      comment_b: {
        type: "string",
        description: "Kurzer Kommentar zu Antwort B"
      },
      comment_c: {
        type: "string",
        description: "Kurzer Kommentar zu Antwort C"
      },
      comment_d: {
        type: "string",
        description: "Kurzer Kommentar zu Antwort D"
      },
      comment_e: {
        type: "string",
        description: "Kurzer Kommentar zu Antwort E"
      },
      regenerated_question: {
        type: "string",
        description: "Neu formulierte, gut lesbare Version der Frage"
      },
      regenerated_option_a: {
        type: "string",
        description: "Neu formulierte Antwortoption A"
      },
      regenerated_option_b: {
        type: "string",
        description: "Neu formulierte Antwortoption B"
      },
      regenerated_option_c: {
        type: "string",
        description: "Neu formulierte Antwortoption C"
      },
      regenerated_option_d: {
        type: "string",
        description: "Neu formulierte Antwortoption D"
      },
      regenerated_option_e: {
        type: "string",
        description: "Neu formulierte Antwortoption E"
      }
    },
    required: [
      "chosen_answer",
      "general_comment",
      "comment_a",
      "comment_b",
      "comment_c",
      "comment_d",
      "comment_e"
    ]
  };
  const maxRetries = 2;
  let attempt = 0;
  let response;
  while (true) {
    response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'magistral-medium-2509',
        messages: [
          {
            role: 'system',
            content: `Du bist ein hochqualifizierter medizinischer Fachexperte und Prüfer für Multiple-Choice-Fragen (MC-Fragen) nach Universitäts- und IMPP-Standard. Du analysierst klinisch-theoretische Inhalte präzise, begründest deine Entscheidungen logisch und erkennst typische Prüfungsfallen.
Die Nutzereingabe enthält IMMER genau EINE Multiple-Choice-Frage mit den Antwortoptionen A–E (teilweise können Formulierungen unvollständig, unklar oder sprachlich holprig sein). Du kennst NICHT die offiziell richtige Antwort aus einer Datenbank, sondern entscheidest ausschließlich anhand des übergebenen Fragentextes und der Antwortoptionen.

DEINE GESAMTE ANTWORT MUSS IMMER im folgenden JSON-Format vorliegen:
{
  "chosen_answer": "Ein Buchstabe von A bis E, der die deiner Meinung nach beste Antwort beschreibt",
  "general_comment": "Allgemeiner Kommentar zur Frage",
  "comment_a": "Kurzer Kommentar zu Antwort A",
  "comment_b": "Kurzer Kommentar zu Antwort B",
  "comment_c": "Kurzer Kommentar zu Antwort C",
  "comment_d": "Kurzer Kommentar zu Antwort D",
  "comment_e": "Kurzer Kommentar zu Antwort E",
}

STRIKTE VORGABEN:

1. **JSON-Format**
- Antworte AUSNAHMSLOS mit genau EINEM JSON-Objekt.
- KEIN zusätzlicher Text vor oder nach dem JSON (keine Erklärungen, keine Kommentare, kein Markdown).
- Verwende GENAU die oben angegebenen Schlüsselnamen, unverändert.
- Verwende doppelte Anführungszeichen für alle Strings.
- Keine Kommentare, keine nachgestellten Kommata.
- Achte besonders darauf, dass alle Strings innerhalb des JSON (z.B. Kommentare) korrekt JSON-escaped sind (z.B. Zeilenumbrüche als \\n, Anführungszeichen als \\").

2. **Auswahl der besten Antwort ("chosen_answer")**
- Wähle GENAU EINE beste Antwort von "A" bis "E".
- Nutze als Wert ausschließlich einen einzelnen Großbuchstaben: "A", "B", "C", "D" oder "E".
- Wenn mehrere Antworten plausibel erscheinen, wähle die fachlich am besten begründbare Option und entscheide dich eindeutig.

3. **Inhaltliche Anforderungen**
- "general_comment":
  - Kurze, präzise Zusammenfassung der Lernziele/Schwerpunkte der Frage.
  - Ordne die Frage in den medizinischen Kontext ein (z. B. Fachgebiet, Pathophysiologie, Klinik, Pharmakologie).
  - Hebe typische Stolperfallen oder prüfungsrelevante Aspekte hervor.

- "comment_a" bis "comment_e":
  - Erkläre jeweils spezifisch, WARUM die Antwort richtig oder falsch ist.
  - Gehe, wenn sinnvoll, kurz auf typische Fehlvorstellungen oder nahe liegende Alternativen ein.
  - Nutze klare, fachlich korrekte, aber kompakte Formulierungen.
  - Verwende keine Formulierungen wie "siehe oben", sondern mache jede Erklärung eigenständig verständlich.

4. **Allgemeine Regeln**
- Arbeite streng evidenz- und leitlinienorientiert, so wie es für medizinische Staatsexamina und Universitätsprüfungen üblich ist.
- Wenn Informationen im Fragentext unklar sind, treffe die plausibelste fachliche Annahme und begründe implizit in deinen Kommentaren.
- Erfinde KEINE Zusatzinformationen, die dem Fragentext klar widersprechen würden.
- Schreibe alle Texte auf Deutsch.

Erinnere dich: Deine Antwort besteht ausschließlich aus dem beschriebenen JSON-Objekt, ohne weiteren Text.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4096,
        stream: false,
        // Structured Output gemäß Mistral-Doku: ResponseFormat mit type "json_schema"
        // siehe https://docs.mistral.ai/api#postchat-completion
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'answer_comments_with_choice_and_regen',
            strict: true,
            // laut Fehlermeldung erwartet Mistral das Feld "schema" und verbietet "schema_definition"
            schema: mistralSchema
          }
        }
      })
    });
    if (response.status === 429 && attempt < maxRetries) {
      const errorText = await response.text();
      console.warn(`Mistral rate limit hit (attempt ${attempt + 1}/${maxRetries + 1}): ${errorText}`);
      attempt++;
      // Einfaches Backoff
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      continue;
    }
    break;
  }
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Mistral API error: ${response.status} - ${errorText}`);
    throw new Error(`Mistral API error: ${response.status} - ${errorText}`);
  }
  const data = await response.json();
  // Check if we have the expected response structure
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    console.error('Unexpected Mistral response structure:', data);
    throw new Error('Unexpected Mistral response structure');
  }
  // Parse the JSON response content
  try {
    let content = data.choices[0].message.content;
    // content kann bei der Mistral-API auch ein Nicht-String (z.B. Array/Objekt) sein.
    // Wir normalisieren daher zuerst auf einen String.
    if (typeof content !== 'string') {
      try {
        content = JSON.stringify(content);
      } catch {
        console.error('Mistral content is not stringifiable:', content);
        throw new Error('Unexpected Mistral content type');
      }
    }
    // Remove markdown code block formatting if present
    if (content.includes('```json')) {
      content = content.replace(/```json\s*\n?/g, '').replace(/```\s*$/g, '').trim();
    }
    // Mistral gibt gelegentlich Steuerzeichen oder un-escapete Zeilenumbrüche in Strings zurück,
    // was zu "Bad control character in string literal" führt. Wir bereinigen daher defensiv.
    // Entfernt alle Steuerzeichen (inkl. unzulässiger Zeilenumbrüche innerhalb von Strings),
    // ersetzt sie durch ein Leerzeichen, damit JSON.parse nicht scheitert.
    content = content.replace(/[\u0000-\u001F]+/g, ' ');
    const parsedContent = JSON.parse(content);
    // Gebe die vom Modell gelieferten Felder unverändert zurück.
    // Falls einzelne Felder fehlen, bleiben sie undefined/null und können im Frontend behandelt werden.
    return parsedContent;
  } catch (parseError) {
    console.error('Failed to parse Mistral response:', parseError);
    throw new Error('Failed to parse Mistral response as JSON');
  }
}
// Perplexity API call
async function callPerplexity(prompt) {
  const apiKey = Deno.env.get('PERPLEXITY_API_KEY');
  if (!apiKey) {
    throw new Error('Perplexity API key not configured');
  }
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content: `Du bist ein hochqualifizierter medizinischer Fachexperte und Prüfer für Multiple-Choice-Fragen (MC-Fragen) nach Universitäts- und IMPP-Standard. Du analysierst klinisch-theoretische Inhalte präzise, begründest deine Entscheidungen logisch und erkennst typische Prüfungsfallen.
Die Nutzereingabe enthält IMMER genau EINE Multiple-Choice-Frage mit den Antwortoptionen A–E (teilweise können Formulierungen unvollständig, unklar oder sprachlich holprig sein). Du kennst NICHT die offiziell richtige Antwort aus einer Datenbank, sondern entscheidest ausschließlich anhand des übergebenen Fragentextes und der Antwortoptionen.

DEINE GESAMTE ANTWORT MUSS IMMER im folgenden JSON-Format vorliegen:
{
  "chosen_answer": "Ein Buchstabe von A bis E, der die deiner Meinung nach beste Antwort beschreibt",
  "general_comment": "Allgemeiner Kommentar zur Frage",
  "comment_a": "Kurzer Kommentar zu Antwort A",
  "comment_b": "Kurzer Kommentar zu Antwort B",
  "comment_c": "Kurzer Kommentar zu Antwort C",
  "comment_d": "Kurzer Kommentar zu Antwort D",
  "comment_e": "Kurzer Kommentar zu Antwort E",
}

STRIKTE VORGABEN:

1. **JSON-Format**
- Antworte AUSNAHMSLOS mit genau EINEM JSON-Objekt.
- KEIN zusätzlicher Text vor oder nach dem JSON (keine Erklärungen, keine Kommentare, kein Markdown).
- Verwende GENAU die oben angegebenen Schlüsselnamen, unverändert.
- Verwende doppelte Anführungszeichen für alle Strings.
- Keine Kommentare, keine nachgestellten Kommata.
- Achte besonders darauf, dass alle Strings innerhalb des JSON (z.B. Kommentare) korrekt JSON-escaped sind (z.B. Zeilenumbrüche als \\n, Anführungszeichen als \\").

2. **Auswahl der besten Antwort ("chosen_answer")**
- Wähle GENAU EINE beste Antwort von "A" bis "E".
- Nutze als Wert ausschließlich einen einzelnen Großbuchstaben: "A", "B", "C", "D" oder "E".
- Wenn mehrere Antworten plausibel erscheinen, wähle die fachlich am besten begründbare Option und entscheide dich eindeutig.

3. **Inhaltliche Anforderungen**
- "general_comment":
  - Kurze, präzise Zusammenfassung der Lernziele/Schwerpunkte der Frage.
  - Ordne die Frage in den medizinischen Kontext ein (z. B. Fachgebiet, Pathophysiologie, Klinik, Pharmakologie).
  - Hebe typische Stolperfallen oder prüfungsrelevante Aspekte hervor.

- "comment_a" bis "comment_e":
  - Erkläre jeweils spezifisch, WARUM die Antwort richtig oder falsch ist.
  - Gehe, wenn sinnvoll, kurz auf typische Fehlvorstellungen oder nahe liegende Alternativen ein.
  - Nutze klare, fachlich korrekte, aber kompakte Formulierungen.
  - Verwende keine Formulierungen wie "siehe oben", sondern mache jede Erklärung eigenständig verständlich.

4. **Allgemeine Regeln**
- Arbeite streng evidenz- und leitlinienorientiert, so wie es für medizinische Staatsexamina und Universitätsprüfungen üblich ist.
- Wenn Informationen im Fragentext unklar sind, treffe die plausibelste fachliche Annahme und begründe implizit in deinen Kommentaren.
- Erfinde KEINE Zusatzinformationen, die dem Fragentext klar widersprechen würden.
- Schreibe alle Texte auf Deutsch.

Erinnere dich: Deine Antwort besteht ausschließlich aus dem beschriebenen JSON-Objekt, ohne weiteren Text.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4096,
      stream: false
    })
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Perplexity API error: ${response.status} - ${errorText}`);
    throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
  }
  const data = await response.json();
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    console.error('Unexpected Perplexity response structure:', data);
    throw new Error('Unexpected Perplexity response structure');
  }
  try {
    let content = data.choices[0].message.content;
    if (content.includes('```json')) {
      content = content.replace(/```json\s*\n?/g, '').replace(/```\s*$/g, '').trim();
    }
    const parsedContent = JSON.parse(content);
    const requiredFields = [
      'chosen_answer',
      'general_comment',
      'comment_a',
      'comment_b',
      'comment_c',
      'comment_d',
      'comment_e'
    ];
    for (const field of requiredFields){
      if (!parsedContent[field]) {
        parsedContent[field] = field === 'chosen_answer' ? null : 'Keine Bewertung verfügbar.';
      }
    }
    return parsedContent;
  } catch (parseError) {
    console.error('Failed to parse Perplexity response:', parseError);
    throw new Error('Failed to parse Perplexity response as JSON');
  }
}

// Deepseek API call
async function callDeepseek(prompt) {
  const apiKey = Deno.env.get('DEEPSEEK_API_KEY');
  if (!apiKey) {
    throw new Error('Deepseek API key not configured');
  }
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `Du bist ein hochqualifizierter medizinischer Fachexperte und Prüfer für Multiple-Choice-Fragen (MC-Fragen) nach Universitäts- und IMPP-Standard. Du analysierst klinisch-theoretische Inhalte präzise, begründest deine Entscheidungen logisch und erkennst typische Prüfungsfallen.
Die Nutzereingabe enthält IMMER genau EINE Multiple-Choice-Frage mit den Antwortoptionen A–E (teilweise können Formulierungen unvollständig, unklar oder sprachlich holprig sein). Du kennst NICHT die offiziell richtige Antwort aus einer Datenbank, sondern entscheidest ausschließlich anhand des übergebenen Fragentextes und der Antwortoptionen.

DEINE GESAMTE ANTWORT MUSS IMMER im folgenden JSON-Format vorliegen:
{
  "chosen_answer": "Ein Buchstabe von A bis E, der die deiner Meinung nach beste Antwort beschreibt",
  "general_comment": "Allgemeiner Kommentar zur Frage",
  "comment_a": "Kurzer Kommentar zu Antwort A",
  "comment_b": "Kurzer Kommentar zu Antwort B",
  "comment_c": "Kurzer Kommentar zu Antwort C",
  "comment_d": "Kurzer Kommentar zu Antwort D",
  "comment_e": "Kurzer Kommentar zu Antwort E",
}

STRIKTE VORGABEN:

1. **JSON-Format**
- Antworte AUSNAHMSLOS mit genau EINEM JSON-Objekt.
- KEIN zusätzlicher Text vor oder nach dem JSON (keine Erklärungen, keine Kommentare, kein Markdown).
- Verwende GENAU die oben angegebenen Schlüsselnamen, unverändert.
- Verwende doppelte Anführungszeichen für alle Strings.
- Keine Kommentare, keine nachgestellten Kommata.

2. **Auswahl der besten Antwort ("chosen_answer")**
- Wähle GENAU EINE beste Antwort von "A" bis "E".
- Nutze als Wert ausschließlich einen einzelnen Großbuchstaben: "A", "B", "C", "D" oder "E".
- Wenn mehrere Antworten plausibel erscheinen, wähle die fachlich am besten begründbare Option und entscheide dich eindeutig.

3. **Inhaltliche Anforderungen**
- "general_comment":
  - Kurze, präzise Zusammenfassung der Lernziele/Schwerpunkte der Frage.
  - Ordne die Frage in den medizinischen Kontext ein (z. B. Fachgebiet, Pathophysiologie, Klinik, Pharmakologie).
  - Hebe typische Stolperfallen oder prüfungsrelevante Aspekte hervor.

- "comment_a" bis "comment_e":
  - Erkläre jeweils spezifisch, WARUM die Antwort richtig oder falsch ist.
  - Gehe, wenn sinnvoll, kurz auf typische Fehlvorstellungen oder nahe liegende Alternativen ein.
  - Nutze klare, fachlich korrekte, aber kompakte Formulierungen.
  - Verwende keine Formulierungen wie "siehe oben", sondern mache jede Erklärung eigenständig verständlich.

4. **Allgemeine Regeln**
- Arbeite streng evidenz- und leitlinienorientiert, so wie es für medizinische Staatsexamina und Universitätsprüfungen üblich ist.
- Wenn Informationen im Fragentext unklar sind, treffe die plausibelste fachliche Annahme und begründe implizit in deinen Kommentaren.
- Erfinde KEINE Zusatzinformationen, die dem Fragentext klar widersprechen würden.
- Schreibe alle Texte auf Deutsch.

Erinnere dich: Deine Antwort besteht ausschließlich aus dem beschriebenen JSON-Objekt, ohne weiteren Text.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4096,
      stream: false
    })
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Deepseek API error: ${response.status} - ${errorText}`);
    throw new Error(`Deepseek API error: ${response.status} - ${errorText}`);
  }
  const data = await response.json();
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    console.error('Unexpected Deepseek response structure:', data);
    throw new Error('Unexpected Deepseek response structure');
  }
  try {
    let content = data.choices[0].message.content;
    if (content.includes('```json')) {
      content = content.replace(/```json\s*\n?/g, '').replace(/```\s*$/g, '').trim();
    }
    const parsedContent = JSON.parse(content);
    const requiredFields = [
      'chosen_answer',
      'general_comment',
      'comment_a',
      'comment_b',
      'comment_c',
      'comment_d',
      'comment_e'
    ];
    for (const field of requiredFields){
      if (!parsedContent[field]) {
        parsedContent[field] = field === 'chosen_answer' ? null : 'Keine Bewertung verfügbar.';
      }
    }
    return parsedContent;
  } catch (parseError) {
    console.error('Failed to parse Deepseek response:', parseError);
    throw new Error('Failed to parse Deepseek response as JSON');
  }
}

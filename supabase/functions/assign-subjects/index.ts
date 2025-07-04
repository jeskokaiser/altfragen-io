
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Configuration for robust processing
const CONFIG = {
  BATCH_SIZE: 3, // Smaller batches for better reliability
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  REQUEST_DELAY: 800, // Delay between OpenAI requests
  CHUNK_SIZE: 20, // Process in chunks to avoid timeouts
  CHUNK_DELAY: 2000, // 2 seconds between chunks
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = CONFIG.MAX_RETRIES,
  delay: number = CONFIG.RETRY_DELAY
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    
    console.log(`Retrying in ${delay}ms... (${retries} retries left)`);
    await sleep(delay);
    return retryWithBackoff(fn, retries - 1, delay * 2); // Exponential backoff
  }
}

async function assignSubjectToQuestion(
  question: any,
  availableSubjects: string[],
  openAIApiKey: string,
  supabase: any,
  userId: string
): Promise<any> {
  const prompt = `You are a subject classifier for academic questions. Given the following question and list of available subjects, select the most appropriate subject.

Question: "${question.question}"

Available subjects: ${availableSubjects.join(', ')}

Please respond with ONLY the exact subject name from the list above that best matches this question. Do not add any explanation or additional text.`;

  const assignSubject = async () => {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a precise subject classifier. Always respond with only the exact subject name from the provided list.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 50,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  };

  try {
    let assignedSubject = await retryWithBackoff(assignSubject);

    // Validate that the assigned subject is in the available list
    if (!availableSubjects.includes(assignedSubject)) {
      console.warn(`Invalid subject "${assignedSubject}" for question ${question.id}, using first available subject`);
      assignedSubject = availableSubjects[0];
    }

    // Update the question in the database with retry
    const updateQuestion = async () => {
      const { error } = await supabase
        .from('questions')
        .update({ subject: assignedSubject })
        .eq('id', question.id)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Database update error: ${error.message}`);
      }
    };

    await retryWithBackoff(updateQuestion);

    console.log(`Successfully updated question ${question.id} with subject: ${assignedSubject}`);
    
    return {
      ...question,
      subject: assignedSubject,
      success: true
    };

  } catch (error) {
    console.error(`Error processing question ${question.id}:`, error);
    return {
      ...question,
      subject: availableSubjects[0], // Fallback subject
      success: false,
      error: error.message
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { questions, availableSubjects, userId } = await req.json();
    
    if (!questions || !availableSubjects || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: questions, availableSubjects, userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const totalQuestions = questions.length;
    const updatedQuestions = [];
    let processed = 0;
    let errors = 0;

    console.log(`Starting to process ${totalQuestions} questions in chunks of ${CONFIG.CHUNK_SIZE}`);

    // Process questions in chunks to avoid timeouts
    for (let chunkStart = 0; chunkStart < totalQuestions; chunkStart += CONFIG.CHUNK_SIZE) {
      const chunk = questions.slice(chunkStart, chunkStart + CONFIG.CHUNK_SIZE);
      console.log(`Processing chunk ${Math.floor(chunkStart / CONFIG.CHUNK_SIZE) + 1}/${Math.ceil(totalQuestions / CONFIG.CHUNK_SIZE)} (${chunk.length} questions)`);

      // Process questions in smaller batches within each chunk
      for (let i = 0; i < chunk.length; i += CONFIG.BATCH_SIZE) {
        const batch = chunk.slice(i, i + CONFIG.BATCH_SIZE);
        
        // Process batch with controlled concurrency
        const batchPromises = batch.map(async (question, index) => {
          // Stagger requests to avoid rate limiting
          await sleep(index * 200);
          return assignSubjectToQuestion(question, availableSubjects, openAIApiKey, supabase, userId);
        });

        const batchResults = await Promise.allSettled(batchPromises);
        
        // Process results
        for (const result of batchResults) {
          if (result.status === 'fulfilled') {
            updatedQuestions.push(result.value);
            if (!result.value.success) errors++;
          } else {
            console.error('Batch processing error:', result.reason);
            errors++;
            // Add failed question with fallback subject
            const failedQuestion = batch[batchResults.indexOf(result)];
            updatedQuestions.push({
              ...failedQuestion,
              subject: availableSubjects[0],
              success: false,
              error: result.reason?.message || 'Unknown error'
            });
          }
          processed++;
        }

        // Progress logging
        console.log(`Progress: ${processed}/${totalQuestions} questions processed (${errors} errors)`);

        // Delay between batches to avoid overwhelming the API
        if (i + CONFIG.BATCH_SIZE < chunk.length) {
          await sleep(CONFIG.REQUEST_DELAY);
        }
      }

      // Delay between chunks for larger workloads
      if (chunkStart + CONFIG.CHUNK_SIZE < totalQuestions) {
        console.log(`Completed chunk, waiting ${CONFIG.CHUNK_DELAY}ms before next chunk...`);
        await sleep(CONFIG.CHUNK_DELAY);
      }
    }

    const successCount = updatedQuestions.filter(q => q.success !== false).length;
    
    console.log(`Completed processing: ${successCount}/${totalQuestions} questions successfully updated, ${errors} errors`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        updatedQuestions,
        stats: {
          total: totalQuestions,
          successful: successCount,
          errors: errors,
          processed: processed
        },
        message: `Successfully processed ${successCount} out of ${totalQuestions} questions${errors > 0 ? ` (${errors} questions had errors and used fallback subjects)` : ''}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in assign-subjects function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        suggestion: 'Try reducing the batch size or check your API limits'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

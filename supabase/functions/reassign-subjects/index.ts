

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
  BATCH_SIZE: 3,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  REQUEST_DELAY: 800,
  CHUNK_SIZE: 20,
  CHUNK_DELAY: 2000,
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
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
}

async function assignSubjectToQuestion(
  question: any,
  availableSubjects: string[],
  openAIApiKey: string,
  supabase: any
): Promise<any> {
  const prompt = `Du bist ein Fachgebiet-Klassifizierer für akademische Fragen. Gegeben ist die folgende Frage mit Antwortoptionen und eine Liste verfügbarer Fachgebiete. Wähle das am besten passende Fachgebiet aus.

Frage: "${question.question}"

Antwortoptionen:
A) ${question.option_a}
B) ${question.option_b}
C) ${question.option_c}
D) ${question.option_d}
E) ${question.option_e}

Verfügbare Fachgebiete: ${availableSubjects.join(', ')}

Bitte antworte NUR mit dem exakten Fachgebiet-Namen aus der obigen Liste, der am besten zu dieser Frage passt. Füge keine Erklärung oder zusätzlichen Text hinzu.`;

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
            content: 'Du bist ein präziser Fachgebiet-Klassifizierer. Antworte immer nur mit dem exakten Fachgebiet-Namen aus der bereitgestellten Liste.' 
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

    if (!availableSubjects.includes(assignedSubject)) {
      console.warn(`Invalid subject "${assignedSubject}" for question ${question.id}, using first available subject`);
      assignedSubject = availableSubjects[0];
    }

    const updateQuestion = async () => {
      const { error } = await supabase
        .from('questions')
        .update({ subject: assignedSubject })
        .eq('id', question.id);

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
      subject: availableSubjects[0],
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
    const { examName, universityId, onlyNullSubjects, availableSubjects } = await req.json();
    
    console.log('Request body:', { examName, universityId, onlyNullSubjects, availableSubjects });
    
    if (!examName || !availableSubjects || !Array.isArray(availableSubjects) || availableSubjects.length === 0) {
      console.error('Missing or invalid required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields: examName, availableSubjects (must be non-empty array)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Build query for existing questions
    let query = supabase
      .from('questions')
      .select('*')
      .eq('exam_name', examName);

    if (universityId && universityId !== 'all') {
      console.log('Adding university filter:', universityId);
      query = query.eq('university_id', universityId);
    }

    // Add filter for null subjects if requested - try multiple approaches
    if (onlyNullSubjects === true) {
      console.log('Filtering for null subjects only');
      // Try both null and empty string checks
      query = query.or('subject.is.null,subject.eq.');
    }

    console.log('About to execute query...');
    const { data: questions, error: questionsError } = await query;

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch questions', details: questionsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Query executed successfully, found ${questions?.length || 0} questions`);

    if (!questions || questions.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No questions found matching the criteria' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const totalQuestions = questions.length;
    const updatedQuestions = [];
    let processed = 0;
    let errors = 0;

    console.log(`Starting to process ${totalQuestions} questions for exam: ${examName}${onlyNullSubjects ? ' (null subjects only)' : ''}`);

    // Process questions in chunks
    for (let chunkStart = 0; chunkStart < totalQuestions; chunkStart += CONFIG.CHUNK_SIZE) {
      const chunk = questions.slice(chunkStart, chunkStart + CONFIG.CHUNK_SIZE);
      console.log(`Processing chunk ${Math.floor(chunkStart / CONFIG.CHUNK_SIZE) + 1}/${Math.ceil(totalQuestions / CONFIG.CHUNK_SIZE)} (${chunk.length} questions)`);

      for (let i = 0; i < chunk.length; i += CONFIG.BATCH_SIZE) {
        const batch = chunk.slice(i, i + CONFIG.BATCH_SIZE);
        
        const batchPromises = batch.map(async (question, index) => {
          await sleep(index * 200);
          return assignSubjectToQuestion(question, availableSubjects, openAIApiKey, supabase);
        });

        const batchResults = await Promise.allSettled(batchPromises);
        
        for (const result of batchResults) {
          if (result.status === 'fulfilled') {
            updatedQuestions.push(result.value);
            if (!result.value.success) errors++;
          } else {
            console.error('Batch processing error:', result.reason);
            errors++;
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

        console.log(`Progress: ${processed}/${totalQuestions} questions processed (${errors} errors)`);

        if (i + CONFIG.BATCH_SIZE < chunk.length) {
          await sleep(CONFIG.REQUEST_DELAY);
        }
      }

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
        message: `Successfully processed ${successCount} out of ${totalQuestions} questions${errors > 0 ? ` (${errors} questions had errors and used fallback subjects)` : ''}${onlyNullSubjects ? ' (filtered for null subjects only)' : ''}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in reassign-subjects function:', error);
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


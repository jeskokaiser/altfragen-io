
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
};

// Configuration for robust processing
const CONFIG = {
  BATCH_SIZE: 2,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  REQUEST_DELAY: 1200,
  CHUNK_SIZE: 15,
  CHUNK_DELAY: 3000,
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Job tracking interface
interface JobProgress {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  total: number;
  errors: number;
  message: string;
  created_at: string;
  updated_at: string;
  result?: any;
}

async function createJobProgress(supabase: any, jobId: string, total: number): Promise<void> {
  const { error } = await supabase
    .from('job_progress')
    .insert({
      id: jobId,
      status: 'pending',
      progress: 0,
      total,
      errors: 0,
      message: 'Job queued for processing',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error creating job progress:', error);
  }
}

async function updateJobProgress(
  supabase: any, 
  jobId: string, 
  updates: Partial<JobProgress>
): Promise<void> {
  const { error } = await supabase
    .from('job_progress')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId);

  if (error) {
    console.error('Error updating job progress:', error);
  }
}

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
        model: 'gpt-4.1-nano',
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

async function processQuestionsInBackground(
  jobId: string,
  questions: any[],
  availableSubjects: string[],
  openAIApiKey: string,
  supabase: any,
  examName: string,
  onlyNullSubjects: boolean
) {
  console.log(`Starting background processing for job ${jobId} with ${questions.length} questions`);
  
  let processed = 0;
  let errors = 0;
  const updatedQuestions = [];

  try {
    await updateJobProgress(supabase, jobId, {
      status: 'processing',
      message: `Processing ${questions.length} questions for exam: ${examName}${onlyNullSubjects ? ' (null subjects only)' : ''}`
    });

    // Process questions in chunks with memory management
    for (let chunkStart = 0; chunkStart < questions.length; chunkStart += CONFIG.CHUNK_SIZE) {
      const chunk = questions.slice(chunkStart, chunkStart + CONFIG.CHUNK_SIZE);
      console.log(`Processing chunk ${Math.floor(chunkStart / CONFIG.CHUNK_SIZE) + 1}/${Math.ceil(questions.length / CONFIG.CHUNK_SIZE)} (${chunk.length} questions)`);

      const chunkResults = [];

      for (let i = 0; i < chunk.length; i += CONFIG.BATCH_SIZE) {
        const batch = chunk.slice(i, i + CONFIG.BATCH_SIZE);
        
        const batchPromises = batch.map(async (question, index) => {
          await sleep(index * 300);
          return assignSubjectToQuestion(question, availableSubjects, openAIApiKey, supabase);
        });

        const batchResults = await Promise.allSettled(batchPromises);
        
        for (const result of batchResults) {
          if (result.status === 'fulfilled') {
            chunkResults.push(result.value);
            if (!result.value.success) errors++;
          } else {
            console.error('Batch processing error:', result.reason);
            errors++;
            const failedQuestion = batch[batchResults.indexOf(result)];
            chunkResults.push({
              ...failedQuestion,
              subject: availableSubjects[0],
              success: false,
              error: result.reason?.message || 'Unknown error'
            });
          }
          processed++;
        }

        // Update progress more frequently
        await updateJobProgress(supabase, jobId, {
          progress: processed,
          errors,
          message: `Processed ${processed}/${questions.length} questions (${errors} errors)`
        });

        console.log(`Progress: ${processed}/${questions.length} questions processed (${errors} errors)`);

        if (i + CONFIG.BATCH_SIZE < chunk.length) {
          await sleep(CONFIG.REQUEST_DELAY);
        }
      }

      // Add processed chunk results and clear memory
      updatedQuestions.push(...chunkResults);
      
      if (chunkStart + CONFIG.CHUNK_SIZE < questions.length) {
        console.log(`Completed chunk, waiting ${CONFIG.CHUNK_DELAY}ms before next chunk...`);
        await sleep(CONFIG.CHUNK_DELAY);
      }
    }

    const successCount = updatedQuestions.filter(q => q.success !== false).length;
    
    console.log(`Completed processing: ${successCount}/${questions.length} questions successfully updated, ${errors} errors`);

    // Final progress update
    await updateJobProgress(supabase, jobId, {
      status: 'completed',
      progress: processed,
      errors,
      message: `Successfully processed ${successCount} out of ${questions.length} questions${errors > 0 ? ` (${errors} questions had errors and used fallback subjects)` : ''}${onlyNullSubjects ? ' (filtered for null subjects only)' : ''}`,
      result: {
        total: questions.length,
        successful: successCount,
        errors: errors,
        processed: processed
      }
    });

  } catch (error) {
    console.error(`Fatal error in background processing for job ${jobId}:`, error);
    
    await updateJobProgress(supabase, jobId, {
      status: 'failed',
      progress: processed,
      errors: errors + 1,
      message: `Processing failed: ${error.message}`,
      result: {
        error: error.message,
        processed,
        errors
      }
    });
  }
}

// Handle graceful shutdown
addEventListener('beforeunload', (ev) => {
  console.log('Function shutdown detected due to:', ev.detail?.reason);
  // The job progress will remain in the database with the last known state
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle status check requests
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const jobId = url.searchParams.get('jobId');
    
    if (!jobId) {
      return new Response(
        JSON.stringify({ error: 'Missing jobId parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: jobProgress, error } = await supabase
      .from('job_progress')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Job not found', details: error.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(jobProgress),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
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

    console.log('About to execute query...');
    const { data: allQuestions, error: questionsError } = await query;

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch questions', details: questionsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Query executed successfully, found ${allQuestions?.length || 0} total questions`);

    // Filter for null subjects on the client side if requested
    let questions = allQuestions || [];
    if (onlyNullSubjects === true) {
      console.log('Filtering for null subjects only on client side');
      questions = questions.filter(q => !q.subject || q.subject.trim() === '');
      console.log(`After filtering for null subjects: ${questions.length} questions`);
    }

    if (questions.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'No questions found matching the criteria',
          details: `Found ${allQuestions?.length || 0} total questions, ${questions.length} after filtering`
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique job ID
    const jobId = crypto.randomUUID();

    // Create job progress tracking
    await createJobProgress(supabase, jobId, questions.length);

    // Start background processing immediately
    console.log(`Starting background processing for job ${jobId}`);
    processQuestionsInBackground(
      jobId,
      questions,
      availableSubjects,
      openAIApiKey,
      supabase,
      examName,
      onlyNullSubjects
    ).catch(error => {
      console.error(`Background processing failed for job ${jobId}:`, error);
    });

    // Return immediate response with job ID
    return new Response(
      JSON.stringify({ 
        success: true,
        jobId,
        message: `Started processing ${questions.length} questions. Use the jobId to check progress.`,
        totalQuestions: questions.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in reassign-subjects function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        suggestion: 'Check the logs for more details'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

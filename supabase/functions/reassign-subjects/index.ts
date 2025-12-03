import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
};

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

    const { data: job, error } = await supabase
      .from('subject_jobs')
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
      JSON.stringify(job),
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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Generate unique job ID
    const jobId = crypto.randomUUID();

    const { error: insertError } = await supabase
      .from('subject_jobs')
      .insert({
        id: jobId,
        type: 'reassign',
        status: 'pending',
        exam_name: examName,
        university_id: universityId ?? null,
        only_null_subjects: !!onlyNullSubjects,
        available_subjects: availableSubjects,
        progress: 0,
        total: 0,
        errors: 0,
        message: `Queued subject reassignment job for exam "${examName}"`,
        payload: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error creating subject job:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create subject reassignment job', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Trigger worker to process the job (fire and forget)
    // Note: This runs asynchronously and won't block the response
    const workerUrl = Deno.env.get('SUBJECT_WORKER_URL') || 'https://api.altfragen.io/subject-worker';
    const triggerUrl = `${workerUrl}/process-job/${jobId}`;
    console.log(`Triggering worker at: ${triggerUrl}`);
    
    // Fire and forget - don't await to avoid blocking
    fetch(triggerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
      .then(async (response) => {
        console.log(`Worker trigger response status: ${response.status}`);
        if (!response.ok) {
          const text = await response.text();
          console.error(`Worker trigger failed with status ${response.status}: ${text}`);
        } else {
          // Check if response has content before parsing JSON
          const text = await response.text();
          if (text && text.trim()) {
            try {
              const data = JSON.parse(text);
              console.log('Worker trigger successful:', data);
            } catch (e) {
              console.log('Worker trigger successful (non-JSON response):', text);
            }
          } else {
            console.log('Worker trigger successful (empty response)');
          }
        }
      })
      .catch(err => {
        console.error('Failed to trigger worker (non-critical):', err.message || err);
        // Don't fail the request if worker trigger fails - worker will poll for pending jobs
      });

    return new Response(
      JSON.stringify({ 
        success: true,
        jobId,
        message: `Started subject reassignment job. Use the jobId to check progress.`,
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

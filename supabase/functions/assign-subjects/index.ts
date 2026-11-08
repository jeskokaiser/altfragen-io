import 'https://deno.land/x/xhr@0.1.0/mod.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { getSecretKey } from '../_shared/supabaseKeys.ts';
import { bearerToken, parseAssignRequest } from '../_shared/callerAuth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', getSecretKey() ?? '');

  // Contract C4: the caller comes from the verified access token.
  const token = bearerToken(req.headers.get('Authorization'));
  const {
    data: { user },
  } = token ? await supabase.auth.getUser(token) : { data: { user: null } };
  if (!user) return json({ error: 'Unauthorized' }, 401);

  // Handle status check requests
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const jobId = url.searchParams.get('jobId');

    if (!jobId) {
      return new Response(JSON.stringify({ error: 'Missing jobId parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Only the caller's own jobs
    const { data: job, error } = await supabase
      .from('subject_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: 'Job not found', details: error.message }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(job), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const parsed = parseAssignRequest(await req.json().catch(() => null));
    if (!parsed.ok) return json({ error: parsed.error }, 400);
    const { questions, availableSubjects, questionIds } = parsed;
    // A userId in the body is ignored: the job belongs to the caller.
    const userId = user.id;

    // Contract C4: every question must be the caller's own. Checked in chunks
    // so the id list stays well inside the request URL limit.
    let ownedCount = 0;
    for (let i = 0; i < questionIds.length; i += 100) {
      const { data: owned, error: ownedError } = await supabase
        .from('questions')
        .select('id')
        .in('id', questionIds.slice(i, i + 100))
        .eq('user_id', userId);
      if (ownedError) {
        console.error('Error checking question ownership:', ownedError.message);
        return json({ error: 'Failed to check questions' }, 500);
      }
      ownedCount += (owned ?? []).length;
    }
    if (ownedCount !== questionIds.length) {
      return json({ error: 'Subjects can only be assigned to your own questions' }, 403);
    }

    const totalQuestions = questions.length;
    const jobId = crypto.randomUUID();

    const payload = {
      questions,
      availableSubjects,
      userId,
    };

    const { error: insertError } = await supabase.from('subject_jobs').insert({
      id: jobId,
      type: 'assign',
      status: 'pending',
      user_id: userId,
      available_subjects: availableSubjects,
      progress: 0,
      total: totalQuestions,
      errors: 0,
      message: `Queued subject assignment job for ${totalQuestions} questions`,
      payload,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error('Error creating assign-subject job:', insertError);
      return new Response(
        JSON.stringify({
          error: 'Failed to create subject assignment job',
          details: insertError.message,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Trigger worker to process the job (fire and forget)
    // Note: This runs asynchronously and won't block the response
    const workerUrl =
      Deno.env.get('SUBJECT_WORKER_URL') || 'https://api.altfragen.io/subject-worker';
    const triggerUrl = `${workerUrl}/process-job/${jobId}`;
    console.log(`Triggering worker at: ${triggerUrl}`);

    // Fire and forget - don't await to avoid blocking
    // Contract C2: the worker checks AI_COMMENTARY_BACKEND_TOKEN.
    fetch(triggerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('AI_COMMENTARY_BACKEND_TOKEN') ?? ''}`,
      },
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
            } catch {
              console.log('Worker trigger successful (non-JSON response):', text);
            }
          } else {
            console.log('Worker trigger successful (empty response)');
          }
        }
      })
      .catch((err) => {
        console.error('Failed to trigger worker (non-critical):', err.message || err);
        // Don't fail the request if worker trigger fails - worker will poll for pending jobs
      });

    return new Response(
      JSON.stringify({
        success: true,
        jobId,
        totalQuestions,
        message: `Started subject assignment job for ${totalQuestions} questions. Use the jobId to check progress.`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error in assign-subjects function:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message,
        suggestion: 'Try reducing the batch size or check your API limits',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

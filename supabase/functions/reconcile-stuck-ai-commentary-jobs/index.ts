// @ts-nocheck
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { getSecretKey } from '../_shared/supabaseKeys.ts';
import { isCronCall } from '../_shared/callerAuth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  // Contract C3: only the pg_cron job (or the owner with the secret) may
  // start a run. Without CRON_SECRET set, every call is refused.
  if (!isCronCall(req.headers.get('x-cron-secret'), Deno.env.get('CRON_SECRET'))) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = getSecretKey();
  if (!supabaseUrl || !serviceKey) {
    return json({ error: 'Missing Supabase configuration' }, 500);
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const maxAttempts = Math.max(1, Math.min(50, Number(body.max_attempts ?? 10)));
  const limit = Math.max(1, Math.min(500, Number(body.limit ?? 200)));

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  // Find stuck processing jobs (lease expired).
  const { data: stuck, error: stuckError } = await supabase
    .from('ai_commentary_job_queue')
    .select('id,question_id,attempts,status,lease_expires_at')
    .eq('status', 'processing')
    .lt('lease_expires_at', new Date().toISOString())
    .order('lease_expires_at', { ascending: true })
    .limit(limit);

  if (stuckError) {
    return json({ error: 'Failed to load stuck jobs', details: stuckError.message }, 500);
  }

  const stuckJobs = (stuck ?? []) as Array<{
    id: string;
    question_id: string;
    attempts: number;
    status: string;
    lease_expires_at: string | null;
  }>;

  if (!stuckJobs.length) {
    return json({ status: 'ok', found: 0, reset: 0, dead: 0 });
  }

  const toDead = stuckJobs.filter((j) => (j.attempts ?? 0) >= maxAttempts).map((j) => j.id);
  const toReset = stuckJobs.filter((j) => (j.attempts ?? 0) < maxAttempts).map((j) => j.id);

  const nowIso = new Date().toISOString();

  // Re-check status and lease on the update itself: a worker may have finished
  // or re-leased a job since the select above, and that job must stay as it is.
  const release = (ids: string[], status: 'dead' | 'pending', lastError: string) =>
    supabase
      .from('ai_commentary_job_queue')
      .update({
        status,
        claimed_by: null,
        claimed_at: null,
        lease_expires_at: null,
        last_error: lastError,
        updated_at: nowIso,
      })
      .in('id', ids)
      .eq('status', 'processing')
      .lt('lease_expires_at', nowIso)
      .select('id,question_id');

  let dead: Array<{ id: string; question_id: string }> = [];
  if (toDead.length) {
    const { data, error } = await release(toDead, 'dead', 'stuck_processing_dead_letter');
    if (error) return json({ error: 'Failed to dead-letter jobs', details: error.message }, 500);
    dead = data ?? [];
  }

  let reset: Array<{ id: string; question_id: string }> = [];
  if (toReset.length) {
    const { data, error } = await release(toReset, 'pending', 'stuck_processing_reset');
    if (error) return json({ error: 'Failed to reset jobs', details: error.message }, 500);
    reset = data ?? [];
  }

  // Legacy question state follows only the jobs that were actually reset.
  const questionIds = reset.map((j) => j.question_id).filter(Boolean);
  if (questionIds.length) {
    const { error } = await supabase
      .from('questions')
      .update({ ai_commentary_status: 'pending' })
      .in('id', questionIds)
      .eq('ai_commentary_status', 'processing');
    if (error) return json({ error: 'Failed to reset questions', details: error.message }, 500);
  }

  return json({
    status: 'ok',
    found: stuckJobs.length,
    reset: reset.length,
    dead: dead.length,
  });
});

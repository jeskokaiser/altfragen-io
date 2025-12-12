import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret) {
    const provided = req.headers.get("x-cron-secret");
    if (!provided || provided !== cronSecret) {
      return json({ error: "Unauthorized" }, 401);
    }
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return json({ error: "Missing Supabase configuration" }, 500);
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
    .from("ai_commentary_job_queue")
    .select("id,question_id,attempts,status,lease_expires_at")
    .eq("status", "processing")
    .lt("lease_expires_at", new Date().toISOString())
    .order("lease_expires_at", { ascending: true })
    .limit(limit);

  if (stuckError) {
    return json({ error: "Failed to load stuck jobs", details: stuckError.message }, 500);
  }

  const stuckJobs = (stuck ?? []) as Array<{
    id: string;
    question_id: string;
    attempts: number;
    status: string;
    lease_expires_at: string | null;
  }>;

  if (!stuckJobs.length) {
    return json({ status: "ok", found: 0, reset: 0, dead: 0 });
  }

  const toDead = stuckJobs.filter((j) => (j.attempts ?? 0) >= maxAttempts).map((j) => j.id);
  const toReset = stuckJobs.filter((j) => (j.attempts ?? 0) < maxAttempts).map((j) => j.id);

  const nowIso = new Date().toISOString();

  if (toDead.length) {
    await supabase
      .from("ai_commentary_job_queue")
      .update({
        status: "dead",
        claimed_by: null,
        claimed_at: null,
        lease_expires_at: null,
        last_error: "stuck_processing_dead_letter",
        updated_at: nowIso,
      })
      .in("id", toDead);
  }

  if (toReset.length) {
    await supabase
      .from("ai_commentary_job_queue")
      .update({
        status: "pending",
        claimed_by: null,
        claimed_at: null,
        lease_expires_at: null,
        last_error: "stuck_processing_reset",
        updated_at: nowIso,
      })
      .in("id", toReset);

    // Optional: reset legacy question state too (best-effort).
    const questionIds = stuckJobs
      .filter((j) => (j.attempts ?? 0) < maxAttempts)
      .map((j) => j.question_id);

    if (questionIds.length) {
      await supabase
        .from("questions")
        .update({ ai_commentary_status: "pending" })
        .in("id", questionIds)
        .eq("ai_commentary_status", "processing");
    }
  }

  return json({
    status: "ok",
    found: stuckJobs.length,
    reset: toReset.length,
    dead: toDead.length,
  });
});



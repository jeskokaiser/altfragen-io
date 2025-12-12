import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

type ClaimedJob = {
  id: string;
  question_id: string;
  target_level: "full" | "partial";
  status: string;
  claimed_by: string | null;
  claimed_at: string | null;
  lease_expires_at: string | null;
  attempts: number;
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
  const backendUrl = Deno.env.get("AI_COMMENTARY_BACKEND_URL");
  const backendToken = Deno.env.get("AI_COMMENTARY_BACKEND_TOKEN");

  if (!supabaseUrl || !serviceKey) {
    return json({ error: "Missing Supabase configuration" }, 500);
  }
  if (!backendUrl || !backendToken) {
    return json({ error: "Missing backend configuration" }, 500);
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const workerId = String(body.worker_id ?? crypto.randomUUID());
  const batchSizeEnv = Number(Deno.env.get("AI_COMMENTARY_BATCH_SIZE") ?? "10");
  const leaseSecondsEnv = Number(Deno.env.get("AI_COMMENTARY_LEASE_SECONDS") ?? "900");
  const batchSize = Math.max(1, Math.min(100, Number(body.batch_size ?? batchSizeEnv)));
  const leaseSeconds = Math.max(60, Math.min(3600, Number(body.lease_seconds ?? leaseSecondsEnv)));

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  // 1) Claim jobs atomically in the DB.
  const { data: claimed, error: claimError } = await supabase.rpc(
    "ai_commentary_claim_next_batch",
    {
      batch_size: batchSize,
      worker_id: workerId,
      lease_seconds: leaseSeconds,
    },
  );

  if (claimError) {
    return json({ error: "Failed to claim jobs", details: claimError.message }, 500);
  }

  const claimedJobs = (claimed ?? []) as ClaimedJob[];
  if (!claimedJobs.length) {
    return json({ status: "ok", worker_id: workerId, claimed: 0 });
  }

  // 2) Forward claimed job IDs to external backend.
  const backendResp = await fetch(`${backendUrl.replace(/\/$/, "")}/process-batch`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${backendToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      worker_id: workerId,
      jobs: claimedJobs.map((j) => ({
        id: j.id,
        question_id: j.question_id,
        target_level: j.target_level,
      })),
    }),
  });

  if (!backendResp.ok) {
    const text = await backendResp.text().catch(() => "");

    // Best-effort rollback: release jobs back to pending so they can be retried.
    await supabase
      .from("ai_commentary_job_queue")
      .update({
        status: "pending",
        claimed_by: null,
        claimed_at: null,
        lease_expires_at: null,
        last_error: `dispatch_failed:${backendResp.status}:${text.slice(0, 500)}`,
        updated_at: new Date().toISOString(),
      })
      .in(
        "id",
        claimedJobs.map((j) => j.id),
      );

    return json(
      {
        error: "Backend processing call failed",
        backend_status: backendResp.status,
        backend_body: text,
        released: claimedJobs.length,
      },
      502,
    );
  }

  const backendJson = await backendResp.json().catch(() => ({}));
  return json({
    status: "ok",
    worker_id: workerId,
    claimed: claimedJobs.length,
    backend: backendJson,
  });
});



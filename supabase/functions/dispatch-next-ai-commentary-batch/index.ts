// @ts-nocheck
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
  const startedAt = Date.now();
  try {
    const url = new URL(req.url);
    console.log("[DISPATCH] request", {
      method: req.method,
      path: url.pathname,
      hasBody: req.headers.get("content-length") != null,
      contentLength: req.headers.get("content-length"),
      userAgent: req.headers.get("user-agent"),
    });

    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const backendUrl = Deno.env.get("AI_COMMENTARY_BACKEND_URL");
    const backendToken = Deno.env.get("AI_COMMENTARY_BACKEND_TOKEN");

    console.log("[DISPATCH] env presence", {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!serviceKey,
      hasBackendUrl: !!backendUrl,
      hasBackendToken: !!backendToken,
    });

    if (!supabaseUrl || !serviceKey) {
      console.error("[DISPATCH] Missing Supabase configuration", {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!serviceKey,
      });
      return json({ error: "Missing Supabase configuration" }, 500);
    }
    if (!backendUrl || !backendToken) {
      console.error("[DISPATCH] Missing backend configuration", {
        hasBackendUrl: !!backendUrl,
        hasBackendToken: !!backendToken,
      });
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
    // Batch APIs can legitimately take many hours; allow leases up to 24h.
    const leaseSeconds = Math.max(
      60,
      Math.min(86400, Number(body.lease_seconds ?? leaseSecondsEnv)),
    );

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // Default batch size comes from DB settings (single-row ai_commentary_settings),
    // with env/body overrides.
    let settingsBatchSize: number | null = null;
    try {
      const { data: settingsRow, error: settingsError } = await supabase
        .from("ai_commentary_settings")
        .select("batch_size")
        .limit(1)
        .maybeSingle();
      if (!settingsError && settingsRow && typeof settingsRow.batch_size === "number") {
        settingsBatchSize = settingsRow.batch_size;
      }
      console.log("[DISPATCH] settings batch_size", {
        settingsBatchSize,
        settingsError: settingsError?.message,
      });
    } catch (_e) {
      // Best-effort only; fall back to env defaults.
      settingsBatchSize = null;
      console.log("[DISPATCH] settings fetch threw, falling back");
    }

    const effectiveBatchSize = Math.max(
      1,
      Math.min(100, Number(body.batch_size ?? settingsBatchSize ?? batchSize)),
    );
    console.log("[DISPATCH] claim params", {
      workerId,
      effectiveBatchSize,
      leaseSeconds,
      batchSizeEnv,
      settingsBatchSize,
      bodyBatchSize: body.batch_size,
      leaseSecondsEnv,
      bodyLeaseSeconds: body.lease_seconds,
    });

    // 1) Claim jobs atomically in the DB.
    const { data: claimed, error: claimError } = await supabase.rpc(
      "ai_commentary_claim_next_batch",
      {
        batch_size: effectiveBatchSize,
        worker_id: workerId,
        lease_seconds: leaseSeconds,
      },
    );

    if (claimError) {
      console.error("[DISPATCH] rpc claim failed", { message: claimError.message });
      return json(
        { error: "Failed to claim jobs", details: claimError.message, ms: Date.now() - startedAt },
        500,
      );
    }

    const claimedJobs = (claimed ?? []) as ClaimedJob[];
    console.log("[DISPATCH] claim result", {
      claimed: claimedJobs.length,
      sample: claimedJobs.slice(0, 3).map((j) => ({ id: j.id, target_level: j.target_level })),
      ms: Date.now() - startedAt,
    });
    if (!claimedJobs.length) {
      return json({ status: "ok", worker_id: workerId, claimed: 0, ms: Date.now() - startedAt });
    }

    // 2) Forward claimed job IDs to external backend.
    const processUrl = `${backendUrl.replace(/\/$/, "")}/process-batch`;
    console.log("[DISPATCH] calling backend", {
      processUrl,
      jobs: claimedJobs.length,
    });
    const backendResp = await fetch(processUrl, {
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
    console.log("[DISPATCH] backend response", {
      status: backendResp.status,
      ok: backendResp.ok,
      ms: Date.now() - startedAt,
    });

    if (!backendResp.ok) {
      const text = await backendResp.text().catch(() => "");
      console.error("[DISPATCH] backend not ok", { status: backendResp.status, body: text });

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
          ms: Date.now() - startedAt,
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
      ms: Date.now() - startedAt,
    });
  } catch (err: any) {
    console.error("[DISPATCH] uncaught error", { error: String(err), stack: err?.stack });
    return json({ error: "Internal error", details: String(err) }, 500);
  }
});



import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.error("[AI-CREDITS-STATUS] Missing Supabase env vars", {
        hasUrl: !!supabaseUrl,
        hasAnonKey: !!supabaseAnonKey,
        hasServiceKey: !!supabaseServiceKey,
      });
      return new Response(
        JSON.stringify({ error: "Missing Supabase configuration" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Use anon client only to authenticate the user token (respecting RLS)
    const anonClient = createClient(supabaseUrl, supabaseAnonKey);

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data: authData, error: authError } =
      await anonClient.auth.getUser(token);

    if (authError || !authData.user) {
      console.error("[AI-CREDITS-STATUS] Auth error", authError);
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const user = authData.user;

    // Use service-role client for consistent access to subscription state and quota
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Load profile to check premium status (same flag used elsewhere in the app).
    // Use maybeSingle so that users without a profile row are simply treated as non-premium.
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("is_premium")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("[AI-CREDITS-STATUS] Failed to load profile", profileError);
    }

    // Also consider active subscription in subscribers table (source of truth for billing)
    const { data: subscriber, error: subscriberError } = await supabaseClient
      .from("subscribers")
      .select("subscribed, subscription_end")
      .eq("user_id", user.id)
      .maybeSingle();

    if (subscriberError && subscriberError.code !== "PGRST116") {
      console.error("[AI-CREDITS-STATUS] Failed to load subscriber", subscriberError);
    }

    const now = new Date();
    const subscriptionEnd = subscriber?.subscription_end
      ? new Date(subscriber.subscription_end)
      : null;
    const hasActiveSubscription =
      !!subscriber?.subscribed &&
      (!subscriptionEnd || subscriptionEnd.getTime() > now.getTime());

    const isPremium = !!profile?.is_premium || hasActiveSubscription;

    // Determine current calendar month (first day, UTC) to match backend logic
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
      .toISOString()
      .slice(0, 10); // YYYY-MM-DD

    const BASE_MONTHLY_FREE_LIMIT = 100;

    // 1) Fetch monthly usage row for this user/month (free quota)
    const { data: monthRow, error: monthError } = await supabaseClient
      .from("user_private_ai_quota")
      .select("free_used_count,month_start")
      .eq("user_id", user.id)
      .eq("month_start", monthStart)
      .maybeSingle();

    if (monthError && monthError.code !== "PGRST116") {
      console.error("[AI-CREDITS-STATUS] Failed to load monthly quota", monthError);
    }

    const freeUsedCount = monthRow?.free_used_count ?? 0;
    const remainingFree = Math.max(0, BASE_MONTHLY_FREE_LIMIT - freeUsedCount);

    // 2) Sum all paid credits across all months (global pool)
    const { data: allQuotaRows, error: allQuotaError } = await supabaseClient
      .from("user_private_ai_quota")
      .select("paid_credits_remaining")
      .eq("user_id", user.id);

    if (allQuotaError) {
      console.error("[AI-CREDITS-STATUS] Failed to load paid credits", allQuotaError);
    }

    const paidCreditsRemaining = (allQuotaRows || []).reduce(
      (sum: number, row: any) => sum + (row?.paid_credits_remaining ?? 0),
      0,
    );

    const totalRemaining = remainingFree + paidCreditsRemaining;
    const processingBlocked = !isPremium || totalRemaining <= 0;

    const body = {
      isPremium,
      monthStart,
      baseMonthlyFreeLimit: BASE_MONTHLY_FREE_LIMIT,
      freeUsedCount,
      remainingFree,
      paidCreditsRemaining,
      totalRemaining,
      processingBlocked,
    };

    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[AI-CREDITS-STATUS] Unexpected error", error);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});



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

    const BASE_MONTHLY_FREE_LIMIT = 100;

    // Rolling 30-day window (displayed as \"30-Tage-Zeitraum ab <date>\")
    const windowStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    // Canonical usage from ledger (rolling 30 days)
    const { data: fullUsed30d, error: usedError } = await supabaseClient.rpc(
      "ai_private_full_used_30d",
      { p_user_id: user.id },
    );

    if (usedError) {
      console.error("[AI-CREDITS-STATUS] Failed to load rolling 30d usage", usedError);
    }

    const used = Number(fullUsed30d ?? 0);
    const freeUsedCount = Math.max(0, Math.min(BASE_MONTHLY_FREE_LIMIT, used));
    const remainingFree = Math.max(0, BASE_MONTHLY_FREE_LIMIT - used);

    // Canonical credits remaining from ledger (sum of deltas)
    const { data: creditsRemainingRaw, error: creditsError } =
      await supabaseClient.rpc("ai_private_credits_remaining", { p_user_id: user.id });

    if (creditsError) {
      console.error("[AI-CREDITS-STATUS] Failed to load credits remaining", creditsError);
    }

    const paidCreditsRemaining = Math.max(0, Number(creditsRemainingRaw ?? 0));

    const totalRemaining = remainingFree + paidCreditsRemaining;
    const processingBlocked = !isPremium || totalRemaining <= 0;

    const body = {
      isPremium,
      monthStart: windowStart,
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



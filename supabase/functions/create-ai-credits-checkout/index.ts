import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, details?: unknown) => {
  console.log(
    `[CREATE-AI-CREDITS-CHECKOUT] ${step}${
      details ? ` - ${JSON.stringify(details)}` : ""
    }`,
  );
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log("Function started");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const aiCreditsPriceId = Deno.env.get("STRIPE_PRICE_AI_PRIVATE_CREDITS_ID");

    if (
      !supabaseUrl || !supabaseAnonKey || !supabaseServiceKey || !stripeKey ||
      !aiCreditsPriceId
    ) {
      log("Missing environment variables", {
        hasUrl: !!supabaseUrl,
        hasAnonKey: !!supabaseAnonKey,
        hasServiceKey: !!supabaseServiceKey,
        hasStripeKey: !!stripeKey,
        hasAiCreditsPriceId: !!aiCreditsPriceId,
      });
      throw new Error("Missing required environment variables");
    }

    // Use anon client only to authenticate the user token (respecting RLS)
    const anonClient = createClient(supabaseUrl, supabaseAnonKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      log("No authorization header");
      return new Response(
        JSON.stringify({ error: "No authorization header provided" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const token = authHeader.replace("Bearer ", "");
    log("Authenticating user");
    const { data, error: authError } = await anonClient.auth.getUser(token);

    if (authError || !data.user) {
      log("Authentication failed", { error: authError?.message });
      return new Response(
        JSON.stringify({ error: "Authentication failed" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const user = data.user;
    if (!user.email) {
      log("User email missing");
      throw new Error("User email is required for checkout");
    }

    // After we know which user this is, use service-role client for consistent access
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Ensure user is premium before allowing credits purchase (mirror ai-comment-credits-status)
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("is_premium")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError && profileError.code !== "PGRST116") {
      log("Failed to load profile", { error: profileError.message });
      throw new Error("Failed to load profile");
    }

    const { data: subscriber, error: subscriberError } = await supabaseClient
      .from("subscribers")
      .select("subscribed, subscription_end")
      .eq("user_id", user.id)
      .maybeSingle();

    if (subscriberError && subscriberError.code !== "PGRST116") {
      log("Failed to load subscriber", { error: subscriberError.message });
    }

    const now = new Date();
    const subscriptionEnd = subscriber?.subscription_end
      ? new Date(subscriber.subscription_end)
      : null;
    const hasActiveSubscription =
      !!subscriber?.subscribed &&
      (!subscriptionEnd || subscriptionEnd.getTime() > now.getTime());

    const isPremium = !!profile?.is_premium || hasActiveSubscription;

    if (!isPremium) {
      log("Non-premium user attempted to buy AI credits", { userId: user.id });
      return new Response(
        JSON.stringify({
          error: "Nur Premium-Nutzer können zusätzliche private KI-Credits kaufen.",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Parse desired quantity of 100-credit packs from request body (defaults to 1)
    let packs = 1;
    try {
      const reqBody = await req.json();
      const requested = Number(reqBody?.quantity);
      if (Number.isFinite(requested)) {
        packs = Math.max(1, Math.min(20, Math.floor(requested)));
      }
    } catch {
      // No/invalid JSON body – fall back to 1 pack
      packs = 1;
    }

    log("Creating checkout with packs", { packs });

    // Try to re-use existing customer if present
    log("Checking for existing Stripe customer");
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      log("Found existing customer", { customerId });
    }

    const origin =
      req.headers.get("origin") ??
      req.headers.get("referer") ??
      "https://ynzxzhpivcmkpipanltd.supabase.co";

    log("Creating one-time checkout session for AI credits", { origin });

    // 100 private questions per pack = 2€ per pack (configured in Stripe)
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: aiCreditsPriceId,
          quantity: packs,
        },
      ],
      mode: "payment",
      success_url: `${origin}/dashboard?ai_credits=success`,
      cancel_url: `${origin}/dashboard?ai_credits=cancelled`,
      allow_promotion_codes: true,
      metadata: {
        purpose: "ai_private_question_credits",
        user_id: user.id,
        packs: String(packs),
      },
      client_reference_id: user.id,
    });

    log("Checkout session created", { sessionId: session.id });

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log("ERROR in create-ai-credits-checkout", { message });
    return new Response(
      JSON.stringify({
        error: message,
        details: "Check edge function logs for more information",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});



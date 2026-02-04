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
    `[CREATE-LIFETIME-CHECKOUT] ${step}${
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
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const lifetimePriceId = Deno.env.get("STRIPE_PRICE_LIFETIME_ID");

    if (
      !supabaseUrl || !supabaseAnonKey || !stripeKey || !lifetimePriceId
    ) {
      log("Missing environment variables", {
        hasUrl: !!supabaseUrl,
        hasAnonKey: !!supabaseAnonKey,
        hasStripeKey: !!stripeKey,
        hasLifetimePriceId: !!lifetimePriceId,
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

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

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

    log("Creating one-time checkout session for lifetime subscription", { origin });

    // Build checkout session parameters
    const sessionParams: any = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: lifetimePriceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/subscription?checkout=success`,
      cancel_url: `${origin}/subscription?checkout=cancelled`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      invoice_creation: {
        enabled: true,
      },
      metadata: {
        purpose: "lifetime_subscription",
        user_id: user.id,
      },
      client_reference_id: user.id,
    };

    // Ensure Stripe always creates a Customer for lifetime purchases
    if (!customerId) {
      sessionParams.customer_creation = "always";
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

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
    log("ERROR in create-lifetime-checkout", { message });
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

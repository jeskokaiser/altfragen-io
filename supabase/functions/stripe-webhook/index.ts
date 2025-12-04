import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const log = (step: string, details?: unknown) => {
  console.log(
    `[STRIPE-WEBHOOK] ${step}${
      details ? ` - ${JSON.stringify(details)}` : ""
    }`,
  );
};

// Helper to sync subscription state between Stripe and Supabase
const PREMIUM_STATUSES = new Set<Stripe.Subscription.Status>([
  "active",
  "trialing",
]);

async function syncSubscriptionState(
  supabase: ReturnType<typeof createClient>,
  stripe: Stripe,
  subscription: Stripe.Subscription,
  monthlyPriceId?: string | null,
  semesterPriceId?: string | null,
) {
  log("Syncing subscription state", {
    subscriptionId: subscription.id,
    status: subscription.status,
    customer: subscription.customer,
  });

  // Determine if subscription should be treated as active/premium
  const hasActiveSub = PREMIUM_STATUSES.has(subscription.status);

  let subscriptionEnd: string | null = null;
  if (subscription.current_period_end) {
    const periodEndTimestamp = subscription.current_period_end * 1000;
    if (periodEndTimestamp && !isNaN(periodEndTimestamp)) {
      subscriptionEnd = new Date(periodEndTimestamp).toISOString();
    }
  }

  // Determine subscription tier from price ID or metadata
  let subscriptionTier: string | null = null;
  if (hasActiveSub) {
    const priceId = subscription.items.data[0]?.price?.id;

    if (semesterPriceId && priceId === semesterPriceId) {
      subscriptionTier = "Semester";
    } else if (monthlyPriceId && priceId === monthlyPriceId) {
      subscriptionTier = "Monthly";
    } else {
      const metadata = subscription.metadata;
      if (metadata?.price_type === "semester" || metadata?.price_type === "Semester") {
        subscriptionTier = "Semester";
      } else if (
        metadata?.price_type === "monthly" || metadata?.price_type === "Monthly"
      ) {
        subscriptionTier = "Monthly";
      } else if (priceId) {
        subscriptionTier = "Unknown";
      } else {
        subscriptionTier = null;
      }
    }

    log("Determined subscription tier in helper", {
      subscriptionId: subscription.id,
      subscriptionTier,
      subscriptionEnd,
    });
  } else {
    subscriptionTier = null;
    subscriptionEnd = null;
    log("Subscription not in premium status, clearing tier and end", {
      subscriptionId: subscription.id,
      status: subscription.status,
    });
  }

  // Get customer and email
  const customerId = subscription.customer as string | null;
  if (!customerId) {
    log("No customer ID on subscription, cannot sync state", {
      subscriptionId: subscription.id,
    });
    return;
  }

  const customer = await stripe.customers.retrieve(customerId);

  if (customer.deleted || !("email" in customer) || !customer.email) {
    log("Customer not found or has no email in helper", { customerId });
    return;
  }

  const email = customer.email;

  // Try to find existing subscriber by stripe_customer_id first, then by email
  const { data: existingSubscriber, error: subscriberLookupError } = await supabase
    .from("subscribers")
    .select("id, user_id, email, stripe_customer_id")
    .or(`stripe_customer_id.eq.${customerId},email.eq.${email}`)
    .maybeSingle();

  if (subscriberLookupError && subscriberLookupError.code !== "PGRST116") {
    log("Error looking up existing subscriber", {
      error: subscriberLookupError.message,
      customerId,
      email,
    });
  }

  let userId: string | null = existingSubscriber?.user_id || null;

  // Optional improvement: try to associate user_id via profiles table if missing
  if (!userId) {
    try {
      const { data: profileByEmail, error: profileLookupError } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", email)
        .maybeSingle();

      if (profileLookupError && profileLookupError.code !== "PGRST116") {
        log("Error looking up profile by email for user_id association", {
          error: profileLookupError.message,
          email,
        });
      } else if (profileByEmail?.id) {
        userId = profileByEmail.id;
        log("Associated user_id from profiles table", {
          email,
          userId,
        });
      }
    } catch (assocError) {
      log("Unexpected error while associating user_id", { error: assocError });
    }
  }

  if (!userId) {
    log("User ID still not found - will upsert subscriber with email only", {
      email,
      customerId,
    });
  }

  // Upsert subscribers row
  try {
    const { error: upsertError } = await supabase.from("subscribers").upsert(
      {
        email,
        user_id: userId,
        stripe_customer_id: customerId,
        subscribed: hasActiveSub,
        subscription_tier: subscriptionTier,
        subscription_end: subscriptionEnd,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" },
    );

    if (upsertError) {
      log("Failed to upsert subscribers row in helper", {
        error: upsertError.message,
        email,
        customerId,
      });
    } else {
      log("Subscribers table upserted in helper", {
        email,
        userId,
        customerId,
        subscribed: hasActiveSub,
        subscriptionTier,
        subscriptionEnd,
      });
    }
  } catch (dbError) {
    log("Unexpected error while upserting subscribers row in helper", {
      error: dbError,
    });
  }

  // Update profiles.is_premium if we have a userId
  if (userId) {
    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ is_premium: hasActiveSub })
        .eq("id", userId);

      if (profileError) {
        log("Profile update failed in helper", { error: profileError.message });
      } else {
        log("Profile updated successfully in helper", {
          userId,
          is_premium: hasActiveSub,
        });
      }
    } catch (profileError) {
      log("Profile update error in helper", { error: profileError });
    }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "content-type, stripe-signature, apikey, authorization",
      },
    });
  }

  // Supabase Edge Functions require authentication via apikey query parameter
  // NOTE: Set "Verify JWT with legacy secret" OFF in Edge function details in Supabase
  // The webhook URL in Stripe MUST include: ?apikey=[your-anon-key]
  // This is required by Supabase's gateway before the request reaches our function
  const url = new URL(req.url);
  const apikeyParam = url.searchParams.get("apikey");
  const apikeyHeader = req.headers.get("apikey");
  const authHeader = req.headers.get("Authorization");
  
  // Log what we received for debugging
  log("Webhook endpoint called", { 
    method: req.method,
    hasSignature: !!req.headers.get("stripe-signature"),
    hasApikeyParam: !!apikeyParam,
    hasApikeyHeader: !!apikeyHeader,
    hasAuthHeader: !!authHeader,
    url: req.url
  });

  // Note: If you're still getting 401, the Supabase gateway is blocking the request
  // BEFORE it reaches this code. This means the apikey parameter is not in the webhook URL.
  // 
  // SOLUTION: In Stripe Dashboard → Webhooks → Your endpoint
  // The URL MUST be: https://[project].supabase.co/functions/v1/stripe-webhook?apikey=[anon-key]
  // 
  // Get your anon key from: Supabase Dashboard → Settings → API → anon public key

  const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const aiCreditsPriceId = Deno.env.get("STRIPE_PRICE_AI_PRIVATE_CREDITS_ID");
  const monthlyPriceId = Deno.env.get("STRIPE_PRICE_MONTHLY_ID");
  const semesterPriceId = Deno.env.get("STRIPE_PRICE_SEMESTER_ID");

  if (!stripeSecret || !webhookSecret || !supabaseUrl || !supabaseServiceKey) {
    log("Missing required environment variables", {
      hasStripeSecret: !!stripeSecret,
      hasWebhookSecret: !!webhookSecret,
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
    });
    return new Response("Missing configuration", { status: 500 });
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" });

  const body = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log("Webhook signature verification failed", { message });
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }

  log("Received event", { type: event.type });

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Handle subscription events
  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    
    log("Processing subscription event", {
      eventType: event.type,
      subscriptionId: subscription.id,
      status: subscription.status,
      customerId: subscription.customer,
    });

    await syncSubscriptionState(
      supabase,
      stripe,
      subscription,
      monthlyPriceId,
      semesterPriceId,
    );

    return new Response("OK", { status: 200 });
  }

  // Handle one-time payment events (AI credits)
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Handle subscription checkouts
    if (session.mode === "subscription") {
      log("Subscription checkout completed", {
        sessionId: session.id,
        subscription: session.subscription,
        customer: session.customer,
      });

      if (!session.subscription) {
        log("No subscription attached to checkout session, cannot sync");
        return new Response("OK", { status: 200 });
      }

      try {
        let subscription: Stripe.Subscription | null = null;

        if (typeof session.subscription === "string") {
          subscription = await stripe.subscriptions.retrieve(
            session.subscription,
          );
        } else {
          subscription = session.subscription as Stripe.Subscription;
        }

        if (!subscription) {
          log("Failed to load subscription from checkout session", {
            sessionId: session.id,
          });
          return new Response("OK", { status: 200 });
        }

        await syncSubscriptionState(
          supabase,
          stripe,
          subscription,
          monthlyPriceId,
          semesterPriceId,
        );
      } catch (subError) {
        log("Error syncing subscription from checkout.session.completed", {
          error: subError,
          sessionId: session.id,
        });
      }

      return new Response("OK", { status: 200 });
    }

    // Handle one-time payments (AI credits)
    if (session.mode === "payment") {
      log("Processing payment checkout", { sessionId: session.id });

      // Ensure this session was for our AI credits price
      if (!aiCreditsPriceId) {
        log("AI credits price ID not configured, skipping");
        return new Response("OK", { status: 200 });
      }

      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        limit: 1,
      });

      const priceId = lineItems.data[0]?.price?.id;
      if (priceId !== aiCreditsPriceId) {
        log("Ignoring session with different price", { priceId, expected: aiCreditsPriceId });
        return new Response("OK", { status: 200 });
      }

      const userId =
        (session.metadata && session.metadata["user_id"]) ||
        session.client_reference_id;

      if (!userId) {
        log("No user_id in session, cannot credit account", {
          sessionId: session.id,
        });
        return new Response("OK", { status: 200 });
      }

      // 100 private questions per pack
      const CREDITS_PER_PACK = 100;

      const now = new Date();
      const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
        .toISOString()
        .slice(0, 10);

      const quantity = lineItems.data[0]?.quantity ?? 1;
      const creditsToAdd = CREDITS_PER_PACK * quantity;

      log("Crediting AI private question credits", {
        userId,
        monthStart,
        credits: creditsToAdd,
        quantity,
      });

      // Try to upsert a row for this user/month
      const { data: existing, error: fetchError } = await supabase
        .from("user_private_ai_quota")
        .select("id,paid_credits_remaining")
        .eq("user_id", userId)
        .eq("month_start", monthStart)
        .maybeSingle();

      if (fetchError && fetchError.code !== "PGRST116") {
        log("Failed to fetch quota row", { error: fetchError.message });
        return new Response("Error", { status: 500 });
      }

      if (existing) {
        const currentPaid = existing.paid_credits_remaining ?? 0;
        const { error: updateError } = await supabase
          .from("user_private_ai_quota")
          .update({
            paid_credits_remaining: currentPaid + creditsToAdd,
          })
          .eq("id", existing.id);

        if (updateError) {
          log("Failed to update quota row", { error: updateError.message });
          return new Response("Error", { status: 500 });
        }
      } else {
        const { error: insertError } = await supabase
          .from("user_private_ai_quota")
          .insert({
            user_id: userId,
            month_start: monthStart,
            free_used_count: 0,
            paid_credits_remaining: creditsToAdd,
          });

        if (insertError) {
          log("Failed to insert quota row", { error: insertError.message });
          return new Response("Error", { status: 500 });
        }
      }

      log("Successfully credited AI private question credits", { userId });
    }
  }

  return new Response("OK", { status: 200 });
});


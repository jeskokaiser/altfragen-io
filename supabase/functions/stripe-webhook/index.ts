import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { getSecretKey } from '../_shared/supabaseKeys.ts';
import {
  applySubscriptionEvent,
  creditsForQuantity,
  isTransientSubscriptionCreation,
  quotaMonthStart,
  resolveLifetimeEntitlement,
  resolveSubscriptionEntitlement,
} from './entitlements.ts';

const log = (step: string, details?: unknown) => {
  console.log(`[STRIPE-WEBHOOK] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

// Helper to sync subscription state between Stripe and Supabase
async function syncSubscriptionState(
  supabase: ReturnType<typeof createClient>,
  stripe: Stripe,
  subscription: Stripe.Subscription,
  monthlyPriceId?: string | null,
  semesterPriceId?: string | null,
) {
  log('Syncing subscription state', {
    subscriptionId: subscription.id,
    status: subscription.status,
    customer: subscription.customer,
  });

  const incomingEntitlement = resolveSubscriptionEntitlement(
    {
      status: subscription.status,
      priceId: subscription.items.data[0]?.price?.id,
      priceType: subscription.metadata?.price_type,
      currentPeriodEnd: subscription.current_period_end,
    },
    { monthly: monthlyPriceId, semester: semesterPriceId },
  );

  log('Resolved subscription entitlement', {
    subscriptionId: subscription.id,
    status: subscription.status,
    ...incomingEntitlement,
  });

  // Get customer and email
  const customerId = subscription.customer as string | null;
  if (!customerId) {
    log('No customer ID on subscription, cannot sync state', {
      subscriptionId: subscription.id,
    });
    return;
  }

  const customer = await stripe.customers.retrieve(customerId);

  if (customer.deleted || !('email' in customer) || !customer.email) {
    log('Customer not found or has no email in helper', { customerId });
    return;
  }

  const email = customer.email;

  // Try to find existing subscriber by stripe_customer_id first, then by email
  const { data: existingSubscriber, error: subscriberLookupError } = await supabase
    .from('subscribers')
    .select(
      'id, user_id, email, stripe_customer_id, subscribed, subscription_tier, subscription_end',
    )
    .or(`stripe_customer_id.eq.${customerId},email.eq.${email}`)
    .maybeSingle();

  if (subscriberLookupError && subscriberLookupError.code !== 'PGRST116') {
    log('Error looking up existing subscriber', {
      error: subscriberLookupError.message,
      customerId,
      email,
    });
  }

  // A lifetime purchase and a subscription share this row, so a cancellation
  // must not revoke access that was bought outright.
  const {
    subscribed: hasActiveSub,
    tier: subscriptionTier,
    subscriptionEnd,
  } = applySubscriptionEvent(
    {
      tier: existingSubscriber?.subscription_tier,
      subscribed: existingSubscriber?.subscribed,
      subscriptionEnd: existingSubscriber?.subscription_end,
    },
    incomingEntitlement,
  );

  if (subscriptionTier !== incomingEntitlement.tier) {
    log('Keeping the stored entitlement instead of the one this event implies', {
      subscriptionId: subscription.id,
      stored: subscriptionTier,
      implied: incomingEntitlement.tier,
    });
  }

  let userId: string | null = existingSubscriber?.user_id || null;

  // Optional improvement: try to associate user_id via profiles table if missing
  if (!userId) {
    try {
      const { data: profileByEmail, error: profileLookupError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email)
        .maybeSingle();

      if (profileLookupError && profileLookupError.code !== 'PGRST116') {
        log('Error looking up profile by email for user_id association', {
          error: profileLookupError.message,
          email,
        });
      } else if (profileByEmail?.id) {
        userId = profileByEmail.id;
        log('Associated user_id from profiles table', {
          email,
          userId,
        });
      }
    } catch (assocError) {
      log('Unexpected error while associating user_id', { error: assocError });
    }
  }

  if (!userId) {
    log('User ID still not found - will upsert subscriber with email only', {
      email,
      customerId,
    });
  }

  // Upsert subscribers row
  try {
    const { error: upsertError } = await supabase.from('subscribers').upsert(
      {
        email,
        user_id: userId,
        stripe_customer_id: customerId,
        subscribed: hasActiveSub,
        subscription_tier: subscriptionTier,
        subscription_end: subscriptionEnd,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'email' },
    );

    if (upsertError) {
      log('Failed to upsert subscribers row in helper', {
        error: upsertError.message,
        email,
        customerId,
      });
    } else {
      log('Subscribers table upserted in helper', {
        email,
        userId,
        customerId,
        subscribed: hasActiveSub,
        subscriptionTier,
        subscriptionEnd,
      });
    }
  } catch (dbError) {
    log('Unexpected error while upserting subscribers row in helper', {
      error: dbError,
    });
  }

  // Update profiles.is_premium if we have a userId
  if (userId) {
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_premium: hasActiveSub })
        .eq('id', userId);

      if (profileError) {
        log('Profile update failed in helper', { error: profileError.message });
      } else {
        log('Profile updated successfully in helper', {
          userId,
          is_premium: hasActiveSub,
        });
      }
    } catch (profileError) {
      log('Profile update error in helper', { error: profileError });
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'content-type, stripe-signature, apikey, authorization',
      },
    });
  }

  // Supabase Edge Functions require authentication via apikey query parameter
  // NOTE: Set "Verify JWT with legacy secret" OFF in Edge function details in Supabase
  // The webhook URL in Stripe MUST include: ?apikey=[your-anon-key]
  // This is required by Supabase's gateway before the request reaches our function
  const url = new URL(req.url);
  const apikeyParam = url.searchParams.get('apikey');
  const apikeyHeader = req.headers.get('apikey');
  const authHeader = req.headers.get('Authorization');

  // Log what we received for debugging
  log('Webhook endpoint called', {
    method: req.method,
    hasSignature: !!req.headers.get('stripe-signature'),
    hasApikeyParam: !!apikeyParam,
    hasApikeyHeader: !!apikeyHeader,
    hasAuthHeader: !!authHeader,
    url: req.url,
  });

  // Note: If you're still getting 401, the Supabase gateway is blocking the request
  // BEFORE it reaches this code. This means the apikey parameter is not in the webhook URL.
  //
  // SOLUTION: In Stripe Dashboard → Webhooks → Your endpoint
  // The URL MUST be: https://[project].supabase.co/functions/v1/stripe-webhook?apikey=[anon-key]
  //
  // Get your anon key from: Supabase Dashboard → Settings → API → anon public key

  const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = getSecretKey();
  const aiCreditsPriceId = Deno.env.get('STRIPE_PRICE_AI_PRIVATE_CREDITS_ID');
  const monthlyPriceId = Deno.env.get('STRIPE_PRICE_MONTHLY_ID');
  const semesterPriceId = Deno.env.get('STRIPE_PRICE_SEMESTER_ID');
  const lifetimePriceId = Deno.env.get('STRIPE_PRICE_LIFETIME_ID');

  if (!stripeSecret || !webhookSecret || !supabaseUrl || !supabaseServiceKey) {
    log('Missing required environment variables', {
      hasStripeSecret: !!stripeSecret,
      hasWebhookSecret: !!webhookSecret,
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
    });
    return new Response('Missing configuration', { status: 500 });
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: '2023-10-16' });

  const body = await req.text();
  const signature = req.headers.get('stripe-signature') ?? '';

  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log('Webhook signature verification failed', { message });
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }

  log('Received event', { type: event.type });

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Handle subscription events
  if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  ) {
    const subscription = event.data.object as Stripe.Subscription;

    log('Processing subscription event', {
      eventType: event.type,
      subscriptionId: subscription.id,
      status: subscription.status,
      customerId: subscription.customer,
    });

    // Robust handling for initial "incomplete" state:
    // When a subscription is created via Checkout, Stripe first sends
    // customer.subscription.created with status "incomplete" BEFORE
    // payment succeeds. We don't want to mark the user as unsubscribed
    // in this transient state, especially if they already had access.
    //
    // Instead we:
    // - Ignore "created" events with status "incomplete"
    // - Rely on:
    //   - checkout.session.completed (subscription mode), and/or
    //   - later customer.subscription.updated events
    // to reflect the final status (active / trialing / canceled).
    if (isTransientSubscriptionCreation(event.type, subscription.status)) {
      log('Ignoring transient incomplete subscription on creation', {
        subscriptionId: subscription.id,
        status: subscription.status,
      });
      return new Response('OK', { status: 200 });
    }

    await syncSubscriptionState(supabase, stripe, subscription, monthlyPriceId, semesterPriceId);

    return new Response('OK', { status: 200 });
  }

  // Handle one-time payment events (AI credits)
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    // Handle subscription checkouts
    if (session.mode === 'subscription') {
      log('Subscription checkout completed', {
        sessionId: session.id,
        subscription: session.subscription,
        customer: session.customer,
      });

      if (!session.subscription) {
        log('No subscription attached to checkout session, cannot sync');
        return new Response('OK', { status: 200 });
      }

      try {
        let subscription: Stripe.Subscription | null = null;

        if (typeof session.subscription === 'string') {
          subscription = await stripe.subscriptions.retrieve(session.subscription);
        } else {
          subscription = session.subscription as Stripe.Subscription;
        }

        if (!subscription) {
          log('Failed to load subscription from checkout session', {
            sessionId: session.id,
          });
          return new Response('OK', { status: 200 });
        }

        await syncSubscriptionState(
          supabase,
          stripe,
          subscription,
          monthlyPriceId,
          semesterPriceId,
        );
      } catch (subError) {
        log('Error syncing subscription from checkout.session.completed', {
          error: subError,
          sessionId: session.id,
        });
      }

      return new Response('OK', { status: 200 });
    }

    // Handle one-time payments (AI credits or lifetime subscription)
    if (session.mode === 'payment') {
      log('Processing payment checkout', { sessionId: session.id });

      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        limit: 1,
      });

      const priceId = lineItems.data[0]?.price?.id;
      const userId =
        (session.metadata && session.metadata['user_id']) || session.client_reference_id;

      if (!userId) {
        log('No user_id in session, cannot process payment', {
          sessionId: session.id,
        });
        return new Response('OK', { status: 200 });
      }

      // Check if this is a lifetime subscription purchase
      if (lifetimePriceId && priceId === lifetimePriceId) {
        log('Processing lifetime subscription purchase', {
          sessionId: session.id,
          userId,
        });

        const lifetime = resolveLifetimeEntitlement(new Date());

        // Get customer and email
        const customerId = session.customer as string | null;
        let email: string | null = null;

        if (customerId) {
          try {
            const customer = await stripe.customers.retrieve(customerId);
            if (!customer.deleted && 'email' in customer && customer.email) {
              email = customer.email;
            }
          } catch (err) {
            log('Failed to retrieve customer', { error: err, customerId });
          }
        }

        if (!email && session.customer_email) {
          email = session.customer_email;
        }

        if (!email) {
          log('No email found for lifetime subscription', {
            sessionId: session.id,
            userId,
          });
          return new Response('OK', { status: 200 });
        }

        // Try to find existing subscriber by stripe_customer_id first, then by email
        let subscriberLookupError = null;

        if (customerId) {
          const { error } = await supabase
            .from('subscribers')
            .select('id, user_id, email, stripe_customer_id')
            .or(`stripe_customer_id.eq.${customerId},email.eq.${email}`)
            .maybeSingle();
          subscriberLookupError = error;
        } else {
          const { error } = await supabase
            .from('subscribers')
            .select('id, user_id, email, stripe_customer_id')
            .eq('email', email)
            .maybeSingle();
          subscriberLookupError = error;
        }

        if (subscriberLookupError && subscriberLookupError.code !== 'PGRST116') {
          log('Error looking up existing subscriber for lifetime', {
            error: subscriberLookupError.message,
            customerId,
            email,
          });
        }

        // Upsert subscribers row with lifetime subscription
        try {
          const { error: upsertError } = await supabase.from('subscribers').upsert(
            {
              email,
              user_id: userId,
              stripe_customer_id: customerId,
              subscribed: lifetime.subscribed,
              subscription_tier: lifetime.tier,
              subscription_end: lifetime.subscriptionEnd,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'email' },
          );

          if (upsertError) {
            log('Failed to upsert subscribers row for lifetime', {
              error: upsertError.message,
              email,
              customerId,
            });
          } else {
            log('Subscribers table upserted for lifetime', {
              email,
              userId,
              customerId,
              subscriptionTier: lifetime.tier,
              subscriptionEnd: lifetime.subscriptionEnd,
            });
          }
        } catch (dbError) {
          log('Unexpected error while upserting subscribers row for lifetime', {
            error: dbError,
          });
        }

        // Update profiles.is_premium
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ is_premium: true })
            .eq('id', userId);

          if (profileError) {
            log('Profile update failed for lifetime', { error: profileError.message });
          } else {
            log('Profile updated successfully for lifetime', {
              userId,
              is_premium: true,
            });
          }
        } catch (profileError) {
          log('Profile update error for lifetime', { error: profileError });
        }

        log('Successfully processed lifetime subscription purchase', { userId });
        return new Response('OK', { status: 200 });
      }

      // Handle AI credits (existing logic)
      if (!aiCreditsPriceId) {
        log('AI credits price ID not configured, skipping');
        return new Response('OK', { status: 200 });
      }

      if (priceId !== aiCreditsPriceId) {
        log('Ignoring session with different price', { priceId, expected: aiCreditsPriceId });
        return new Response('OK', { status: 200 });
      }

      const now = new Date();
      const monthStart = quotaMonthStart(now);

      const quantity = lineItems.data[0]?.quantity ?? 1;
      const creditsToAdd = creditsForQuantity(quantity);

      log('Crediting AI private question credits', {
        userId,
        monthStart,
        credits: creditsToAdd,
        quantity,
      });

      // New canonical ledger (idempotent via unique(source, ref))
      try {
        const { error: ledgerError } = await supabase.from('ai_private_credits_ledger').insert({
          user_id: userId,
          credits_delta: creditsToAdd,
          source: 'stripe_checkout_session',
          ref: session.id,
          event_ts: now.toISOString(),
        });

        if (ledgerError) {
          // Do not fail the webhook; we still keep legacy counters in sync.
          log('Failed to insert ai_private_credits_ledger', { error: ledgerError.message });
        }
      } catch (e) {
        log('Unexpected error inserting ai_private_credits_ledger', { error: String(e) });
      }

      // Try to upsert a row for this user/month
      const { data: existing, error: fetchError } = await supabase
        .from('user_private_ai_quota')
        .select('id,paid_credits_remaining')
        .eq('user_id', userId)
        .eq('month_start', monthStart)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        log('Failed to fetch quota row', { error: fetchError.message });
        return new Response('Error', { status: 500 });
      }

      if (existing) {
        const currentPaid = existing.paid_credits_remaining ?? 0;
        const { error: updateError } = await supabase
          .from('user_private_ai_quota')
          .update({
            paid_credits_remaining: currentPaid + creditsToAdd,
          })
          .eq('id', existing.id);

        if (updateError) {
          log('Failed to update quota row', { error: updateError.message });
          return new Response('Error', { status: 500 });
        }
      } else {
        const { error: insertError } = await supabase.from('user_private_ai_quota').insert({
          user_id: userId,
          month_start: monthStart,
          free_used_count: 0,
          paid_credits_remaining: creditsToAdd,
        });

        if (insertError) {
          log('Failed to insert quota row', { error: insertError.message });
          return new Response('Error', { status: 500 });
        }
      }

      log('Successfully credited AI private question credits', { userId });
    }
  }

  return new Response('OK', { status: 200 });
});

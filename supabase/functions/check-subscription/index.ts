import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

const shouldSkipStripeCheck = (subscriberData: any): boolean => {
  if (!subscriberData) return false;
  
  const now = new Date();
  
  // If user is subscribed and has a subscription_end date
  if (subscriberData.subscribed && subscriberData.subscription_end) {
    const subscriptionEnd = new Date(subscriberData.subscription_end);
    
    // If subscription ends more than 1 day from now, no need to check Stripe
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    if (subscriptionEnd > oneDayFromNow) {
      return true; // Skip Stripe check
    }
  }
  
  // For unsubscribed users, use shorter cache to detect new subscriptions quickly
  // If they never had a subscription (no subscription_end), check more frequently
  if (!subscriberData.subscribed && subscriberData.updated_at) {
    const lastUpdate = new Date(subscriberData.updated_at);
    
    // If user never had a subscription (subscription_end is null), check every 5 minutes
    // This helps detect new subscriptions quickly after checkout
    if (!subscriberData.subscription_end) {
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      if (lastUpdate > fiveMinutesAgo) {
        return true; // Skip Stripe check (but only for 5 minutes)
      }
    } else {
      // If user had a subscription that expired, we can cache longer (30 minutes)
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
      if (lastUpdate > thirtyMinutesAgo) {
        return true; // Skip Stripe check
      }
    }
  }
  
  return false; // Check Stripe
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");



    // Check environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const semesterPriceId = Deno.env.get("STRIPE_PRICE_SEMESTER_ID");
    const monthlyPriceId = Deno.env.get("STRIPE_PRICE_MONTHLY_ID");

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey || !stripeKey) {
      logStep("Missing environment variables", { 
        hasUrl: !!supabaseUrl, 
        hasServiceKey: !!supabaseServiceKey, 
        hasAnonKey: !!supabaseAnonKey, 
        hasStripeKey: !!stripeKey 
      });
      throw new Error("Missing required environment variables");
    }

    // Price IDs are optional but recommended for proper tier identification
    // If missing, we'll fall back to checking subscription metadata
    if (!semesterPriceId || !monthlyPriceId) {
      logStep("WARNING: Missing price ID environment variables - will use metadata fallback", {
        hasSemesterPriceId: !!semesterPriceId,
        hasMonthlyPriceId: !!monthlyPriceId,
        note: "Subscriptions will still be recognized as active, but tier identification may rely on metadata"
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("No authorization header");
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Use anon key client to verify user token
    const anonClient = createClient(supabaseUrl, supabaseAnonKey);
    logStep("Authenticating user with anon client");
    
    const { data: userData, error: userError } = await anonClient.auth.getUser(token);
    if (userError) {
      logStep("Authentication failed", { error: userError.message });
      throw new Error(`Authentication error: ${userError.message}`);
    }
    const user = userData.user;
    if (!user?.email) {
      logStep("No user or email found");
      throw new Error("User not authenticated or email not available");
    }

    logStep("User authenticated successfully", { userId: user.id, email: user.email });

    // Use service role key for database operations
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, { 
      auth: { persistSession: false } 
    });

    // Check for force refresh parameter (from query string or request body)
    let forceRefresh = false;
    try {
      const url = new URL(req.url);
      forceRefresh = url.searchParams.get('forceRefresh') === 'true';
    } catch (e) {
      // URL parsing failed, try request body
    }
    
    // Also check request body for forceRefresh
    if (!forceRefresh && req.method === 'POST') {
      try {
        const body = await req.json().catch(() => ({}));
        forceRefresh = body.forceRefresh === true;
      } catch (e) {
        // Body parsing failed, ignore
      }
    }
    
    // First, check if we have cached data that's still valid
    const { data: cachedSubscriber } = await supabaseClient
      .from("subscribers")
      .select("*")
      .eq("email", user.email)
      .single();

    if (!forceRefresh && cachedSubscriber && shouldSkipStripeCheck(cachedSubscriber)) {
      logStep("Using cached subscription data", { 
        subscribed: cachedSubscriber.subscribed,
        subscriptionTier: cachedSubscriber.subscription_tier,
        subscriptionEnd: cachedSubscriber.subscription_end,
        lastUpdated: cachedSubscriber.updated_at,
        cacheAge: Math.round((Date.now() - new Date(cachedSubscriber.updated_at).getTime()) / (1000 * 60)) + ' minutes',
        reason: cachedSubscriber.subscribed ? 'active subscription' : 'recent check'
      });
      
      return new Response(JSON.stringify({
        subscribed: cachedSubscriber.subscribed,
        subscription_tier: cachedSubscriber.subscription_tier,
        subscription_end: cachedSubscriber.subscription_end
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    if (forceRefresh) {
      logStep("Force refresh requested - bypassing cache");
    } else if (cachedSubscriber) {
      logStep("Cache expired or invalid - will check Stripe", {
        subscribed: cachedSubscriber.subscribed,
        subscriptionTier: cachedSubscriber.subscription_tier,
        cacheAge: Math.round((Date.now() - new Date(cachedSubscriber.updated_at).getTime()) / (1000 * 60)) + ' minutes'
      });
    } else {
      logStep("No cached data found - will check Stripe");
    }

    logStep("Cache miss or subscription expiring soon, querying Stripe", { 
      hasCachedData: !!cachedSubscriber,
      subscriptionEnd: cachedSubscriber?.subscription_end,
      needsStripeCheck: !cachedSubscriber || !shouldSkipStripeCheck(cachedSubscriber)
    });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    logStep("Checking for Stripe customer");
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, updating unsubscribed state");
      
      try {
        await supabaseClient.from("subscribers").upsert({
          email: user.email,
          user_id: user.id,
          stripe_customer_id: null,
          subscribed: false,
          subscription_tier: null,
          subscription_end: null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'email' });
        logStep("Database updated successfully");
      } catch (dbError) {
        logStep("Database update failed", { error: dbError });
        // Continue anyway, don't fail the whole request
      }

      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    logStep("Checking for active subscriptions");
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    
    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionTier: string | null = null;
    let subscriptionEnd: string | null = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });
      
      // Determine subscription tier from price ID
      const priceId = subscription.items.data[0].price.id;
      logStep("Checking price ID", { 
        priceId, 
        semesterPriceId, 
        monthlyPriceId,
        hasSemesterPriceId: !!semesterPriceId,
        hasMonthlyPriceId: !!monthlyPriceId
      });
      
      // Check semester first (more specific)
      if (semesterPriceId && priceId === semesterPriceId) {
        subscriptionTier = "Semester";
        logStep("Identified as Semester subscription", { priceId });
      } else if (monthlyPriceId && priceId === monthlyPriceId) {
        subscriptionTier = "Monthly";
        logStep("Identified as Monthly subscription", { priceId });
      } else {
        // Fallback: try to determine from subscription metadata or price details
        const metadata = subscription.metadata;
        if (metadata?.price_type === 'semester' || metadata?.price_type === 'Semester') {
          subscriptionTier = "Semester";
          logStep("Identified as Semester from metadata", { priceId, metadata });
        } else if (metadata?.price_type === 'monthly' || metadata?.price_type === 'Monthly') {
          subscriptionTier = "Monthly";
          logStep("Identified as Monthly from metadata", { priceId, metadata });
        } else {
          // Last resort: mark as Unknown but subscription is still active
          subscriptionTier = "Unknown";
          logStep("Unknown price ID encountered - subscription still active", { 
            priceId, 
            availablePriceIds: { semesterPriceId, monthlyPriceId },
            metadata 
          });
        }
      }
      logStep("Determined subscription tier", { priceId, subscriptionTier, hasActiveSub });
    } else {
      logStep("No active subscription found");
    }

    // Update subscribers table only if data actually changed
    let shouldUpdateDb = true;
    if (cachedSubscriber) {
      shouldUpdateDb = (
        cachedSubscriber.subscribed !== hasActiveSub ||
        cachedSubscriber.subscription_tier !== subscriptionTier ||
        cachedSubscriber.subscription_end !== subscriptionEnd ||
        cachedSubscriber.stripe_customer_id !== customerId
      );
    }

    if (shouldUpdateDb) {
      try {
        await supabaseClient.from("subscribers").upsert({
          email: user.email,
          user_id: user.id,
          stripe_customer_id: customerId,
          subscribed: hasActiveSub,
          subscription_tier: subscriptionTier,
          subscription_end: subscriptionEnd,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'email' });
        logStep("Database updated successfully", { subscribed: hasActiveSub, subscriptionTier });
      } catch (dbError) {
        logStep("Database update failed", { error: dbError });
        // Continue anyway, don't fail the whole request
      }

      // Try to update profiles table if it exists
      try {
        const { error: profileError } = await supabaseClient
          .from("profiles")
          .update({ is_premium: hasActiveSub })
          .eq("id", user.id);
        
        if (profileError) {
          logStep("Profile update failed (table may not exist)", { error: profileError.message });
        } else {
          logStep("Profile updated successfully");
        }
      } catch (profileError) {
        logStep("Profile update failed", { error: profileError });
      }
    } else {
      logStep("Data unchanged, skipping database update");
    }
    
    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { 
      message: errorMessage, 
      stack: error instanceof Error ? error.stack : undefined 
    });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: "Check edge function logs for more information"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

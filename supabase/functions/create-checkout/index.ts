import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    logStep("Function started");
    
    // Parse request body to get priceType
    const { priceType = 'monthly' } = await req.json().catch(() => ({ priceType: 'monthly' }));
    logStep("Price type requested", { priceType });
    
    // Check environment variables first
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const monthlyPriceId = Deno.env.get("STRIPE_PRICE_MONTHLY_ID");
    const weeklyPriceId = Deno.env.get("STRIPE_PRICE_WEEKLY_ID");
    
    if (!supabaseUrl || !supabaseAnonKey || !stripeKey || !monthlyPriceId) {
      logStep("Missing environment variables", {
        hasUrl: !!supabaseUrl,
        hasAnonKey: !!supabaseAnonKey,
        hasStripeKey: !!stripeKey,
        hasMonthlyPriceId: !!monthlyPriceId,
        hasWeeklyPriceId: !!weeklyPriceId
      });
      throw new Error("Missing required environment variables");
    }
    
    // Select the appropriate price ID
    let selectedPriceId;
    if (priceType === 'weekly' && weeklyPriceId) {
      selectedPriceId = weeklyPriceId;
    } else {
      selectedPriceId = monthlyPriceId;
    }
    
    logStep("Selected price ID", { priceType, selectedPriceId });
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("No authorization header");
      throw new Error("No authorization header provided");
    }
    const token = authHeader.replace("Bearer ", "");
    logStep("Attempting to authenticate user");
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError) {
      logStep("Authentication failed", {
        error: authError.message
      });
      throw new Error(`Authentication error: ${authError.message}`);
    }
    const user = data.user;
    if (!user?.email) {
      logStep("No user or email found");
      throw new Error("User not authenticated or email not available");
    }
    logStep("User authenticated successfully", {
      userId: user.id,
      email: user.email
    });
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16"
    });
    // Check if customer already exists
    logStep("Checking for existing customer");
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1
    });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", {
        customerId
      });
    } else {
      logStep("No existing customer found, will create new one in checkout");
    }
    const origin = req.headers.get("origin") || req.headers.get("referer") || "https://ynzxzhpivcmkpipanltd.supabase.co";
    logStep("Creating checkout session", {
      origin
    });
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: selectedPriceId,
          quantity: 1
        }
      ],
      mode: "subscription",
      success_url: `${origin}/subscription?checkout=success`,
      cancel_url: `${origin}/subscription?checkout=cancelled`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      subscription_data: {
        metadata: {
        }
      }
    });
    logStep("Checkout session created successfully", {
      sessionId: session.id,
      url: session.url
    });
    return new Response(JSON.stringify({
      url: session.url,
      sessionId: session.id
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 200
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    return new Response(JSON.stringify({
      error: errorMessage,
      details: "Check edge function logs for more information"
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 500
    });
  }
});

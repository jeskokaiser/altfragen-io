import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { getPublishableKey, getSecretKey } from '../_shared/supabaseKeys.ts';
import {
  storageRemovalBatches,
  stripeCustomersOf,
  subscriptionsToCancel,
  type StorageObjectRef,
} from './plan.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
    if (!token) return json({ error: 'Not authenticated' }, 401);

    // The publishable key passes verify_jwt, so the user has to be checked here.
    const authClient = createClient(supabaseUrl, getPublishableKey() ?? '', {
      auth: { persistSession: false },
    });
    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser(token);
    if (userError || !user) return json({ error: 'Not authenticated' }, 401);

    const body = await req.json().catch(() => null);
    if (body?.confirm !== 'DELETE') return json({ error: 'Confirmation missing' }, 400);

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY is not set');
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    const admin = createClient(supabaseUrl, getSecretKey() ?? '', {
      auth: { persistSession: false },
    });

    const { data: subscriberRows, error: subscriberError } = await admin
      .from('subscribers')
      .select('stripe_customer_id')
      .eq('user_id', user.id);
    if (subscriberError) throw subscriberError;

    // Only a confirmed address may reach a customer by email: anyone can sign
    // up with someone else's address without confirming it.
    const foundByEmail =
      user.email && user.email_confirmed_at
        ? (await stripe.customers.list({ email: user.email, limit: 100 })).data.map(({ id }) => id)
        : [];

    // Stripe first, and abort if it fails: a deleted account that keeps being
    // charged is the worse failure. The customer stays in Stripe with its invoices.
    const customers = stripeCustomersOf(
      (subscriberRows ?? []).map((row) => row.stripe_customer_id),
      foundByEmail,
    );
    for (const customer of customers) {
      try {
        const { data: subscriptions } = await stripe.subscriptions.list({
          customer,
          status: 'all',
          limit: 100,
        });
        for (const { id } of subscriptionsToCancel(subscriptions)) {
          await stripe.subscriptions.cancel(id);
        }
      } catch (error) {
        // A customer removed in Stripe has nothing left to cancel.
        if ((error as { code?: string }).code !== 'resource_missing') throw error;
      }
    }

    const { data: objects, error: deleteError } = await admin.rpc('delete_user_account', {
      p_user_id: user.id,
    });
    if (deleteError) throw deleteError;

    // The account is gone at this point, so a leftover file is logged, not fatal.
    for (const { bucket, paths } of storageRemovalBatches((objects ?? []) as StorageObjectRef[])) {
      const { error: removeError } = await admin.storage.from(bucket).remove(paths);
      if (removeError) {
        console.error(`[DELETE-ACCOUNT] ${paths.length} files left in ${bucket}`, removeError);
      }
    }

    return json({ success: true }, 200);
  } catch (error) {
    console.error('[DELETE-ACCOUNT] failed', error instanceof Error ? error.message : error);
    return json({ error: 'Account deletion failed' }, 500);
  }
});

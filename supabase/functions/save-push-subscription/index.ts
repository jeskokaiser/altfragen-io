// IMPPulse Save Push Subscription Edge Function
// Saves new push notification subscriptions to the database
// No authentication required - public endpoint

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface SaveSubscriptionPayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  type?: string;
  userAgent?: string;
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const payload: SaveSubscriptionPayload = await req.json();

    // Validate required fields
    if (!payload.endpoint || !payload.keys?.p256dh || !payload.keys?.auth) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: endpoint, keys.p256dh, keys.auth' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role key
    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Upsert subscription (update if exists, insert if new)
    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          endpoint: payload.endpoint,
          p256dh: payload.keys.p256dh,
          auth: payload.keys.auth,
          type: payload.type || 'broadcast',
          user_agent: payload.userAgent || null,
          updated_at: new Date().toISOString(),
        },
        { 
          onConflict: 'endpoint',
          ignoreDuplicates: false 
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to save subscription', 
          details: error.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Subscription saved successfully',
        subscription: {
          id: data.id,
          type: data.type,
          created_at: data.created_at,
        },
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Save subscription error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

// Check IMPP Result Notification Edge Function
// Checks if IMPP results are available and triggers push notification if they are
// Designed to be called via cron job

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET')!;

interface CheckResultPayload {
  notificationId?: string;
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
    // Allow both GET and POST for cron flexibility
    let notificationId: string | undefined;

    if (req.method === 'GET') {
      const url = new URL(req.url);
      notificationId = url.searchParams.get('notificationId') || undefined;
    } else if (req.method === 'POST') {
      const payload: CheckResultPayload = await req.json();
      notificationId = payload.notificationId;
    } else {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Default notification ID if not provided
    const targetNotificationId = notificationId || '3CA19F95-2074-4E4A-A064-AB50024B0C2F';
    const imppUrl = `https://era.impp.digital/result-notification/${targetNotificationId}`;

    console.log(`Checking IMPP result availability: ${imppUrl}`);

    // Fetch the IMPP result page
    const response = await fetch(imppUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Altfragen-io/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch IMPP page: ${response.status} ${response.statusText}`);
    }

    const htmlContent = await response.text();

    // Check if "Nichtverfügbarkeit" is in the content
    const hasNichtverfuegbarkeit = htmlContent.includes('Nichtverfügbarkeit');

    console.log(`Nichtverfügbarkeit found: ${hasNichtverfuegbarkeit}`);

    // If "Nichtverfügbarkeit" is present, results are NOT available
    if (hasNichtverfuegbarkeit) {
      return new Response(
        JSON.stringify({
          success: true,
          results_available: false,
          message: 'Results are not yet available',
          checked_url: imppUrl,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Results ARE available - trigger push notification
    console.log('Results are available! Triggering push notification...');

    // Call the broadcast-notification function
    const broadcastUrl = `${SUPABASE_URL}/functions/v1/broadcast-notification`;
    
    const broadcastPayload = {
      secret: WEBHOOK_SECRET,
      title: 'M2 Ergebnisse verfügbar!',
      body: 'Die H25 M2-Ergebnisse sind jetzt online beim IMPP verfügbar.',
      url: 'https://impp.de',
      tag: 'impp-result-available'
    };

    const broadcastResponse = await fetch(broadcastUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify(broadcastPayload),
    });

    if (!broadcastResponse.ok) {
      const errorText = await broadcastResponse.text();
      throw new Error(`Failed to trigger broadcast: ${broadcastResponse.status} - ${errorText}`);
    }

    const broadcastResult = await broadcastResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        results_available: true,
        message: 'Results are available and push notification has been sent',
        broadcast_stats: broadcastResult.stats,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('IMPP check error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


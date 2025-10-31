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

    // Fetch the IMPP result page with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    let response: Response;
    try {
      response = await fetch(imppUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Altfragen-io/1.0; +https://altfragen.io)',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'de-DE,de;q=0.9',
        },
        signal: controller.signal,
      });
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request timed out after 10 seconds');
        return new Response(
          JSON.stringify({
            success: true,
            results_available: null,
            message: 'Unable to verify results - request timed out',
            checked_url: imppUrl,
            error: 'Request timeout',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      // Log the status for monitoring
      console.log(`HTTP ${response.status}: ${response.statusText}`);
      
      // Handle specific HTTP error codes gracefully
      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            success: true,
            results_available: null,
            message: 'Unable to verify results - rate limited',
            checked_url: imppUrl,
            error: 'Rate limit exceeded (HTTP 429)',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 403) {
        return new Response(
          JSON.stringify({
            success: true,
            results_available: null,
            message: 'Unable to verify results - access forbidden',
            checked_url: imppUrl,
            error: 'Access forbidden (HTTP 403)',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Failed to fetch IMPP page: ${response.status} ${response.statusText}`);
    }

    const htmlContent = await response.text();
    console.log(`Response length: ${htmlContent.length} bytes`);

    // ===== FAIL-SAFE CHECKS =====
    
    // 1. Check if we got blocked or rate limited (common error patterns)
    const errorPatterns = [
      'rate limit',
      'too many requests',
      'access denied',
      'forbidden',
      'blocked',
      'captcha',
      '403 Forbidden',
      '429 Too Many',
      'cloudflare',
    ];
    
    const hasErrorPattern = errorPatterns.some(pattern => 
      htmlContent.toLowerCase().includes(pattern.toLowerCase())
    );
    
    if (hasErrorPattern) {
      console.log('Detected potential blocking/rate limiting in response');
      return new Response(
        JSON.stringify({
          success: true,
          results_available: null,
          message: 'Unable to verify results - possible rate limiting or blocking detected',
          checked_url: imppUrl,
          error: 'Site may be blocking requests',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Verify we got a valid HTML page (not just any response)
    if (!htmlContent.includes('<html') && !htmlContent.includes('<!DOCTYPE')) {
      console.log('Response does not appear to be valid HTML');
      return new Response(
        JSON.stringify({
          success: true,
          results_available: null,
          message: 'Unable to verify results - invalid response format',
          checked_url: imppUrl,
          error: 'Response is not valid HTML',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Check response is not too small (likely an error page)
    if (htmlContent.length < 500) {
      console.log('Response suspiciously small - likely an error page');
      return new Response(
        JSON.stringify({
          success: true,
          results_available: null,
          message: 'Unable to verify results - response too small',
          checked_url: imppUrl,
          error: 'Response size suggests error page',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Look for positive indicators that this is the actual IMPP page
    const hasImppIndicators = htmlContent.includes('IMPP') || 
                             htmlContent.includes('Institut für medizinische') ||
                             htmlContent.includes('result-notification');
    
    if (!hasImppIndicators) {
      console.log('Response does not contain expected IMPP page indicators');
      return new Response(
        JSON.stringify({
          success: true,
          results_available: null,
          message: 'Unable to verify results - page content unexpected',
          checked_url: imppUrl,
          error: 'Response does not match expected IMPP page structure',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ===== ACTUAL RESULT CHECK =====
    
    // Check if "Nichtverfügbarkeit" is in the content
    const hasNichtverfuegbarkeit = htmlContent.includes('Nichtverfügbarkeit');
    console.log(`Valid page received. Nichtverfügbarkeit found: ${hasNichtverfuegbarkeit}`);

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


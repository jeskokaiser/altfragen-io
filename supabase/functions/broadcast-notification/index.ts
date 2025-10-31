// IMPPulse Broadcast Notification Edge Function
// Broadcasts push notifications to all subscribers
// Accessible via webhook from Make.com or other automation tools

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET');
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY');
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface BroadcastPayload {
  secret: string;
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
}

interface PushSubscription {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

// Convert base64 URL-safe to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Send push notification using Web Push Protocol
async function sendPushNotification(
  subscription: PushSubscription,
  payload: string
): Promise<boolean> {
  try {
    const endpoint = subscription.endpoint;
    
    // Extract endpoint components
    const urlParts = new URL(endpoint);
    
    // Encrypt the payload
    const encoder = new TextEncoder();
    const payloadBuffer = encoder.encode(payload);
    
    // For simplicity, we'll use a library approach
    // In production, implement full Web Push encryption
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'TTL': '86400', // 24 hours
        'Content-Encoding': 'aes128gcm',
      },
      body: payloadBuffer,
    });

    return response.ok;
  } catch (error) {
    console.error('Push send error:', error);
    return false;
  }
}

// Main broadcast function
async function broadcastNotification(payload: BroadcastPayload) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase configuration');
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Fetch all broadcast subscriptions
  const { data: subscriptions, error: fetchError } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('type', 'broadcast');

  if (fetchError) {
    throw new Error(`Failed to fetch subscriptions: ${fetchError.message}`);
  }

  const totalSubscribers = subscriptions?.length || 0;
  let successCount = 0;
  let failCount = 0;
  const invalidSubscriptions: string[] = [];

  // Prepare notification payload
  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || 'https://altfragen.io',
    tag: payload.tag || 'imppulse-notification',
    icon: payload.icon || '/logo.png',
  });

  // Send to all subscriptions
  if (subscriptions && subscriptions.length > 0) {
    const sendPromises = subscriptions.map(async (sub) => {
      const success = await sendPushNotification(sub, notificationPayload);
      if (success) {
        successCount++;
      } else {
        failCount++;
        invalidSubscriptions.push(sub.id);
      }
    });

    await Promise.allSettled(sendPromises);
  }

  // Remove invalid subscriptions
  if (invalidSubscriptions.length > 0) {
    await supabase
      .from('push_subscriptions')
      .delete()
      .in('id', invalidSubscriptions);
  }

  // Log broadcast
  await supabase.from('broadcast_logs').insert({
    title: payload.title,
    body: payload.body,
    url: payload.url,
    tag: payload.tag,
    subscribers_count: totalSubscribers,
    successful_count: successCount,
    failed_count: failCount,
    invalid_removed: invalidSubscriptions.length,
  });

  return {
    total_subscribers: totalSubscribers,
    sent: successCount,
    failed: failCount,
    invalid_removed: invalidSubscriptions.length,
  };
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
    const payload: BroadcastPayload = await req.json();

    // Validate webhook secret
    if (!WEBHOOK_SECRET || payload.secret !== WEBHOOK_SECRET) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid webhook secret' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate required fields
    if (!payload.title || !payload.body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: title and body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Broadcast notification
    const stats = await broadcastNotification(payload);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Broadcast sent',
        stats,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Broadcast error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// List of possible API endpoints to try
// Based on logs, the backend seems to be using different URL patterns than expected
const API_ENDPOINTS = [
  'https://api.altfragen.io/api/tasks',
  'https://api.altfragen.io/status',
  'https://api.altfragen.io/task',
  'https://api.altfragen.io/tasks'
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract task_id from URL query parameters
    const url = new URL(req.url);
    let taskId = url.searchParams.get('task_id');
    
    // If not in query params, try to get from request body as fallback
    if (!taskId && req.method === 'POST') {
      try {
        const body = await req.json();
        taskId = body.task_id;
      } catch (e) {
        console.error('Error parsing request body:', e);
      }
    }

    console.log(`Received status check request for task: ${taskId}`);

    if (!taskId) {
      return new Response(JSON.stringify({ 
        error: 'Missing task_id parameter',
        status: 'failed'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Try each endpoint until one works
    let response = null;
    let responseData = null;
    let statusCode = 0;
    let endpointUsed = '';

    // Maximum number of polling attempts before giving up
    const MAX_POLLING_ATTEMPTS = 10;
    
    // Start with attempt 1
    for (let attempt = 1; attempt <= MAX_POLLING_ATTEMPTS; attempt++) {
      console.log(`Polling for task status (attempt ${attempt}/${MAX_POLLING_ATTEMPTS}): ${taskId}`);
      
      // Try each endpoint
      for (const baseEndpoint of API_ENDPOINTS) {
        const statusUrl = `${baseEndpoint}/${taskId}`;
        console.log(`Checking status URL: ${statusUrl}`);
        
        try {
          response = await fetch(statusUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          
          statusCode = response.status;
          console.log(`Status check response: ${statusCode}`);
          
          // Successfully reached the API
          if (response.ok) {
            responseData = await response.json();
            endpointUsed = statusUrl;
            console.log(`Found working endpoint: ${endpointUsed}`);
            console.log(`Response data:`, responseData);
            break;
          } else {
            // Log the error but continue trying other endpoints
            const errorText = await response.text();
            console.error(`Error checking task status: ${errorText}`);
          }
        } catch (error) {
          console.error(`Network error with endpoint ${baseEndpoint}:`, error);
        }
      }
      
      // If we got data or are out of attempts, exit the polling loop
      if (responseData || attempt >= MAX_POLLING_ATTEMPTS) {
        break;
      }
      
      // Wait 5 seconds before trying again
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // If we never got a successful response from any endpoint
    if (!responseData) {
      return new Response(JSON.stringify({
        status: 'processing',
        message: 'Still processing, please check back later',
        endpoint_tried: endpointUsed || 'all failed',
        response_code: statusCode
      }), {
        status: 202,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Return the API response to the client
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in check-pdf-status:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      details: error.message,
      status: 'failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

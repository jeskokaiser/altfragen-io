
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Define expected types for more safety
interface BackendStatusResponse {
  success: boolean;
  status: 'processing' | 'completed' | 'error' | 'failed' | 'warning';
  message?: string;
  questions?: any[]; 
  data?: any;
  error?: string;
  details?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    // For GET requests, the task_id should be in the URL query parameters
    if (req.method !== 'GET') {
      return new Response(JSON.stringify({
        error: 'Method not allowed'
      }), {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Extract task_id from the URL query parameters
    const url = new URL(req.url);
    const taskId = url.searchParams.get('task_id');
    if (!taskId) {
      return new Response(JSON.stringify({
        error: 'Missing task_id parameter'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Correct backend status endpoint
    const BASE_API_URL = 'https://api.altfragen.io';
    const statusEndpoint = `${BASE_API_URL}/status/${taskId}`;
    
    let statusData: BackendStatusResponse | null = null;
    let statusResponse: Response | null = null;

    // Log the URL before fetching
    console.log(`Attempting to fetch status from: ${statusEndpoint}`);

    try {
      statusResponse = await fetch(statusEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      console.log(`Status check response from ${statusEndpoint}:`, statusResponse.status);

      if (statusResponse.ok) {
        statusData = await statusResponse.json() as BackendStatusResponse;
      } else {
         // Handle non-OK responses (e.g., 404 Not Found)
         const errorText = await statusResponse.text();
         console.error(`Error checking ${statusEndpoint}: ${statusResponse.status} - ${errorText}`);
         return new Response(JSON.stringify({
            success: false,
            status: 'error',
            error: `Failed to check task status: ${statusResponse.status}`,
            details: errorText
         }), {
            status: statusResponse.status, // Return the actual status code from backend
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
         });
      }
    } catch (error) {
      console.error(`Network or fetch error checking ${statusEndpoint}:`, error.message);
      console.error('Fetch error details:', error);

      // Handle fetch errors (e.g., network issues)
       return new Response(JSON.stringify({
         success: false,
         status: 'error',
         error: 'Failed to check task status',
         details: `Network error: ${error.message}`
       }), {
         status: 500, 
         headers: {
           ...corsHeaders,
           'Content-Type': 'application/json'
         }
       });
    }

    // If statusData is still null after fetch (shouldn't happen with error handling above, but as a safeguard)
    if (!statusData) {
       return new Response(JSON.stringify({
         success: false,
         status: 'error',
         error: 'Failed to retrieve task status data after fetch attempt.',
         details: 'Unknown error during status retrieval'
       }), {
         status: 500,
         headers: {
           ...corsHeaders,
           'Content-Type': 'application/json'
         }
       });
    }

    console.log(`Task status data:`, JSON.stringify(statusData).substring(0, 500) + '...');

    // Process the backend response and forward it appropriately
    if (statusData.status === 'completed') {
      console.log('Task processing completed successfully');
      // Backend already provides the correct format, so forward it directly
      return new Response(JSON.stringify({
        success: statusData.success ?? false, // Forward backend 'success', default false
        status: 'completed', // Always 'completed' here
        message: statusData.message || (statusData.success ? 'PDF processing completed and questions saved' : 'Processing completed with issues or questions could not be saved.'),
        data: statusData.data || {},
        error: statusData.error // Forward any error message from backend
      }), {
        status: 200, // OK, as the task is completed (even if success=false)
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    } else if (statusData.status === 'failed' || statusData.status === 'error') {
      // Backend reported an error -> Status 'failed'
      return new Response(JSON.stringify({
        success: false,
        status: 'failed', // Standardize to 'failed'
        error: statusData.message || statusData.error || 'PDF processing failed',
        details: statusData.details || 'Unknown error from backend'
      }), {
        status: 400, // Client or server-side error from backend
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    } else if (statusData.status === 'warning') {
       // Handle 'warning' explicitly as 'completed' with success: false
       console.log('Task processing completed with warnings');
       return new Response(JSON.stringify({
         success: false, // Treat warning as not completely successful
         status: 'completed', // Task is completed
         message: statusData.message || 'Processing completed with warnings (e.g., no questions found).',
         data: statusData.data || {},
         error: 'Processing completed with warnings.' // Set an error message
       }), {
         status: 200, // OK, task is completed
         headers: {
           ...corsHeaders,
           'Content-Type': 'application/json'
         }
       });
    } else {
      // Still processing ('processing')
      return new Response(JSON.stringify({
        success: true, // Request was successful, task is still running
        status: 'processing',
        message: statusData.message || 'PDF is still being processed'
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (error) {
    console.error('Unhandled error in status function:', error);
    return new Response(JSON.stringify({
      success: false,
      status: 'error',
      error: 'Internal server error in Edge Function',
      details: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});

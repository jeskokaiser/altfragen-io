import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Definiere erwartete Typen für mehr Sicherheit
interface BackendStatusResponse {
  success: boolean;
  status: 'processing' | 'completed' | 'error' | 'failed' | 'warning';
  message?: string;
  questions?: any[]; // Hier ggf. einen genaueren Question-Typ definieren
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

    // Korrekter Backend-Status-Endpunkt
    const BASE_API_URL = 'https://api.altfragen.io';
    const statusEndpoint = `${BASE_API_URL}/status/${taskId}`;
    
    let statusData: BackendStatusResponse | null = null;
    let statusResponse: Response | null = null;

    // --- Verbessertes Logging: URL vor dem Fetch ausgeben ---
    console.log(`Attempting to fetch status from: ${statusEndpoint}`);

    console.log(`Checking status endpoint: ${statusEndpoint}`);
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
      // --- Verbessertes Logging: Gesamtes Fehlerobjekt ausgeben ---
      console.error('Fetch error details:', error);

      // Handle fetch errors (e.g., network issues)
       return new Response(JSON.stringify({
         success: false,
         status: 'error',
         error: 'Failed to check task status',
         details: `Network error: ${error.message}`
       }), {
         status: 500, // Internal Server Error or Service Unavailable
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

    // Verarbeite die Backend-Antwort und reiche sie ggf. angepasst weiter
    if (statusData.status === 'completed') {
      console.log('Task processing completed successfully');
      // Backend liefert bereits das korrekte Format, daher direkt durchreichen
      // Leite den 'success'-Status des Backends und die Daten/Fehler weiter
      return new Response(JSON.stringify({
        success: statusData.success ?? false, // Leite Backend 'success' weiter, default false
        status: 'completed', // Immer 'completed' hier
        message: statusData.message || (statusData.success ? 'PDF processing completed and questions saved' : 'Processing completed with issues or questions could not be saved.'),
        data: statusData.data || {},
        error: statusData.error // Leite mögliche Fehlermeldung vom Backend weiter
      }), {
        status: 200, // OK, da der Task abgeschlossen ist (auch wenn success=false)
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    } else if (statusData.status === 'failed' || statusData.status === 'error') {
      // Backend hat einen Fehler gemeldet -> Status 'failed'
      return new Response(JSON.stringify({
        success: false,
        status: 'failed', // Standardisiere auf 'failed'
        error: statusData.message || statusData.error || 'PDF processing failed',
        details: statusData.details || 'Unknown error from backend'
      }), {
        status: 400, // Client- oder serverseitiger Fehler vom Backend
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    } else if (statusData.status === 'warning') {
       // Behandle 'warning' explizit als 'completed' mit success: false
       console.log('Task processing completed with warnings');
       return new Response(JSON.stringify({
         success: false, // Behandle Warnung als nicht vollständig erfolgreich
         status: 'completed', // Task ist abgeschlossen
         message: statusData.message || 'Processing completed with warnings (e.g., no questions found).',
         data: statusData.data || {},
         error: 'Processing completed with warnings.' // Setze eine Fehlermeldung
       }), {
         status: 200, // OK, Task ist abgeschlossen
         headers: {
           ...corsHeaders,
           'Content-Type': 'application/json'
         }
       });
    } else {
      // Noch in Bearbeitung ('processing')
      return new Response(JSON.stringify({
        success: true, // Anfrage war erfolgreich, Task läuft noch
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

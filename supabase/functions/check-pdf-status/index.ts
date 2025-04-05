
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // For GET requests, the task_id should be in the URL path
    if (req.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extract task_id from the URL
    const url = new URL(req.url);
    const taskId = url.searchParams.get('task_id');
    
    if (!taskId) {
      return new Response(JSON.stringify({ error: 'Missing task_id parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Try different endpoint formats
    const BASE_API_URL = 'https://api.altfragen.io';
    const endpoints = [
      `${BASE_API_URL}/status/${taskId}`, // Original format
      `${BASE_API_URL}/api/tasks/${taskId}`, // Alternative format 1
      `${BASE_API_URL}/task/${taskId}` // Alternative format 2
    ];
    
    let statusData = null;
    let statusResponse = null;
    
    // Try each endpoint until one works
    for (const endpoint of endpoints) {
      console.log(`Trying status endpoint: ${endpoint}`);
      
      try {
        statusResponse = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        console.log(`Status check response from ${endpoint}:`, statusResponse.status);
        
        if (statusResponse.ok) {
          console.log(`Found working endpoint: ${endpoint}`);
          statusData = await statusResponse.json();
          break;
        }
      } catch (error) {
        console.error(`Error checking ${endpoint}:`, error.message);
      }
    }
    
    if (!statusData) {
      return new Response(JSON.stringify({ 
        success: false, 
        status: 'error',
        error: 'Failed to check task status', 
        details: 'All status endpoints returned errors'
      }), {
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log(`Task status:`, JSON.stringify(statusData).substring(0, 500) + '...');
    
    // Check if the task is complete
    if (statusData.status === 'completed') {
      console.log('Task processing completed successfully');
      
      if (statusData.success && statusData.questions) {
        // Map the questions to our expected format
        const questions = statusData.questions.map((q: any) => ({
          id: crypto.randomUUID(),
          question: q.question || '',
          options: {
            A: q.options?.A || '',
            B: q.options?.B || '',
            C: q.options?.C || '',
            D: q.options?.D || '',
            E: q.options?.E || '',
          },
          correctAnswer: q.correctAnswer || '',
          subject: q.subject || '',
          comment: q.comment || '',
          filename: q.filename || '',
          difficulty: q.difficulty || 3,
          semester: q.semester || null,
          year: q.year || null,
          image_key: q.image_key || null
        }));

        return new Response(JSON.stringify({
          success: true,
          status: 'completed',
          questions: questions,
          data: {
            exam_name: statusData.data?.exam_name || '',
            images_uploaded: statusData.data?.images_uploaded || 0,
            total_questions: questions.length,
            total_images: statusData.data?.total_images || 0
          }
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else {
        return new Response(JSON.stringify({ 
          success: false, 
          status: 'completed',
          error: statusData.error || 'No questions found in the processed data', 
          details: statusData.details || ''
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } else if (statusData.status === 'failed') {
      return new Response(JSON.stringify({ 
        success: false, 
        status: 'failed',
        error: 'PDF processing failed', 
        details: statusData.message || statusData.error || 'Unknown error'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      // If still processing
      return new Response(JSON.stringify({ 
        success: true, 
        status: 'processing',
        message: 'PDF is still being processed',
        details: statusData.message || ''
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Error checking task status:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

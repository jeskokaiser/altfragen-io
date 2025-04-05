
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
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse the request body to get the PDF data
    const formData = await req.formData();
    const pdfFile = formData.get('pdf');

    if (!pdfFile || !(pdfFile instanceof File)) {
      return new Response(JSON.stringify({ error: 'No PDF file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Set the API endpoints
    const BASE_API_URL = 'https://api.altfragen.io';
    const UPLOAD_ENDPOINT = `${BASE_API_URL}/upload`;
    // The API expects the task_id at the end of the URL, not as a separate parameter
    const STATUS_ENDPOINT = `${BASE_API_URL}/status`;
    
    // Convert the File to a Blob
    const arrayBuffer = await pdfFile.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    
    // Create a new FormData object for the API request
    const apiFormData = new FormData();
    apiFormData.append('file', blob, pdfFile.name);

    // Get metadata from the request and add it to the API request
    const examName = formData.get('examName')?.toString();
    const examYear = formData.get('examYear')?.toString();
    const examSemester = formData.get('examSemester')?.toString();
    const subject = formData.get('subject')?.toString();

    if (examName) {
      apiFormData.append('examName', examName);
    }
    
    if (examYear) {
      apiFormData.append('examYear', examYear);
    }
    
    if (examSemester) {
      apiFormData.append('examSemester', examSemester);
    }
    
    if (subject) {
      apiFormData.append('subject', subject);
    }

    console.log('Sending request to API with metadata:', { examName, examYear, examSemester, subject });
    console.log('Using API endpoint:', UPLOAD_ENDPOINT);
    console.log('PDF file name:', pdfFile.name, 'size:', pdfFile.size);

    // Forward the request to the external API
    const apiResponse = await fetch(UPLOAD_ENDPOINT, {
      method: 'POST',
      body: apiFormData,
    });

    // Log the response status and headers for debugging
    console.log('API response status:', apiResponse.status);
    console.log('API response headers:', Object.fromEntries(apiResponse.headers.entries()));

    if (apiResponse.status !== 202 && !apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('External API error:', errorText);
      return new Response(JSON.stringify({ 
        error: 'Failed to process PDF', 
        details: errorText,
        status: apiResponse.status
      }), {
        status: apiResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get the task_id from the response
    const initialData = await apiResponse.json();
    console.log('Initial API response:', JSON.stringify(initialData));
    
    if (!initialData.task_id) {
      return new Response(JSON.stringify({ 
        error: 'Invalid response from API', 
        details: 'No task_id received'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const taskId = initialData.task_id;
    
    // Poll for the status of the task
    const maxAttempts = 10;
    const pollInterval = 3000; // 3 seconds between polls
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      attempts++;
      
      console.log(`Polling for task status (attempt ${attempts}/${maxAttempts}): ${taskId}`);
      
      // Wait before polling (except for first attempt)
      if (attempts > 1) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
      
      // Check task status - Ensure we append the task ID to the URL path
      const statusUrl = `${STATUS_ENDPOINT}/${taskId}`;
      console.log(`Checking status URL: ${statusUrl}`);
      
      const statusResponse = await fetch(statusUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log(`Status check response:`, statusResponse.status);
      
      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error(`Error checking task status:`, errorText);
        
        // Check if we've reached max attempts
        if (attempts >= maxAttempts) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Failed to check task status', 
            details: `Maximum polling attempts (${maxAttempts}) reached. The server responded with: ${errorText}`
          }), {
            status: 408, // Request Timeout
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        continue; // Continue trying
      }
      
      const statusData = await statusResponse.json();
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
            subject: q.subject || subject || '',
            comment: q.comment || '',
            filename: examName || pdfFile.name,
            difficulty: q.difficulty || 3,
            semester: q.semester || examSemester || null,
            year: q.year || examYear || null,
            image_key: q.image_key || null
          }));

          return new Response(JSON.stringify({
            success: true,
            questions: questions,
            data: {
              exam_name: examName || pdfFile.name,
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
          error: 'PDF processing failed', 
          details: statusData.message || statusData.error || 'Unknown error'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // If still processing, continue the loop
      console.log(`Task still processing (attempt ${attempts}/${maxAttempts}), waiting ${pollInterval/1000} seconds...`);
    }
    
    // If we've reached max attempts and still no complete response
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Timeout waiting for PDF processing to complete', 
      details: 'The server is taking too long to process the PDF. Please try again later or with a smaller file.'
    }), {
      status: 408, // Request Timeout
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing PDF:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

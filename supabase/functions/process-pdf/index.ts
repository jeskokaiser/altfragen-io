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

    // Set the API endpoints - updated based on actual backend behavior
    const BASE_API_URL = 'https://api.altfragen.io';
    const UPLOAD_ENDPOINT = `${BASE_API_URL}/upload`;
    // The API appears to use /api/tasks for status checks based on logs
    const STATUS_ENDPOINT = `${BASE_API_URL}/api/tasks`;
    
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
    const userId = formData.get('userId')?.toString();
    const visibility = formData.get('visibility')?.toString();

    console.log('Extracted form data:', {
      userId,
      visibility,
      examName,
      examYear,
      examSemester,
      subject
    });

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

    if (userId) {
      apiFormData.append('userId', userId);
      apiFormData.append('user_id', userId);
    }

    if (visibility) {
      apiFormData.append('visibility', visibility);
      apiFormData.append('visibility', visibility.toLowerCase());
    }

    console.log('Sending request to API with metadata:', { examName, examYear, examSemester, subject, userId, visibility });
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
    
    // Log the sent form data for comparison
    console.log('Form data sent to API:', {
      userId: formData.get('userId'),
      user_id: userId, // this should be the same
      visibility: formData.get('visibility'),
      visibility_lowercase: visibility?.toLowerCase()
    });
    
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
    
    // Return success immediately and let the client track status with a separate endpoint
    return new Response(JSON.stringify({
      success: true,
      status: 'processing',
      message: 'PDF upload successful and processing started',
      task_id: taskId
    }), {
      status: 202,
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

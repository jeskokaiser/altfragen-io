
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

    // Forward the request to the external API
    const apiResponse = await fetch(UPLOAD_ENDPOINT, {
      method: 'POST',
      body: apiFormData,
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('External API error:', errorText);
      return new Response(JSON.stringify({ 
        error: 'Failed to process PDF', 
        details: errorText 
      }), {
        status: apiResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get the response from the external API - this now follows the new format
    const apiData = await apiResponse.json();

    // Transform the API response to match our frontend expectations
    // The new API returns questions directly in a format we need to map to our format
    if (apiData.success) {
      const questions = apiData.questions.map((q: any) => ({
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
          images_uploaded: apiData.data?.images_uploaded || 0,
          total_questions: questions.length,
          total_images: apiData.data?.total_images || 0
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ 
        success: false, 
        error: apiData.error || 'Unknown error', 
        details: apiData.details || ''
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
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

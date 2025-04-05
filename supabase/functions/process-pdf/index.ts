
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

    // Get the API URL from environment variable or use a default
    const API_URL = Deno.env.get('EXTERNAL_PDF_API_URL') || 'https://your-api-url.com/extract';
    
    // Convert the File to a Blob
    const arrayBuffer = await pdfFile.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    
    // Create a new FormData object for the API request
    const apiFormData = new FormData();
    apiFormData.append('file', blob, pdfFile.name);

    // Additional metadata can be added here if needed
    const subject = formData.get('subject');
    if (subject) {
      apiFormData.append('subject', subject.toString());
    }

    // Forward the request to the external API
    const apiResponse = await fetch(API_URL, {
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
        optionA: q.options?.A || '',
        optionB: q.options?.B || '',
        optionC: q.options?.C || '',
        optionD: q.options?.D || '',
        optionE: q.options?.E || '',
        subject: q.subject || '',
        correctAnswer: q.correctAnswer || '',
        comment: q.comment || '',
        filename: pdfFile.name,
        difficulty: q.difficulty || 3,
        semester: q.semester || null,
        year: q.year || null,
        image_key: q.image_key || null
      }));

      return new Response(JSON.stringify({
        success: true,
        questions: questions,
        data: {
          exam_name: pdfFile.name,
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

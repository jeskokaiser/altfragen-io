import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import * as pdfParse from 'npm:pdf-parse'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  console.log('Function invoked: process-pdf');

  try {
    // Parse request body with error handling
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body parsed successfully');
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid request body: ' + parseError.message }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { pdfUrl, filename, userId, universityId } = requestBody;
    console.log('Request params:', { pdfUrl, filename, userId, universityId });

    // Validate required parameters
    if (!pdfUrl || !filename || !userId) {
      const missingParams = [];
      if (!pdfUrl) missingParams.push('pdfUrl');
      if (!filename) missingParams.push('filename');
      if (!userId) missingParams.push('userId');
      
      console.error('Missing required parameters:', missingParams);
      return new Response(
        JSON.stringify({ error: `Missing required parameters: ${missingParams.join(', ')}` }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Use service role key for admin access to bypass RLS policies
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        }
      }
    );

    console.log('Downloading PDF from storage...');
    // Download PDF from temp storage
    const { data: pdfData, error: downloadError } = await supabase
      .storage
      .from('temp_pdfs')
      .download(pdfUrl);

    if (downloadError) {
      console.error('Download error:', downloadError);
      return new Response(
        JSON.stringify({ error: `Error downloading PDF: ${downloadError.message}` }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log('PDF downloaded successfully, size:', pdfData.size, 'bytes');
    console.log('PDF type:', pdfData.type);

    if (!pdfData || pdfData.size === 0) {
      console.error('PDF data is empty');
      return new Response(
        JSON.stringify({ error: 'PDF data is empty or invalid' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Basic PDF validation by checking file signature/magic bytes
    const firstBytes = await pdfData.slice(0, 5).arrayBuffer();
    const signature = new Uint8Array(firstBytes);
    const isPDF = String.fromCharCode(...signature) === '%PDF-';
    
    if (!isPDF) {
      console.error('File does not have PDF signature');
      return new Response(
        JSON.stringify({ error: 'File does not appear to be a valid PDF' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse PDF with enhanced error handling
    console.log('Starting PDF parsing...');
    const dataBuffer = await pdfData.arrayBuffer();
    let pdfContent;
    
    try {
      // Additional options for pdf-parse to help with problematic PDFs
      const options = {
        max: 0, // No page limit
        version: 'default'
      };
      
      pdfContent = await pdfParse(dataBuffer, options);
      
      if (!pdfContent) {
        throw new Error('PDF parsing returned null or undefined result');
      }
      
      if (!pdfContent.text || pdfContent.text.length === 0) {
        throw new Error('PDF parsing produced empty text content');
      }
      
      console.log('PDF parsed successfully, text length:', pdfContent.text.length);
      console.log('PDF num pages:', pdfContent.numpages);
      console.log('PDF info:', pdfContent.info);
      
      // Log first 100 chars of content for debugging
      console.log('PDF content preview:', pdfContent.text.substring(0, 100) + '...');
    } catch (parseError) {
      console.error('PDF parsing error details:', parseError);
      // Attempt to get more specific error information
      let errorMessage = 'Unknown PDF parsing error';
      
      if (parseError instanceof Error) {
        errorMessage = parseError.message;
        console.error('Error stack:', parseError.stack);
        
        // Check for common pdf-parse errors
        if (errorMessage.includes('Invalid XRef stream header')) {
          errorMessage = 'PDF has invalid cross-reference stream. The file may be corrupted.';
        } else if (errorMessage.includes('Invalid object stream')) {
          errorMessage = 'PDF contains invalid object stream. The file may be corrupted.';
        } else if (errorMessage.includes('Password required')) {
          errorMessage = 'PDF is password protected. Please provide an unprotected PDF.';
        }
      }
      
      return new Response(
        JSON.stringify({ error: `Error parsing PDF: ${errorMessage}` }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Process text content into questions
    console.log('Processing text content...');
    let questions;
    try {
      questions = processTextContent(pdfContent.text, filename, userId, universityId);
      console.log(`Processed ${questions.length} questions`);
      
      if (questions.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No questions found in the PDF. Please check PDF format.' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    } catch (processError) {
      console.error('Error processing text content:', processError);
      return new Response(
        JSON.stringify({ error: `Error processing PDF content: ${processError.message}` }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Save questions to database
    console.log('Saving questions to database...');
    const { data: savedQuestions, error: saveError } = await supabase
      .from('questions')
      .insert(questions)
      .select();

    if (saveError) {
      console.error('Database save error:', saveError);
      return new Response(
        JSON.stringify({ error: `Error saving questions: ${saveError.message}` }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    console.log(`Successfully saved ${savedQuestions.length} questions`);

    // Clean up temp PDF
    console.log('Cleaning up temporary PDF...');
    const { error: removeError } = await supabase.storage.from('temp_pdfs').remove([pdfUrl]);
    if (removeError) {
      console.warn('Warning: Failed to clean up temporary PDF:', removeError);
    } else {
      console.log('Temporary PDF cleaned up');
    }

    return new Response(
      JSON.stringify({ questions: savedQuestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unhandled error processing PDF:', error);
    return new Response(
      JSON.stringify({ error: `Unexpected error: ${error.message}` }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function processTextContent(text: string, filename: string, userId: string, universityId: string | null): any[] {
  const lines = text.split('\n').filter(line => line.trim())
  const questions = []
  let currentQuestion: any = {}

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Match question with pattern like "16. Frage:" or just "Frage:"
    if (/^(\d+\.)?\s*Frage:/.test(line)) {
      // Save previous question if exists
      if (currentQuestion.question) {
        questions.push(currentQuestion)
      }
      
      // Extract just the question text by removing both numbering and "Frage:" prefix
      const questionText = line.replace(/^(\d+\.)?\s*Frage:\s*/, '').trim()
      
      currentQuestion = {
        question: questionText,
        filename,
        exam_name: filename, // Add the filename as exam_name
        user_id: userId,
        university_id: universityId,
        visibility: universityId ? 'university' : 'private',
        difficulty: 3,
        image_urls: []
      }
    } 
    // Match options: "A) Text" or "A)" + next line
    else if (/^[A-E]\)/.test(line)) {
      const option = line[0].toLowerCase()
      const optionText = line.substring(2).trim()
      currentQuestion[`option_${option}`] = optionText
    }
    // Match subject: "Fach: HNO"
    else if (line.startsWith('Fach:')) {
      currentQuestion.subject = line.replace('Fach:', '').trim()
    }
    // Match answer: "Antwort: A"
    else if (line.startsWith('Antwort:')) {
      currentQuestion.correct_answer = line.replace('Antwort:', '').trim()
    }
    // Match comment: "Kommentar: Hat da jemand..."
    else if (line.startsWith('Kommentar:')) {
      currentQuestion.comment = line.replace('Kommentar:', '').trim()
      
      // Check if comment continues on next line
      let j = i + 1
      while (j < lines.length && 
             !lines[j].trim().startsWith('Frage:') && 
             !lines[j].trim().startsWith('Fach:') &&
             !lines[j].trim().startsWith('Antwort:') &&
             !/^[A-E]\)/.test(lines[j].trim())) {
        currentQuestion.comment += ' ' + lines[j].trim()
        i = j
        j++
      }
    }
  }

  // Add last question
  if (currentQuestion.question) {
    questions.push(currentQuestion)
  }

  return questions
}

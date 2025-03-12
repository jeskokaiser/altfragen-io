
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import * as pdfParse from 'npm:pdf-parse'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper to create standardized error responses
function errorResponse(message, status = 400, details = null) {
  console.error(`Error: ${message}`, details ? `Details: ${JSON.stringify(details)}` : '');
  return new Response(
    JSON.stringify({ 
      error: message,
      details: details
    }),
    { 
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  console.log('Function invoked: process-pdf - ' + new Date().toISOString());
  console.log('Environment check: SUPABASE_URL exists:', !!Deno.env.get('SUPABASE_URL'));
  console.log('Environment check: SUPABASE_SERVICE_ROLE_KEY exists:', !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));

  try {
    // Parse request body with error handling
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body parsed successfully');
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return errorResponse('Invalid request body: ' + parseError.message);
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
      return errorResponse(`Missing required parameters: ${missingParams.join(', ')}`);
    }

    // Check memory usage
    console.log('Memory usage before PDF processing:', Deno.memoryUsage());

    // Use service role key for admin access to bypass RLS policies
    let supabase;
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (!supabaseUrl || !supabaseKey) {
        return errorResponse('Missing Supabase configuration environment variables', 500);
      }
      
      supabase = createClient(
        supabaseUrl,
        supabaseKey,
        {
          auth: {
            persistSession: false,
          }
        }
      );
      console.log('Supabase client created successfully');
    } catch (clientError) {
      console.error('Failed to create Supabase client:', clientError);
      return errorResponse('Failed to create Supabase client: ' + clientError.message, 500);
    }

    // No longer attempt to create bucket - assume it exists
    // Instead, check if we can access it and provide clear errors
    console.log('Checking if temp_pdfs bucket is accessible...');
    try {
      const { data: buckets, error: bucketsError } = await supabase
        .storage
        .listBuckets();
      
      if (bucketsError) {
        console.error('Error listing buckets:', bucketsError);
        return errorResponse('Cannot access storage: ' + bucketsError.message, 500);
      }
      
      const tempBucketExists = buckets.some(bucket => bucket.name === 'temp_pdfs');
      if (!tempBucketExists) {
        console.error('temp_pdfs bucket does not exist and needs to be created via SQL migration');
        return errorResponse('Storage not properly configured. Please contact support.', 500);
      }
      console.log('temp_pdfs bucket is accessible');
    } catch (bucketError) {
      console.error('Error checking temp_pdfs bucket:', bucketError);
      return errorResponse('Error checking storage configuration: ' + bucketError.message, 500);
    }

    // Set a timeout for the entire operation
    const processingTimeout = setTimeout(() => {
      console.error('PDF processing timeout reached');
      return errorResponse('PDF processing timeout - operation took too long', 408);
    }, 50000); // 50 second timeout

    console.log('Downloading PDF from storage...');
    // Download PDF from temp storage - add retry logic
    let pdfData;
    let downloadError;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await supabase
          .storage
          .from('temp_pdfs')
          .download(pdfUrl);
        
        if (result.error) {
          console.error(`Download attempt ${attempt} failed:`, result.error);
          downloadError = result.error;
          
          if (attempt < maxRetries) {
            console.log(`Retrying download (attempt ${attempt + 1}/${maxRetries})...`);
            // Wait a bit before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt)));
            continue;
          }
        } else {
          pdfData = result.data;
          downloadError = null;
          console.log(`PDF downloaded successfully on attempt ${attempt}`);
          break;
        }
      } catch (error) {
        console.error(`Download attempt ${attempt} exception:`, error);
        downloadError = error;
        
        if (attempt < maxRetries) {
          console.log(`Retrying download after exception (attempt ${attempt + 1}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt)));
        }
      }
    }
    
    if (downloadError || !pdfData) {
      console.error('All download attempts failed:', downloadError);
      clearTimeout(processingTimeout);
      return errorResponse(`Error downloading PDF after ${maxRetries} attempts: ${downloadError?.message || 'Unknown error'}`);
    }
    
    console.log('PDF downloaded successfully, size:', pdfData.size, 'bytes');
    console.log('PDF type:', pdfData.type);
    console.log('Memory usage after download:', Deno.memoryUsage());

    if (!pdfData || pdfData.size === 0) {
      console.error('PDF data is empty');
      clearTimeout(processingTimeout);
      return errorResponse('PDF data is empty or invalid');
    }

    // Basic PDF validation by checking file signature/magic bytes
    const firstBytes = await pdfData.slice(0, 5).arrayBuffer();
    const signature = new Uint8Array(firstBytes);
    const isPDF = String.fromCharCode(...signature) === '%PDF-';
    
    if (!isPDF) {
      console.error('File does not have PDF signature');
      clearTimeout(processingTimeout);
      return errorResponse('File does not appear to be a valid PDF');
    }

    // Parse PDF with enhanced error handling
    console.log('Starting PDF parsing...');
    let dataBuffer;
    try {
      dataBuffer = await pdfData.arrayBuffer();
      console.log('PDF converted to ArrayBuffer, size:', dataBuffer.byteLength);
      console.log('Memory usage before parsing:', Deno.memoryUsage());
    } catch (bufferError) {
      console.error('Error converting PDF to buffer:', bufferError);
      clearTimeout(processingTimeout);
      return errorResponse('Error preparing PDF data: ' + bufferError.message);
    }
    
    let pdfContent;
    try {
      // Additional options for pdf-parse to help with problematic PDFs
      const options = {
        max: 0, // No page limit
        version: 'default',
        pagerender: null // Default page renderer
      };
      
      // Add timeout for just the parsing operation
      const parsePromise = pdfParse(dataBuffer, options);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('PDF parsing timeout')), 30000)
      );
      
      pdfContent = await Promise.race([parsePromise, timeoutPromise]);
      
      if (!pdfContent) {
        throw new Error('PDF parsing returned null or undefined result');
      }
      
      if (!pdfContent.text || pdfContent.text.length === 0) {
        throw new Error('PDF parsing produced empty text content');
      }
      
      console.log('PDF parsed successfully, text length:', pdfContent.text.length);
      console.log('PDF num pages:', pdfContent.numpages);
      console.log('PDF info:', pdfContent.info);
      console.log('Memory usage after parsing:', Deno.memoryUsage());
      
      // Log first 500 chars of content for debugging
      console.log('PDF content preview:', pdfContent.text.substring(0, 500) + '...');
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
        } else if (errorMessage.includes('timeout')) {
          errorMessage = 'PDF parsing took too long. The file may be too complex or corrupted.';
        }
      }
      
      clearTimeout(processingTimeout);
      return errorResponse(`Error parsing PDF: ${errorMessage}`);
    }

    // Clean up memory
    dataBuffer = null;
    
    // Process text content into questions
    console.log('Processing text content...');
    let questions;
    try {
      questions = processTextContent(pdfContent.text, filename, userId, universityId);
      console.log(`Processed ${questions.length} questions`);
      console.log('Memory usage after text processing:', Deno.memoryUsage());
      
      if (questions.length === 0) {
        clearTimeout(processingTimeout);
        return errorResponse('No questions found in the PDF. Please check PDF format.');
      }
    } catch (processError) {
      console.error('Error processing text content:', processError);
      clearTimeout(processingTimeout);
      return errorResponse(`Error processing PDF content: ${processError.message}`);
    }

    // Save questions to database
    console.log('Saving questions to database...');
    try {
      const { data: savedQuestions, error: saveError } = await supabase
        .from('questions')
        .insert(questions)
        .select();

      if (saveError) {
        console.error('Database save error:', saveError);
        clearTimeout(processingTimeout);
        return errorResponse(`Error saving questions: ${saveError.message}`);
      }
      console.log(`Successfully saved ${savedQuestions.length} questions`);
    } catch (dbError) {
      console.error('Unexpected database error:', dbError);
      clearTimeout(processingTimeout);
      return errorResponse(`Unexpected database error: ${dbError.message}`, 500);
    }

    // Clean up temp PDF as a background task
    try {
      console.log('Cleaning up temporary PDF...');
      const { error: removeError } = await supabase.storage.from('temp_pdfs').remove([pdfUrl]);
      if (removeError) {
        console.warn('Warning: Failed to clean up temporary PDF:', removeError);
      } else {
        console.log('Temporary PDF cleaned up');
      }
    } catch (cleanupError) {
      console.warn('Error during cleanup:', cleanupError);
      // Non-critical error, continue
    }

    // Clear timeout as we're done
    clearTimeout(processingTimeout);
    
    console.log('Completed PDF processing successfully');
    console.log('Final memory usage:', Deno.memoryUsage());
    
    return new Response(
      JSON.stringify({ questions: questions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unhandled error processing PDF:', error);
    return errorResponse(`Unexpected error: ${error.message}`, 500);
  }
});

function processTextContent(text: string, filename: string, userId: string, universityId: string | null): any[] {
  console.log('Starting text content processing');
  const lines = text.split('\n').filter(line => line.trim())
  console.log(`Extracted ${lines.length} non-empty lines from PDF`);
  
  // Log the first 10 lines for debugging
  console.log('First 10 lines of content:');
  lines.slice(0, 10).forEach((line, i) => console.log(`Line ${i+1}: ${line}`));
  
  const questions = []
  let currentQuestion: any = {}
  let questionCount = 0;
  let inQuestionBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Match question with pattern like "16. Frage:" or just "Frage:" or "1. Frage" or "Frage 1"
    // Also match numbered questions like "1." at the beginning of a line
    if (/^(\d+\.?\s*Frage:?|Frage:?|Frage\s+\d+\.?)/i.test(line) || /^\d+\.\s*(?![A-E]\))/.test(line)) {
      // Save previous question if exists
      if (currentQuestion.question) {
        // Make sure required fields are present
        ensureRequiredFields(currentQuestion);
        questions.push(currentQuestion)
        questionCount++;
        if (questionCount % 10 === 0) {
          console.log(`Processed ${questionCount} questions so far`);
        }
      }
      
      // Extract just the question text by removing both numbering and "Frage:" prefix
      let questionText = line;
      
      // Remove question identifiers
      if (/Frage/i.test(line)) {
        questionText = line.replace(/^(\d+\.?)?\s*Frage:?\s*(\d+\.?)?\s*/i, '').trim();
      } else if (/^\d+\./.test(line)) {
        // For cases like "1. The question text"
        questionText = line.replace(/^\d+\.\s*/, '').trim();
      }
      
      // Sometimes the question continues on the next line(s)
      let j = i + 1;
      while (j < lines.length && 
             !lines[j].trim().match(/^[A-E]\)/) && 
             !lines[j].trim().match(/^(\d+\.?\s*Frage:?|Frage:?|Frage\s+\d+\.?)/i) &&
             !lines[j].trim().match(/^Fach:/) &&
             !lines[j].trim().match(/^Antwort:/) &&
             !lines[j].trim().match(/^Kommentar:/) &&
             !lines[j].trim().match(/^\d+\.\s*(?![A-E]\))/)) {
        questionText += ' ' + lines[j].trim();
        i = j;
        j++;
      }
      
      currentQuestion = {
        question: questionText,
        filename,
        exam_name: filename, // Add the filename as exam_name
        user_id: userId,
        university_id: universityId,
        visibility: universityId ? 'university' : 'private',
        difficulty: 3,
        image_urls: [],
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        option_e: ''
      }
      
      inQuestionBlock = true;
    } 
    // Match options with more flexible patterns: "A) Text" or "A." or "A:"
    else if (inQuestionBlock && /^[A-E][\)\.\:]/.test(line)) {
      const option = line[0].toLowerCase()
      const optionText = line.substring(2).trim()
      
      // Handle multi-line options
      let fullOptionText = optionText;
      let j = i + 1;
      // Continue reading until we hit another option or the end of the option block
      while (j < lines.length && 
             !lines[j].trim().match(/^[A-E][\)\.\:]/) && 
             !lines[j].trim().match(/^(\d+\.?\s*Frage:?|Frage:?|Frage\s+\d+\.?)/i) &&
             !lines[j].trim().match(/^Fach:/) &&
             !lines[j].trim().match(/^Antwort:/) &&
             !lines[j].trim().match(/^Kommentar:/) &&
             !lines[j].trim().match(/^\d+\.\s*(?![A-E]\))/)) {
        fullOptionText += ' ' + lines[j].trim();
        i = j;
        j++;
      }
      
      currentQuestion[`option_${option}`] = fullOptionText;
    }
    // Match subject: "Fach: HNO" or "Fach HNO"
    else if (inQuestionBlock && /^Fach:?\s+/i.test(line)) {
      currentQuestion.subject = line.replace(/^Fach:?\s+/i, '').trim()
    }
    // Match answer: "Antwort: A" or "Antwort A" or "Lösung: A" or "Lösung A"
    else if (inQuestionBlock && /^(Antwort|Lösung):?\s+/i.test(line)) {
      const answer = line.replace(/^(Antwort|Lösung):?\s+/i, '').trim().charAt(0);
      if (/^[A-Ea-e]$/.test(answer)) {
        currentQuestion.correct_answer = answer.toUpperCase();
      }
    }
    // Match comment: "Kommentar: Hat da jemand..." or "Kommentar Hat da jemand..."
    else if (inQuestionBlock && /^Kommentar:?\s+/i.test(line)) {
      currentQuestion.comment = line.replace(/^Kommentar:?\s+/i, '').trim()
      
      // Check if comment continues on next line
      let j = i + 1
      while (j < lines.length && 
             !lines[j].trim().match(/^[A-E][\)\.\:]/) &&
             !lines[j].trim().match(/^(\d+\.?\s*Frage:?|Frage:?|Frage\s+\d+\.?)/i) &&
             !lines[j].trim().match(/^Fach:/) &&
             !lines[j].trim().match(/^Antwort:/) &&
             !lines[j].trim().match(/^Kommentar:/) &&
             !lines[j].trim().match(/^\d+\.\s*(?![A-E]\))/)) {
        currentQuestion.comment += ' ' + lines[j].trim()
        i = j
        j++
      }
    }
  }

  // Add last question
  if (currentQuestion.question) {
    // Make sure required fields are present
    ensureRequiredFields(currentQuestion);
    questions.push(currentQuestion)
    questionCount++;
  }

  console.log(`Completed processing ${questionCount} questions`);
  
  // Debug logging for the first question we found
  if (questions.length > 0) {
    console.log('First question sample:');
    console.log(JSON.stringify(questions[0], null, 2));
  }
  
  return questions
}

// Helper function to ensure all required fields are present in a question
function ensureRequiredFields(question: any) {
  // Make sure all options exist (at least empty strings)
  const options = ['a', 'b', 'c', 'd', 'e'];
  options.forEach(opt => {
    const key = `option_${opt}`;
    if (!question[key]) {
      question[key] = '';
    }
  });
  
  // Make sure subject exists
  if (!question.subject) {
    question.subject = 'Unbekannt';
  }
  
  // Make sure correct_answer exists
  if (!question.correct_answer) {
    // Default to first option if no answer specified
    question.correct_answer = 'A';
  }
  
  // Make sure comment exists
  if (!question.comment) {
    question.comment = '';
  }
  
  // Map option_a to optionA for compatibility
  question.optionA = question.option_a;
  question.optionB = question.option_b;
  question.optionC = question.option_c;
  question.optionD = question.option_d;
  question.optionE = question.option_e;
}

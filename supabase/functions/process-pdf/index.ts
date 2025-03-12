
// Follow imports from Deno standard library
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import * as pdfParse from "https://cdn.jsdelivr.net/npm/pdf-parse@1.1.1/+esm";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const errorResponse = (message: string, status = 400) => {
  console.error(`Error: ${message}`);
  return new Response(
    JSON.stringify({
      error: message,
      details: {
        message,
        timestamp: new Date().toISOString(),
      }
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    }
  );
};

interface ProcessPdfRequest {
  pdfUrl: string;
  filename: string;
  userId?: string;
  universityId?: string;
  requestId?: string;
}

interface Question {
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_e: string;
  correct_answer: string;
  subject: string;
  filename: string;
  university_id?: string | null;
  user_id?: string | null;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables');
      return errorResponse('Server configuration error', 500);
    }
    
    const requestId = crypto.randomUUID();
    console.log(`[${requestId}] Starting PDF processing`);
    console.log(`[${requestId}] Boot time: ${performance.now().toFixed(2)}ms`);

    // Parse request
    const requestData: ProcessPdfRequest = await req.json();
    const { pdfUrl, filename, userId, universityId, requestId: clientRequestId } = requestData;
    
    console.log(`[${requestId}] Processing request:`, { 
      pdfUrl, 
      filename, 
      userId: userId ? 'provided' : 'not provided',
      universityId: universityId ? 'provided' : 'not provided',
      clientRequestId: clientRequestId || 'not provided'
    });
    
    if (!pdfUrl || !filename) {
      return errorResponse('Missing required parameters: pdfUrl and filename');
    }

    // Create supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    if (!supabase) {
      console.error(`[${requestId}] Failed to create Supabase client`);
      return errorResponse('Failed to create Supabase client', 500);
    }

    // Check if the bucket is accessible
    console.log(`[${requestId}] Checking if temp_pdfs bucket is accessible...`);
    try {
      const { data: buckets, error: bucketsError } = await supabase
        .storage
        .listBuckets();
      
      if (bucketsError) {
        console.error(`[${requestId}] Error listing buckets:`, bucketsError);
        return errorResponse('Cannot access storage: ' + bucketsError.message, 500);
      }
      
      const tempBucketExists = buckets.some(bucket => bucket.name === 'temp_pdfs');
      if (!tempBucketExists) {
        console.error(`[${requestId}] temp_pdfs bucket does not exist and needs to be created via SQL migration`);
        return errorResponse('Storage not properly configured. Please contact support.', 500);
      }
      console.log(`[${requestId}] temp_pdfs bucket is accessible`);
    } catch (bucketError) {
      console.error(`[${requestId}] Error checking temp_pdfs bucket:`, bucketError);
      return errorResponse('Error checking storage configuration: ' + bucketError.message, 500);
    }

    // Set a timeout to prevent function from hanging
    const processingTimeout = setTimeout(() => {
      console.error(`[${requestId}] Processing timeout reached`);
      throw new Error('PDF processing timeout reached');
    }, 50000); // 50 second timeout

    console.log(`[${requestId}] Downloading PDF from storage...`);
    
    // Download PDF from temp storage with retry logic
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
          console.error(`[${requestId}] Download attempt ${attempt} failed:`, result.error);
          downloadError = result.error;
          
          if (attempt < maxRetries) {
            console.log(`[${requestId}] Retrying download (attempt ${attempt + 1}/${maxRetries})...`);
            // Wait a bit before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt)));
            continue;
          }
        } else {
          pdfData = result.data;
          downloadError = null;
          console.log(`[${requestId}] PDF downloaded successfully on attempt ${attempt}`);
          break;
        }
      } catch (error) {
        console.error(`[${requestId}] Download attempt ${attempt} exception:`, error);
        downloadError = error;
        
        if (attempt < maxRetries) {
          console.log(`[${requestId}] Retrying download after exception (attempt ${attempt + 1}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt)));
        }
      }
    }
    
    if (downloadError || !pdfData) {
      console.error(`[${requestId}] All download attempts failed:`, downloadError);
      clearTimeout(processingTimeout);
      return errorResponse(`Error downloading PDF after ${maxRetries} attempts: ${downloadError?.message || 'Unknown error'}`);
    }
    
    console.log(`[${requestId}] PDF downloaded successfully, size:`, pdfData.size, 'bytes');

    // Parse PDF
    console.log(`[${requestId}] Parsing PDF content...`);
    let rawText = '';
    try {
      const pdfData32 = new Uint8Array(await pdfData.arrayBuffer());
      const pdf = await pdfParse.default(pdfData32);
      rawText = pdf.text;
      
      if (!rawText || rawText.trim().length === 0) {
        console.error(`[${requestId}] PDF parsing resulted in empty text`);
        clearTimeout(processingTimeout);
        return errorResponse('The PDF does not contain extractable text. Please ensure the PDF contains selectable text, not scanned images.');
      }
      
      console.log(`[${requestId}] PDF parsed successfully, extracted ${rawText.length} characters`);
      // Log a sample for debugging (first 200 chars)
      console.log(`[${requestId}] Text sample:`, rawText.substring(0, 200).replace(/\n/g, ' ').trim());
    } catch (parseError) {
      console.error(`[${requestId}] PDF parsing error:`, parseError);
      clearTimeout(processingTimeout);
      return errorResponse(`Error parsing PDF: ${parseError.message}`);
    }

    // Extract questions
    console.log(`[${requestId}] Extracting questions from text...`);
    
    // Multiple question patterns to match different formats
    const questionPatterns = [
      // Pattern 1: Standard "Frage: ... A) ... B) ... Antwort: ..." format
      /(?:Frage:|(?:\d+\.)\s*Frage:?)\s*(.*?)(?:\n|\r\n)(?:\s*A[\)\.:])(.*?)(?:\n|\r\n)(?:\s*B[\)\.:])(.*?)(?:\n|\r\n)(?:\s*C[\)\.:])(.*?)(?:\n|\r\n)(?:\s*D[\)\.:])(.*?)(?:\n|\r\n)(?:\s*E[\)\.:])(.*?)(?:\n|\r\n)(?:Antwort:|\d+\.\s*Antwort:?)\s*([A-E])/gs,
      
      // Pattern 2: Numbered format "1. ... A) ... B) ... Antwort: ..."
      /(?:\d+\.\s*)(.*?)(?:\n|\r\n)(?:\s*A[\)\.:])(.*?)(?:\n|\r\n)(?:\s*B[\)\.:])(.*?)(?:\n|\r\n)(?:\s*C[\)\.:])(.*?)(?:\n|\r\n)(?:\s*D[\)\.:])(.*?)(?:\n|\r\n)(?:\s*E[\)\.:])(.*?)(?:\n|\r\n)(?:Antwort:|\d+\.\s*Antwort:?)\s*([A-E])/gs,
      
      // Pattern 3: Question marks "? ... A) ... B) ... Antwort: ..."
      /(.*?\?)\s*(?:\n|\r\n)(?:\s*A[\)\.:])(.*?)(?:\n|\r\n)(?:\s*B[\)\.:])(.*?)(?:\n|\r\n)(?:\s*C[\)\.:])(.*?)(?:\n|\r\n)(?:\s*D[\)\.:])(.*?)(?:\n|\r\n)(?:\s*E[\)\.:])(.*?)(?:\n|\r\n)(?:Antwort:|\d+\.\s*Antwort:?)\s*([A-E])/gs,
      
      // Pattern 4: Simple number prefix format
      /(?:\d+\.\s*)(.*?)(?:\n|\r\n|\s+)(?:[A-Ea][\)\.:])\s*(.*?)(?:\n|\r\n|\s+)(?:[A-Eb][\)\.:])\s*(.*?)(?:\n|\r\n|\s+)(?:[A-Ec][\)\.:])\s*(.*?)(?:\n|\r\n|\s+)(?:[A-Ed][\)\.:])\s*(.*?)(?:\n|\r\n|\s+)(?:[A-Ee][\)\.:])\s*(.*?)(?:\n|\r\n|\s+)(?:Antwort:|\d+\.\s*Antwort:?|Lösung:)\s*([A-Ea-e])/gs,
      
      // Add more patterns as needed
    ];
    
    const questions: Question[] = [];
    let matchFound = false;
    
    for (const pattern of questionPatterns) {
      let match;
      const tempQuestions: Question[] = [];
      
      while ((match = pattern.exec(rawText)) !== null) {
        matchFound = true;
        
        // Create a new question from the matches
        const question: Question = {
          question: match[1]?.trim() || "Unknown question",
          option_a: match[2]?.trim() || "Unknown option A",
          option_b: match[3]?.trim() || "Unknown option B",
          option_c: match[4]?.trim() || "Unknown option C",
          option_d: match[5]?.trim() || "Unknown option D",
          option_e: match[6]?.trim() || "Unknown option E",
          correct_answer: match[7]?.trim().toUpperCase() || "Unknown answer",
          subject: "Unknown",  // Default subject
          filename: filename,
          university_id: universityId || null,
          user_id: userId || null
        };
        
        tempQuestions.push(question);
      }
      
      if (tempQuestions.length > 0) {
        console.log(`[${requestId}] Found ${tempQuestions.length} questions with pattern ${questionPatterns.indexOf(pattern) + 1}`);
        questions.push(...tempQuestions);
        break; // Use the first successful pattern
      }
    }
    
    if (!matchFound || questions.length === 0) {
      console.error(`[${requestId}] No questions found in the PDF`);
      console.log(`[${requestId}] First 500 chars of content:`, rawText.substring(0, 500).replace(/\n/g, '\\n'));
      clearTimeout(processingTimeout);
      return errorResponse('No questions found in the PDF. Please ensure the file follows the required format.');
    }
    
    console.log(`[${requestId}] Extracted ${questions.length} questions successfully`);

    // Process all questions - check and clean the data
    questions.forEach((q, i) => {
      // Clean and validate answers
      q.correct_answer = q.correct_answer.trim().toUpperCase().charAt(0);
      if (!["A", "B", "C", "D", "E"].includes(q.correct_answer)) {
        console.warn(`[${requestId}] Question ${i+1} has invalid answer: ${q.correct_answer}, defaulting to A`);
        q.correct_answer = "A";
      }
      
      // Sanitize other fields
      q.question = q.question.trim().substring(0, 2000); // Limit length
      q.option_a = q.option_a.trim().substring(0, 1000);
      q.option_b = q.option_b.trim().substring(0, 1000);
      q.option_c = q.option_c.trim().substring(0, 1000);
      q.option_d = q.option_d.trim().substring(0, 1000);
      q.option_e = q.option_e.trim().substring(0, 1000);
      
      // Add a default subject based on filename if possible
      if (filename.includes('_')) {
        const potentialSubject = filename.split('_')[0];
        if (potentialSubject && potentialSubject.length > 1) {
          q.subject = potentialSubject;
        }
      }
    });

    // Store questions in database with a transaction
    console.log(`[${requestId}] Storing ${questions.length} questions in database...`);
    try {
      const { error: insertError } = await supabase
        .from('questions')
        .insert(questions);
      
      if (insertError) {
        console.error(`[${requestId}] Error inserting questions:`, insertError);
        clearTimeout(processingTimeout);
        return errorResponse(`Error storing questions: ${insertError.message}`);
      }
      
      console.log(`[${requestId}] Questions stored successfully`);
    } catch (dbError) {
      console.error(`[${requestId}] Database error:`, dbError);
      clearTimeout(processingTimeout);
      return errorResponse(`Database error: ${dbError.message}`, 500);
    }

    // Clean up the temporary PDF
    console.log(`[${requestId}] Cleaning up temporary PDF...`);
    try {
      const { error: deleteError } = await supabase
        .storage
        .from('temp_pdfs')
        .remove([pdfUrl]);
      
      if (deleteError) {
        console.warn(`[${requestId}] Warning: Failed to delete temporary PDF:`, deleteError);
        // Continue despite cleanup failure
      } else {
        console.log(`[${requestId}] Temporary PDF deleted successfully`);
      }
    } catch (cleanupError) {
      console.warn(`[${requestId}] Cleanup error:`, cleanupError);
      // Continue despite cleanup failure
    }

    // Function completed successfully
    clearTimeout(processingTimeout);
    console.log(`[${requestId}] PDF processing completed successfully`);
    
    return new Response(
      JSON.stringify({
        success: true,
        questions: questions.map(q => ({
          question: q.question,
          correct_answer: q.correct_answer
        })),
        message: `Successfully processed ${questions.length} questions`
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  } catch (error) {
    console.error('Unhandled error:', error);
    return errorResponse(`Unhandled server error: ${error.message}`, 500);
  }
});

// Import required modules
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import * as pdfParse from "https://cdn.jsdelivr.net/npm/pdf-parse@1.1.1/+esm";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Error response helper function
const errorResponse = (message: string, status = 400) => {
  console.error(`Error: ${message}`);
  return new Response(
    JSON.stringify({
      error: message,
      details: { message, timestamp: new Date().toISOString() },
    }),
    { status, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
};

// Define the interfaces for the PDF processing request and the Question object
interface ProcessPdfRequest {
  pdfUrl: string;
  filename: string;
  userId?: string;
  universityId?: string;
  requestId?: string;
  // Optional array of images to be associated with questions.
  // Each image should include a questionIndex, imageData (base64 encoded), and imageFilename.
  images?: Array<{
    questionIndex: number;
    imageData: string;
    imageFilename: string;
  }>;
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
  // New field to store the public URL of the image
  image_url?: string;
}

// Helper to decode a base64 data URL (if applicable) and return a Uint8Array
function decodeBase64Image(dataString: string): Uint8Array {
  // Remove the data URL prefix if present
  const base64Data = dataString.includes("base64,")
    ? dataString.split("base64,")[1]
    : dataString;
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Main function – start the edge function service
serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Retrieve environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables');
      return errorResponse('Server configuration error', 500);
    }

    const requestId = crypto.randomUUID();
    console.log(`[${requestId}] Starting PDF processing`);

    // Parse the incoming request
    const requestData: ProcessPdfRequest = await req.json();
    const { pdfUrl, filename, userId, universityId, images } = requestData;
    if (!pdfUrl || !filename) {
      return errorResponse('Missing required parameters: pdfUrl and filename');
    }

    // Create Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    if (!supabase) {
      console.error(`[${requestId}] Failed to create Supabase client`);
      return errorResponse('Failed to create Supabase client', 500);
    }

    // Verify that the storage bucket "temp_pdfs" exists
    console.log(`[${requestId}] Checking if temp_pdfs bucket is accessible...`);
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      console.error(`[${requestId}] Error listing buckets:`, bucketsError);
      return errorResponse('Cannot access storage: ' + bucketsError.message, 500);
    }
    const tempBucketExists = buckets.some(bucket => bucket.name === 'temp_pdfs');
    if (!tempBucketExists) {
      console.error(`[${requestId}] temp_pdfs bucket does not exist`);
      return errorResponse('Storage not properly configured. Please contact support.', 500);
    }
    console.log(`[${requestId}] temp_pdfs bucket is accessible`);

    // Set a timeout for processing
    const processingTimeout = setTimeout(() => {
      console.error(`[${requestId}] Processing timeout reached`);
      throw new Error('PDF processing timeout reached');
    }, 50000);

    // Download the PDF from Supabase storage with retry logic
    console.log(`[${requestId}] Downloading PDF from storage...`);
    let pdfData;
    let downloadError;
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await supabase.storage.from('temp_pdfs').download(pdfUrl);
        if (result.error) {
          console.error(`[${requestId}] Download attempt ${attempt} failed:`, result.error);
          downloadError = result.error;
          if (attempt < maxRetries) {
            console.log(`[${requestId}] Retrying download (attempt ${attempt + 1}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt)));
            continue;
          }
        } else {
          pdfData = result.data;
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
    if (!pdfData) {
      console.error(`[${requestId}] All download attempts failed:`, downloadError);
      clearTimeout(processingTimeout);
      return errorResponse(`Error downloading PDF after ${maxRetries} attempts: ${downloadError?.message || 'Unknown error'}`);
    }
    console.log(`[${requestId}] PDF downloaded, size: ${pdfData.size} bytes`);

    // Parse the PDF using pdf-parse
    console.log(`[${requestId}] Parsing PDF content...`);
    let rawText = '';
    try {
      const pdfDataBuffer = new Uint8Array(await pdfData.arrayBuffer());
      const pdf = await pdfParse.default(pdfDataBuffer);
      rawText = pdf.text;
      if (!rawText || rawText.trim().length === 0) {
        console.error(`[${requestId}] PDF parsing resulted in empty text`);
        clearTimeout(processingTimeout);
        return errorResponse('The PDF does not contain extractable text. Please ensure the PDF contains selectable text, not scanned images.');
      }
      console.log(`[${requestId}] PDF parsed successfully, extracted ${rawText.length} characters`);
    } catch (parseError) {
      console.error(`[${requestId}] PDF parsing error:`, parseError);
      clearTimeout(processingTimeout);
      return errorResponse(`Error parsing PDF: ${parseError.message}`);
    }

    // Normalize the extracted text
    const normalizedText = rawText
      .replace(/\r\n/g, "\n")
      .replace(/\s+/g, " ")
      .replace(/Antwort:\s*([A-E])\?/gi, "Antwort: $1");
    console.log(`[${requestId}] Normalized text sample:`, normalizedText.substring(0, 200));

    // Flexible regex patterns to extract questions
    const questionPatterns = [
      /(?:Frage:|\d+\.\s*Frage:)\s*(.*?)\s*(?:A[\)\.:]\s*(.*?))\s*(?:B[\)\.:]\s*(.*?))\s*(?:C[\)\.:]\s*(.*?))\s*(?:D[\)\.:]\s*(.*?))\s*(?:E[\)\.:]\s*(.*?))\s*Antwort:\s*([A-E])/gi,
      /(\d+\.\s*.*?)(?:\s+A[\)\.:]\s*(.*?))\s*(?:B[\)\.:]\s*(.*?))\s*(?:C[\)\.:]\s*(.*?))\s*(?:D[\)\.:]\s*(.*?))\s*(?:E[\)\.:]\s*(.*?))\s*Antwort:\s*([A-E])/gi,
    ];

    const questions: Question[] = [];
    let matchFound = false;
    for (const pattern of questionPatterns) {
      let match;
      const tempQuestions: Question[] = [];
      while ((match = pattern.exec(normalizedText)) !== null) {
        matchFound = true;
        const question: Question = {
          question: match[1]?.trim() || "Unknown question",
          option_a: match[2]?.trim() || "Unknown option A",
          option_b: match[3]?.trim() || "Unknown option B",
          option_c: match[4]?.trim() || "Unknown option C",
          option_d: match[5]?.trim() || "Unknown option D",
          option_e: match[6]?.trim() || "Unknown option E",
          correct_answer: match[7]?.trim().toUpperCase() || "A",
          subject: "Unknown",
          filename: filename,
          university_id: universityId || null,
          user_id: userId || null,
        };
        tempQuestions.push(question);
      }
      if (tempQuestions.length > 0) {
        console.log(`[${requestId}] Found ${tempQuestions.length} questions with a regex pattern.`);
        questions.push(...tempQuestions);
        break; // Use the first successful pattern
      }
    }
    if (!matchFound || questions.length === 0) {
      console.error(`[${requestId}] No questions found in the PDF.`);
      console.log(`[${requestId}] First 500 chars of normalized text:`, normalizedText.substring(0, 500));
      clearTimeout(processingTimeout);
      return errorResponse('No questions found in the PDF. Please ensure the file follows the required format.');
    }
    console.log(`[${requestId}] Extracted ${questions.length} questions successfully`);

    // Clean and validate questions
    questions.forEach((q, i) => {
      q.correct_answer = q.correct_answer.trim().toUpperCase().charAt(0);
      if (!["A", "B", "C", "D", "E"].includes(q.correct_answer)) {
        console.warn(`[${requestId}] Question ${i + 1} has invalid answer: ${q.correct_answer}, defaulting to A`);
        q.correct_answer = "A";
      }
      q.question = q.question.trim().substring(0, 2000);
      q.option_a = q.option_a.trim().substring(0, 1000);
      q.option_b = q.option_b.trim().substring(0, 1000);
      q.option_c = q.option_c.trim().substring(0, 1000);
      q.option_d = q.option_d.trim().substring(0, 1000);
      q.option_e = q.option_e.trim().substring(0, 1000);
      if (filename.includes('_')) {
        const potentialSubject = filename.split('_')[0];
        if (potentialSubject && potentialSubject.length > 1) {
          q.subject = potentialSubject;
        }
      }
    });

    // Process any provided images by uploading them to the "Question Images" bucket
    if (images && images.length > 0) {
      console.log(`[${requestId}] Processing ${images.length} question images...`);
      for (const img of images) {
        const { questionIndex, imageData, imageFilename } = img;
        // Validate the question index
        if (questionIndex < 0 || questionIndex >= questions.length) {
          console.warn(`[${requestId}] Invalid questionIndex ${questionIndex} for image ${imageFilename}`);
          continue;
        }
        try {
          // Decode the base64 image data
          const imageBytes = decodeBase64Image(imageData);
          // Create a unique file path for the image in the "Question Images" bucket
          const uniqueFilename = `${crypto.randomUUID()}-${imageFilename}`;
          const filePath = uniqueFilename;
          // Upload the image to the bucket "Question Images"
          const uploadResult = await supabase.storage.from("Question Images").upload(filePath, imageBytes, {
            contentType: "image/png", // Adjust if needed based on actual image type
          });
          if (uploadResult.error) {
            console.error(`[${requestId}] Error uploading image for question ${questionIndex}:`, uploadResult.error);
            continue;
          }
          // Get the public URL of the uploaded image
          const { data: publicUrlData } = supabase.storage.from("Question Images").getPublicUrl(filePath);
          const imageUrl = publicUrlData.publicUrl;
          // Link the image URL to the corresponding question
          questions[questionIndex].image_url = imageUrl;
          console.log(`[${requestId}] Linked image ${uniqueFilename} to question index ${questionIndex}`);
        } catch (imgError) {
          console.error(`[${requestId}] Error processing image for question ${questionIndex}:`, imgError);
        }
      }
    }

    // Insert the questions (with linked image URLs, if any) into the Supabase database
    console.log(`[${requestId}] Storing ${questions.length} questions in database...`);
    try {
      const { error: insertError } = await supabase.from('questions').insert(questions);
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
      const { error: deleteError } = await supabase.storage.from('temp_pdfs').remove([pdfUrl]);
      if (deleteError) {
        console.warn(`[${requestId}] Warning: Failed to delete temporary PDF:`, deleteError);
      } else {
        console.log(`[${requestId}] Temporary PDF deleted successfully`);
      }
    } catch (cleanupError) {
      console.warn(`[${requestId}] Cleanup error:`, cleanupError);
    }

    clearTimeout(processingTimeout);
    console.log(`[${requestId}] PDF processing completed successfully`);
    return new Response(JSON.stringify({
      success: true,
      questions: questions.map(q => ({ question: q.question, correct_answer: q.correct_answer, image_url: q.image_url || null })),
      message: `Successfully processed ${questions.length} questions`
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    console.error('Unhandled error:', error);
    return errorResponse(`Unhandled server error: ${error.message}`, 500);
  }
});

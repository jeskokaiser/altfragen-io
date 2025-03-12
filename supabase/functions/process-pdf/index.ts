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

  try {
    console.log('Starting PDF processing...');
    const { pdfUrl, filename, userId, universityId } = await req.json();
    console.log('Request params:', { pdfUrl, filename, userId, universityId });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    console.log('Downloading PDF from storage...');
    // Download PDF from temp storage
    const { data: pdfData, error: downloadError } = await supabase
      .storage
      .from('temp_pdfs')
      .download(pdfUrl);

    if (downloadError) {
      console.error('Download error:', downloadError);
      throw new Error(`Error downloading PDF: ${downloadError.message}`);
    }
    console.log('PDF downloaded successfully');

    // Parse PDF
    console.log('Starting PDF parsing...');
    const dataBuffer = await pdfData.arrayBuffer();
    let pdfContent;
    try {
      pdfContent = await pdfParse(dataBuffer);
      console.log('PDF parsed successfully');
    } catch (parseError) {
      console.error('PDF parsing error:', parseError);
      throw new Error(`Error parsing PDF: ${parseError.message}`);
    }

    // Process text content into questions
    console.log('Processing text content...');
    const questions = processTextContent(pdfContent.text, filename, userId, universityId);
    console.log(`Processed ${questions.length} questions`);

    // Save questions to database
    console.log('Saving questions to database...');
    const { data: savedQuestions, error: saveError } = await supabase
      .from('questions')
      .insert(questions)
      .select();

    if (saveError) {
      console.error('Database save error:', saveError);
      throw new Error(`Error saving questions: ${saveError.message}`);
    }
    console.log(`Successfully saved ${savedQuestions.length} questions`);

    // Clean up temp PDF
    console.log('Cleaning up temporary PDF...');
    await supabase.storage.from('temp_pdfs').remove([pdfUrl]);
    console.log('Temporary PDF cleaned up');

    return new Response(
      JSON.stringify({ questions: savedQuestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing PDF:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
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

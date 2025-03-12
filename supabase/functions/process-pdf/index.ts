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
    const { pdfUrl, filename, userId, universityId } = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Download PDF from temp storage
    const { data: pdfData, error: downloadError } = await supabase
      .storage
      .from('temp_pdfs')
      .download(pdfUrl)

    if (downloadError) throw new Error(`Error downloading PDF: ${downloadError.message}`)

    // Parse PDF
    const dataBuffer = await pdfData.arrayBuffer()
    const pdfContent = await pdfParse(dataBuffer)

    // Process text content into questions
    const questions = processTextContent(pdfContent.text, filename, userId, universityId)

    // Save questions to database
    const { data: savedQuestions, error: saveError } = await supabase
      .from('questions')
      .insert(questions)
      .select()

    if (saveError) throw new Error(`Error saving questions: ${saveError.message}`)

    // Clean up temp PDF
    await supabase.storage.from('temp_pdfs').remove([pdfUrl])

    return new Response(
      JSON.stringify({ questions: savedQuestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error processing PDF:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

function processTextContent(text: string, filename: string, userId: string, universityId: string | null): any[] {
  const lines = text.split('\n').filter(line => line.trim())
  const questions = []
  let currentQuestion: any = {}

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    if (line.startsWith('Frage:')) {
      // Save previous question if exists
      if (currentQuestion.question) {
        questions.push(currentQuestion)
      }
      
      currentQuestion = {
        question: line.replace('Frage:', '').trim(),
        filename,
        user_id: userId,
        university_id: universityId,
        visibility: universityId ? 'university' : 'private',
        difficulty: 3,
        image_urls: []
      }
    } else if (line.startsWith('A)')) {
      currentQuestion.option_a = line.replace('A)', '').trim()
    } else if (line.startsWith('B)')) {
      currentQuestion.option_b = line.replace('B)', '').trim()
    } else if (line.startsWith('C)')) {
      currentQuestion.option_c = line.replace('C)', '').trim()
    } else if (line.startsWith('D)')) {
      currentQuestion.option_d = line.replace('D)', '').trim()
    } else if (line.startsWith('E)')) {
      currentQuestion.option_e = line.replace('E)', '').trim()
    } else if (line.startsWith('Antwort:')) {
      currentQuestion.correct_answer = line.replace('Antwort:', '').trim()
    } else if (line.startsWith('Kommentar:')) {
      currentQuestion.comment = line.replace('Kommentar:', '').trim()
    } else if (line.startsWith('Fach:')) {
      currentQuestion.subject = line.replace('Fach:', '').trim()
    }
  }

  // Add last question
  if (currentQuestion.question) {
    questions.push(currentQuestion)
  }

  return questions
}

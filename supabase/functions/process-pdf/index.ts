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
    
    // Match question with number: "16. Frage: Was ist keine häufige..."
    if (/^\d+\.\s*Frage:/.test(line)) {
      // Save previous question if exists
      if (currentQuestion.question) {
        questions.push(currentQuestion)
      }
      
      currentQuestion = {
        question: line.replace(/^\d+\.\s*Frage:\s*/, '').trim(),
        filename,
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

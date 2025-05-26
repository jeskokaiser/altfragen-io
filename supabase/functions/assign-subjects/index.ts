
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { questions, availableSubjects, userId } = await req.json();
    
    if (!questions || !availableSubjects || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: questions, availableSubjects, userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const updatedQuestions = [];

    // Process each question individually
    for (const question of questions) {
      try {
        const prompt = `You are a subject classifier for academic questions. Given the following question and list of available subjects, select the most appropriate subject.

Question: "${question.question}"

Available subjects: ${availableSubjects.join(', ')}

Please respond with ONLY the exact subject name from the list above that best matches this question. Do not add any explanation or additional text.`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4.1-nano',
            messages: [
              { 
                role: 'system', 
                content: 'You are a precise subject classifier. Always respond with only the exact subject name from the provided list.' 
              },
              { role: 'user', content: prompt }
            ],
            temperature: 0.1,
            max_tokens: 50,
          }),
        });

        if (!response.ok) {
          console.error(`OpenAI API error for question ${question.id}:`, response.statusText);
          continue;
        }

        const data = await response.json();
        const assignedSubject = data.choices[0].message.content.trim();

        // Validate that the assigned subject is in the available list
        if (!availableSubjects.includes(assignedSubject)) {
          console.warn(`Invalid subject "${assignedSubject}" for question ${question.id}, using first available subject`);
          assignedSubject = availableSubjects[0];
        }

        // Update the question in the database
        const { error: updateError } = await supabase
          .from('questions')
          .update({ subject: assignedSubject })
          .eq('id', question.id)
          .eq('user_id', userId);

        if (updateError) {
          console.error(`Error updating question ${question.id}:`, updateError);
          continue;
        }

        updatedQuestions.push({
          ...question,
          subject: assignedSubject
        });

        console.log(`Updated question ${question.id} with subject: ${assignedSubject}`);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error processing question ${question.id}:`, error);
        continue;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        updatedQuestions,
        message: `Successfully updated ${updatedQuestions.length} out of ${questions.length} questions`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in assign-subjects function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

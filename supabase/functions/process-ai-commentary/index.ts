
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question } = await req.json();

    if (!question) {
      return new Response(JSON.stringify({ error: 'Question data required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get API keys
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const googleAIApiKey = Deno.env.get('GOOGLE_AI_API_KEY');
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

    // Get current settings
    const { data: settings } = await supabase
      .from('ai_commentary_settings')
      .select('models_enabled')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const modelsEnabled = settings?.models_enabled || { gemini: true, openai: true, claude: true };

    // Build question prompt
    const questionPrompt = `
Question: "${question.question}"

Answer options:
A) ${question.option_a}
B) ${question.option_b}
C) ${question.option_c}
D) ${question.option_d}
E) ${question.option_e}

Correct answer: ${question.correct_answer}
${question.comment ? `Explanation: ${question.comment}` : ''}

Please provide educational commentary on this question. Focus on:
1. Key concepts being tested
2. Common mistakes students might make
3. Learning tips or mnemonics
4. Related topics to explore further

Keep the response informative but concise (200-300 words).
`;

    const commentaries = [];

    // Process with OpenAI GPT-4o-mini
    if (modelsEnabled.openai && openAIApiKey) {
      try {
        const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'You are an educational AI assistant that provides insightful commentary on academic questions.' },
              { role: 'user', content: questionPrompt }
            ],
            temperature: 0.7,
            max_tokens: 500,
          }),
        });

        if (openAIResponse.ok) {
          const data = await openAIResponse.json();
          const commentary = data.choices[0].message.content;
          
          const { error } = await supabase
            .from('ai_commentaries')
            .insert({
              question_id: question.id,
              model_name: 'gpt-4o-mini',
              commentary_text: commentary,
              processing_status: 'completed'
            });

          if (!error) {
            commentaries.push({ model: 'gpt-4o-mini', commentary });
            console.log(`OpenAI commentary saved for question ${question.id}`);
          }
        }
      } catch (error) {
        console.error('OpenAI API error:', error);
      }
    }

    // Process with Google Gemini 2.5 Pro
    if (modelsEnabled.gemini && googleAIApiKey) {
      try {
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${googleAIApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: questionPrompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 500,
            }
          }),
        });

        if (geminiResponse.ok) {
          const data = await geminiResponse.json();
          const commentary = data.candidates[0].content.parts[0].text;
          
          const { error } = await supabase
            .from('ai_commentaries')
            .insert({
              question_id: question.id,
              model_name: 'gemini-2.5-pro',
              commentary_text: commentary,
              processing_status: 'completed'
            });

          if (!error) {
            commentaries.push({ model: 'gemini-2.5-pro', commentary });
            console.log(`Gemini commentary saved for question ${question.id}`);
          }
        }
      } catch (error) {
        console.error('Gemini API error:', error);
      }
    }

    // Process with Claude Sonnet 4.0
    if (modelsEnabled.claude && anthropicApiKey) {
      try {
        const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${anthropicApiKey}`,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 500,
            temperature: 0.7,
            messages: [
              { role: 'user', content: questionPrompt }
            ],
          }),
        });

        if (claudeResponse.ok) {
          const data = await claudeResponse.json();
          const commentary = data.content[0].text;
          
          const { error } = await supabase
            .from('ai_commentaries')
            .insert({
              question_id: question.id,
              model_name: 'claude-sonnet-4.0',
              commentary_text: commentary,
              processing_status: 'completed'
            });

          if (!error) {
            commentaries.push({ model: 'claude-sonnet-4.0', commentary });
            console.log(`Claude commentary saved for question ${question.id}`);
          }
        }
      } catch (error) {
        console.error('Claude API error:', error);
      }
    }

    // Generate summary if we have commentaries
    if (commentaries.length > 0 && openAIApiKey) {
      const summaryPrompt = `Based on the following AI-generated commentaries about an educational question, create a unified, comprehensive summary that combines the best insights from all sources:

${commentaries.map((c, i) => `Commentary ${i + 1} (${c.model}):\n${c.commentary}`).join('\n\n')}

Please create a well-structured summary that:
1. Combines the key educational insights
2. Highlights the most important concepts
3. Provides actionable learning tips
4. Maintains clarity and conciseness (250-350 words)`;

      try {
        const summaryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'You are an expert educational content curator. Create comprehensive summaries that synthesize multiple AI perspectives into cohesive learning material.' },
              { role: 'user', content: summaryPrompt }
            ],
            temperature: 0.5,
            max_tokens: 600,
          }),
        });

        if (summaryResponse.ok) {
          const data = await summaryResponse.json();
          const summary = data.choices[0].message.content;
          
          const { error: summaryError } = await supabase
            .from('ai_commentary_summaries')
            .insert({
              question_id: question.id,
              summary_text: summary
            });

          if (!summaryError) {
            console.log(`Summary saved for question ${question.id}`);
          }
        }
      } catch (error) {
        console.error('Summary generation error:', error);
      }
    }

    // Update question status
    await supabase
      .from('questions')
      .update({ 
        ai_commentary_status: 'completed',
        ai_commentary_processed_at: new Date().toISOString()
      })
      .eq('id', question.id);

    return new Response(JSON.stringify({ 
      success: true, 
      commentariesGenerated: commentaries.length,
      questionId: question.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in process-ai-commentary:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

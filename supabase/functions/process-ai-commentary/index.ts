
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Question {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_e: string;
  correct_answer: string;
  comment: string;
  subject: string;
  difficulty: number;
}

interface AICommentarySettings {
  batch_size: number;
  processing_delay_minutes: number;
  models_enabled: {
    openai: boolean;
    claude: boolean;
    gemini: boolean;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('AI Commentary processing started');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get AI commentary settings
    const { data: settings, error: settingsError } = await supabase
      .from('ai_commentary_settings')
      .select('*')
      .single();

    if (settingsError) {
      console.error('Error fetching settings:', settingsError);
      return new Response(JSON.stringify({ error: 'Settings not found' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiSettings: AICommentarySettings = {
      batch_size: settings.batch_size || 5,
      processing_delay_minutes: settings.processing_delay_minutes || 60,
      models_enabled: settings.models_enabled as { openai: boolean; claude: boolean; gemini: boolean; }
    };

    console.log('Settings loaded:', aiSettings);

    // Check if feature is enabled
    if (!settings.feature_enabled) {
      console.log('AI Commentary feature is disabled');
      return new Response(JSON.stringify({ 
        message: 'AI Commentary feature is disabled',
        processed: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate the delay threshold
    const delayThreshold = new Date();
    delayThreshold.setMinutes(delayThreshold.getMinutes() - aiSettings.processing_delay_minutes);

    // Get pending questions that are older than the delay threshold
    const { data: pendingQuestions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('ai_commentary_status', 'pending')
      .lt('ai_commentary_queued_at', delayThreshold.toISOString())
      .limit(aiSettings.batch_size);

    if (questionsError) {
      console.error('Error fetching pending questions:', questionsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch questions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${pendingQuestions?.length || 0} questions to process`);

    if (!pendingQuestions || pendingQuestions.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No questions to process',
        processed: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let processedCount = 0;
    const enabledModels = Object.entries(aiSettings.models_enabled)
      .filter(([_, enabled]) => enabled)
      .map(([model, _]) => model);

    console.log('Enabled models:', enabledModels);

    // Process each question
    for (const question of pendingQuestions) {
      try {
        // Update status to processing
        await supabase
          .from('questions')
          .update({ ai_commentary_status: 'processing' })
          .eq('id', question.id);

        console.log(`Processing question ${question.id}`);

        // Generate commentaries for enabled models
        const commentaries = [];

        for (const modelName of enabledModels) {
          try {
            const commentary = await generateCommentary(question, modelName);
            if (commentary) {
              commentaries.push({
                question_id: question.id,
                model_name: modelName,
                commentary_text: commentary,
                processing_status: 'completed'
              });
            }
          } catch (error) {
            console.error(`Error generating commentary for ${modelName}:`, error);
            // Continue with other models even if one fails
            commentaries.push({
              question_id: question.id,
              model_name: modelName,
              commentary_text: `Error generating commentary: ${error.message}`,
              processing_status: 'failed'
            });
          }
        }

        // Insert commentaries
        if (commentaries.length > 0) {
          const { error: insertError } = await supabase
            .from('ai_commentaries')
            .insert(commentaries);

          if (insertError) {
            console.error('Error inserting commentaries:', insertError);
          }

          // Generate and insert summary using successful commentaries
          try {
            const successfulCommentaries = commentaries
              .filter(c => c.processing_status === 'completed')
              .map(c => c.commentary_text);

            if (successfulCommentaries.length > 0) {
              const summary = await generateSummary(successfulCommentaries, question);
              if (summary) {
                await supabase
                  .from('ai_commentary_summaries')
                  .upsert({
                    question_id: question.id,
                    summary_text: summary
                  });
              }
            }
          } catch (error) {
            console.error('Error generating summary:', error);
          }
        }

        // Update status to completed
        await supabase
          .from('questions')
          .update({ 
            ai_commentary_status: 'completed',
            ai_commentary_processed_at: new Date().toISOString()
          })
          .eq('id', question.id);

        processedCount++;
        console.log(`Successfully processed question ${question.id}`);

      } catch (error) {
        console.error(`Error processing question ${question.id}:`, error);
        
        // Update status to failed
        await supabase
          .from('questions')
          .update({ ai_commentary_status: 'failed' })
          .eq('id', question.id);
      }
    }

    console.log(`AI Commentary processing completed. Processed: ${processedCount}`);

    return new Response(JSON.stringify({ 
      message: 'Processing completed',
      processed: processedCount 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-ai-commentary function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Generate commentary using real AI APIs
async function generateCommentary(question: Question, modelName: string): Promise<string> {
  const prompt = `Analyze this multiple choice question and provide educational commentary:

Question: ${question.question}
A) ${question.option_a}
B) ${question.option_b}
C) ${question.option_c}
D) ${question.option_d}
E) ${question.option_e}

Correct Answer: ${question.correct_answer}
Subject: ${question.subject}
Difficulty: ${question.difficulty}
Explanation: ${question.comment}

Please provide insightful commentary about this question, including:
1. Key concepts being tested
2. Common mistakes students might make
3. Learning objectives
4. Additional context or real-world applications
5. Study tips for this topic

Keep your response concise but comprehensive (200-400 words).`;

  switch (modelName.toLowerCase()) {
    case 'openai':
      return await callOpenAI(prompt);
    case 'claude':
      return await callClaude(prompt);
    case 'gemini':
      return await callGemini(prompt);
    default:
      throw new Error(`Unknown model: ${modelName}`);
  }
}

// OpenAI API call
async function callOpenAI(prompt: string): Promise<string> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert educational AI that provides insightful commentary on academic questions.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.7
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Claude API call
async function callClaude(prompt: string): Promise<string> {
  const apiKey = Deno.env.get('CLAUDE_API_KEY');
  if (!apiKey) {
    throw new Error('Claude API key not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      messages: [
        { role: 'user', content: prompt }
      ]
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

// Gemini API call
async function callGemini(prompt: string): Promise<string> {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7
      }
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// Generate unified summary using GPT-4o-mini
async function generateSummary(commentaries: string[], question: Question): Promise<string> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OpenAI API key not configured for summary generation');
  }

  const summaryPrompt = `Based on the following AI commentaries about a ${question.subject} question, create a unified summary that synthesizes the key insights:

Question: ${question.question}
Correct Answer: ${question.correct_answer}

AI Commentaries:
${commentaries.map((c, i) => `Commentary ${i + 1}:\n${c}`).join('\n\n')}

Please provide a concise unified summary (150-250 words) that:
1. Highlights the most important learning objectives
2. Identifies key concepts and common misconceptions
3. Provides actionable study recommendations
4. Synthesizes the best insights from all commentaries`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert educational AI that creates unified summaries from multiple AI commentaries.' },
        { role: 'user', content: summaryPrompt }
      ],
      max_tokens: 400,
      temperature: 0.5
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error for summary: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

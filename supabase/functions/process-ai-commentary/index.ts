
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
        const answerCommentData: any = {
          question_id: question.id,
          processing_status: 'completed'
        };

        // Generate general and answer-specific comments for each enabled model
        for (const modelName of enabledModels) {
          try {
            console.log(`Generating commentary for model: ${modelName}`);
            
            // Generate general comment
            const generalComment = await generateGeneralCommentary(question, modelName);
            if (generalComment) {
              answerCommentData[`${modelName}_general_comment`] = generalComment;
            }

            // Generate answer-specific comments
            const answerOptions = ['a', 'b', 'c', 'd', 'e'];
            for (const option of answerOptions) {
              try {
                const answerComment = await generateAnswerCommentary(question, modelName, option);
                if (answerComment) {
                  answerCommentData[`${modelName}_comment_${option}`] = answerComment;
                }
              } catch (error) {
                console.error(`Error generating ${modelName} comment for option ${option}:`, error);
                // Continue with other options even if one fails
              }
            }
          } catch (error) {
            console.error(`Error generating commentary for ${modelName}:`, error);
            answerCommentData.processing_status = 'failed';
          }
        }

        // Insert or update answer comments
        try {
          const { error: insertError } = await supabase
            .from('ai_answer_comments')
            .upsert(answerCommentData);

          if (insertError) {
            console.error('Error inserting answer comments:', {
              error: insertError,
              message: insertError.message,
              details: insertError.details,
              hint: insertError.hint,
              code: insertError.code
            });
            throw insertError;
          }

          console.log(`Successfully inserted answer comments for question ${question.id}`);
        } catch (error) {
          console.error('Failed to insert answer comments:', error);
          throw error;
        }

        // Generate and insert summary using successful commentaries
        try {
          const successfulComments = [];
          
          // Collect successful general comments
          for (const modelName of enabledModels) {
            const generalComment = answerCommentData[`${modelName}_general_comment`];
            if (generalComment) {
              successfulComments.push(`${modelName.toUpperCase()} General: ${generalComment}`);
            }
          }

          if (successfulComments.length > 0) {
            const summaryData = await generateSummaryData(successfulComments, question);
            if (summaryData) {
              const { error: summaryError } = await supabase
                .from('ai_commentary_summaries')
                .upsert({
                  ...summaryData,
                  question_id: question.id
                });

              if (summaryError) {
                console.error('Error inserting summary:', summaryError);
              } else {
                console.log(`Successfully inserted summary for question ${question.id}`);
              }
            }
          }
        } catch (error) {
          console.error('Error generating summary:', error);
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
        console.error(`Error processing question ${question.id}:`, {
          error: error,
          message: error.message,
          stack: error.stack
        });
        
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
    console.error('Error in process-ai-commentary function:', {
      error: error,
      message: error.message,
      stack: error.stack
    });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Generate general commentary using real AI APIs
async function generateGeneralCommentary(question: Question, modelName: string): Promise<string> {
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

Please provide insightful general commentary about this question, including:
1. Key concepts being tested
2. Common mistakes students might make
3. Learning objectives
4. Study tips for this topic

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

// Generate answer-specific commentary
async function generateAnswerCommentary(question: Question, modelName: string, option: string): Promise<string> {
  const optionMap: { [key: string]: string } = {
    'a': question.option_a,
    'b': question.option_b,
    'c': question.option_c,
    'd': question.option_d,
    'e': question.option_e
  };

  const optionText = optionMap[option];
  const isCorrect = question.correct_answer.toLowerCase().includes(option.toLowerCase());

  const prompt = `Analyze this specific answer option for the multiple choice question:

Question: ${question.question}
Option ${option.toUpperCase()}: ${optionText}
This option is: ${isCorrect ? 'CORRECT' : 'INCORRECT'}
Correct Answer: ${question.correct_answer}

Please provide a brief commentary (50-100 words) explaining why this option is ${isCorrect ? 'correct' : 'incorrect'} and what concept it tests or misconception it represents.`;

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

// Generate unified summary data using GPT-4o-mini
async function generateSummaryData(commentaries: string[], question: Question): Promise<any> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OpenAI API key not configured for summary generation');
  }

  const summaryPrompt = `Based on the following AI commentaries about a ${question.subject} question, create a unified summary that synthesizes the key insights:

Question: ${question.question}
Correct Answer: ${question.correct_answer}

AI Commentaries:
${commentaries.join('\n\n')}

Please provide:
1. A concise unified general summary (150-250 words) that highlights the most important learning objectives and key concepts
2. Brief summaries for each answer option (30-50 words each) explaining why it's correct/incorrect
3. An analysis of model agreement and disagreement (100-150 words)`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert educational AI that creates unified summaries from multiple AI commentaries. Structure your response with clear sections for: GENERAL_SUMMARY, OPTION_A, OPTION_B, OPTION_C, OPTION_D, OPTION_E, MODEL_AGREEMENT.' },
        { role: 'user', content: summaryPrompt }
      ],
      max_tokens: 800,
      temperature: 0.5
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error for summary: ${response.status}`);
  }

  const data = await response.json();
  const summaryText = data.choices[0].message.content;

  // Parse the structured response
  const summaryData: any = {};
  
  // Extract sections using simple text parsing
  const generalMatch = summaryText.match(/GENERAL_SUMMARY[:\s]*(.*?)(?=OPTION_|$)/s);
  if (generalMatch) {
    summaryData.summary_general_comment = generalMatch[1].trim();
  }

  const optionMatches = {
    a: summaryText.match(/OPTION_A[:\s]*(.*?)(?=OPTION_|MODEL_|$)/s),
    b: summaryText.match(/OPTION_B[:\s]*(.*?)(?=OPTION_|MODEL_|$)/s),
    c: summaryText.match(/OPTION_C[:\s]*(.*?)(?=OPTION_|MODEL_|$)/s),
    d: summaryText.match(/OPTION_D[:\s]*(.*?)(?=OPTION_|MODEL_|$)/s),
    e: summaryText.match(/OPTION_E[:\s]*(.*?)(?=OPTION_|MODEL_|$)/s)
  };

  Object.entries(optionMatches).forEach(([option, match]) => {
    if (match) {
      summaryData[`summary_comment_${option}`] = match[1].trim();
    }
  });

  const agreementMatch = summaryText.match(/MODEL_AGREEMENT[:\s]*(.*?)$/s);
  if (agreementMatch) {
    summaryData.model_agreement_analysis = agreementMatch[1].trim();
  }

  return summaryData;
}

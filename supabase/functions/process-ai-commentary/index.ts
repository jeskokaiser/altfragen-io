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

  const startTime = Date.now();
  let cronLogId: string | null = null;

  try {
    console.log('AI Commentary processing started at', new Date().toISOString());

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body to check if this is a scheduled cron job
    let isScheduledRun = false;
    try {
      const body = await req.json();
      isScheduledRun = body?.scheduled === true;
    } catch {
      // Not a JSON request, treat as manual trigger
    }

    // Create cron log entry if this is a scheduled run
    if (isScheduledRun) {
      const { data: cronLog, error: cronLogError } = await supabase
        .from('ai_commentary_cron_logs')
        .insert({
          status: 'running',
          executed_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (!cronLogError && cronLog) {
        cronLogId = cronLog.id;
        console.log('Created cron log entry:', cronLogId);
      }
    }

    // Get AI commentary settings
    const { data: settings, error: settingsError } = await supabase
      .from('ai_commentary_settings')
      .select('*')
      .single();

    if (settingsError) {
      console.error('Error fetching settings:', settingsError);
      throw new Error('Settings not found');
    }

    const aiSettings: AICommentarySettings = {
      batch_size: settings.batch_size || 40,
      processing_delay_minutes: settings.processing_delay_minutes || 3,
      models_enabled: settings.models_enabled as { openai: boolean; claude: boolean; gemini: boolean; }
    };

    console.log('Settings loaded:', {
      batch_size: aiSettings.batch_size,
      delay: aiSettings.processing_delay_minutes,
      enabled_models: Object.entries(aiSettings.models_enabled).filter(([_, enabled]) => enabled).map(([model, _]) => model)
    });

    // Check if feature is enabled
    if (!settings.feature_enabled) {
      console.log('AI Commentary feature is disabled');
      const result = { message: 'AI Commentary feature is disabled', processed: 0 };
      
      if (cronLogId) {
        await supabase
          .from('ai_commentary_cron_logs')
          .update({
            status: 'skipped',
            questions_processed: 0,
            execution_time_ms: Date.now() - startTime,
            error_message: 'Feature disabled'
          })
          .eq('id', cronLogId);
      }
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate the delay threshold with optimized timing
    const delayThreshold = new Date();
    delayThreshold.setMinutes(delayThreshold.getMinutes() - aiSettings.processing_delay_minutes);

    // Get pending questions that are older than the delay threshold
    const { data: pendingQuestions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('ai_commentary_status', 'pending')
      .lt('ai_commentary_queued_at', delayThreshold.toISOString())
      .order('ai_commentary_queued_at', { ascending: true })
      .limit(aiSettings.batch_size);

    if (questionsError) {
      console.error('Error fetching pending questions:', questionsError);
      throw new Error('Failed to fetch questions');
    }

    const questionCount = pendingQuestions?.length || 0;
    console.log(`Found ${questionCount} questions to process (batch size: ${aiSettings.batch_size})`);

    if (questionCount === 0) {
      const result = { message: 'No questions to process', processed: 0 };
      
      if (cronLogId) {
        await supabase
          .from('ai_commentary_cron_logs')
          .update({
            status: 'completed',
            questions_processed: 0,
            execution_time_ms: Date.now() - startTime
          })
          .eq('id', cronLogId);
      }
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let processedCount = 0;
    let errorCount = 0;
    const enabledModels = Object.entries(aiSettings.models_enabled)
      .filter(([_, enabled]) => enabled)
      .map(([model, _]) => model);

    console.log('Enabled models:', enabledModels);

    // Process each question with improved error handling
    for (const question of pendingQuestions) {
      const questionStartTime = Date.now();
      
      try {
        // Update status to processing
        await supabase
          .from('questions')
          .update({ ai_commentary_status: 'processing' })
          .eq('id', question.id);

        console.log(`Processing question ${question.id} (${processedCount + 1}/${questionCount})`);

        // Generate answer-specific comments for each enabled model
        const answerComments: any = {
          question_id: question.id,
          processing_status: 'completed'
        };

        for (const modelName of enabledModels) {
          try {
            console.log(`Generating ${modelName} comments for question ${question.id}`);
            
            // Generate general comment
            const generalComment = await generateGeneralCommentary(question, modelName);
            if (generalComment) {
              answerComments[`${modelName}_general_comment`] = generalComment;
            }

            // Generate specific comments for each answer option
            const answerOptions = ['a', 'b', 'c', 'd', 'e'];
            for (const option of answerOptions) {
              const optionComment = await generateAnswerCommentary(question, option, modelName);
              if (optionComment) {
                answerComments[`${modelName}_comment_${option}`] = optionComment;
              }
            }

            // Add small delay between models to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
            
          } catch (error) {
            console.error(`Error generating ${modelName} commentary:`, error);
            answerComments[`${modelName}_general_comment`] = `Error: ${error.message}`;
          }
        }

        // Insert answer comments
        const { error: insertError } = await supabase
          .from('ai_answer_comments')
          .upsert(answerComments);

        if (insertError) {
          console.error('Error inserting answer comments:', insertError);
          throw insertError;
        }

        // Generate and insert comprehensive summary
        try {
          const summaryData = await generateComprehensiveSummary(question, answerComments, enabledModels);
          if (summaryData) {
            await supabase
              .from('ai_commentary_summaries')
              .upsert({
                question_id: question.id,
                ...summaryData
              });
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
        const questionTime = Date.now() - questionStartTime;
        console.log(`Successfully processed question ${question.id} in ${questionTime}ms`);

      } catch (error) {
        console.error(`Error processing question ${question.id}:`, error);
        errorCount++;
        
        // Update status to failed
        await supabase
          .from('questions')
          .update({ ai_commentary_status: 'failed' })
          .eq('id', question.id);
      }
    }

    const executionTime = Date.now() - startTime;
    const result = { 
      message: 'Processing completed',
      processed: processedCount,
      errors: errorCount,
      execution_time_ms: executionTime
    };

    // Update cron log if this was a scheduled run
    if (cronLogId) {
      await supabase
        .from('ai_commentary_cron_logs')
        .update({
          status: errorCount > 0 ? 'completed_with_errors' : 'completed',
          questions_processed: processedCount,
          execution_time_ms: executionTime,
          error_message: errorCount > 0 ? `${errorCount} questions failed` : null
        })
        .eq('id', cronLogId);
    }

    console.log(`AI Commentary processing completed. Processed: ${processedCount}, Errors: ${errorCount}, Time: ${executionTime}ms`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('Error in process-ai-commentary function:', error);
    
    // Update cron log with error if this was a scheduled run
    if (cronLogId) {
      try {
        await supabase
          .from('ai_commentary_cron_logs')
          .update({
            status: 'failed',
            execution_time_ms: executionTime,
            error_message: error.message
          })
          .eq('id', cronLogId);
      } catch (logError) {
        console.error('Failed to update cron log:', logError);
      }
    }
    
    return new Response(JSON.stringify({ 
      error: error.message,
      execution_time_ms: executionTime
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Generate general commentary about the question
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

Provide insightful general commentary about this question (150-250 words), including:
1. Key concepts being tested
2. Learning objectives
3. Real-world applications
4. Study tips for this topic`;

  return await callAIModel(modelName, prompt);
}

// Generate commentary specific to an answer option
async function generateAnswerCommentary(question: Question, option: string, modelName: string): Promise<string> {
  const optionText = question[`option_${option}` as keyof Question] as string;
  const isCorrect = question.correct_answer.toLowerCase() === option;
  
  const prompt = `Analyze this specific answer option for the given question:

Question: ${question.question}
Option ${option.toUpperCase()}: ${optionText}
This option is ${isCorrect ? 'CORRECT' : 'INCORRECT'}
Correct answer: ${question.correct_answer}

Provide specific commentary about why this option is ${isCorrect ? 'correct' : 'incorrect'} (50-100 words):
${isCorrect ? 
  '- Explain why this is the right answer\n- What knowledge/concept it demonstrates' : 
  '- Explain why this is wrong\n- What misconception it might represent\n- How to avoid this mistake'
}`;

  return await callAIModel(modelName, prompt);
}

// Generate comprehensive summary combining all model outputs
async function generateComprehensiveSummary(question: Question, answerComments: any, enabledModels: string[]): Promise<any> {
  const generalComments = enabledModels
    .map(model => answerComments[`${model}_general_comment`])
    .filter(comment => comment && !comment.startsWith('Error:'));

  if (generalComments.length === 0) {
    return null;
  }

  const summaryPrompt = `Based on the following AI commentaries about a ${question.subject} question, create a unified summary:

Question: ${question.question}
Correct Answer: ${question.correct_answer}

AI Commentaries:
${generalComments.map((c, i) => `Commentary ${i + 1}:\n${c}`).join('\n\n')}

Create a comprehensive summary with the following sections:
1. GENERAL_COMMENT: Unified summary highlighting key learning points (150-200 words)
2. LEARNING_OBJECTIVES: Main concepts students should understand
3. COMMON_MISTAKES: Typical errors and how to avoid them
4. STUDY_RECOMMENDATIONS: Specific study tips for this topic
5. MODEL_AGREEMENT: Brief analysis of consensus/differences between AI models`;

  try {
    const summaryText = await callOpenAI(summaryPrompt);
    
    // Parse the structured summary (simplified approach)
    return {
      summary_general_comment: summaryText,
      learning_objectives: extractSection(summaryText, 'LEARNING_OBJECTIVES'),
      common_mistakes_analysis: extractSection(summaryText, 'COMMON_MISTAKES'),
      study_recommendations: extractSection(summaryText, 'STUDY_RECOMMENDATIONS'),
      model_agreement_analysis: extractSection(summaryText, 'MODEL_AGREEMENT')
    };
  } catch (error) {
    console.error('Error generating comprehensive summary:', error);
    return null;
  }
}

// Extract sections from structured summary text
function extractSection(text: string, sectionName: string): string | null {
  const regex = new RegExp(`${sectionName}:([\\s\\S]*?)(?=\\n[A-Z_]+:|$)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : null;
}

// Route to appropriate AI model
async function callAIModel(modelName: string, prompt: string): Promise<string> {
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

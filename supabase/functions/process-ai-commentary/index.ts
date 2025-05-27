
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
        const enabledModels = Object.entries(aiSettings.models_enabled)
          .filter(([_, enabled]) => enabled)
          .map(([model, _]) => model);

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

          // Generate and insert summary
          try {
            const summary = await generateSummary(commentaries.map(c => c.commentary_text));
            if (summary) {
              await supabase
                .from('ai_commentary_summaries')
                .upsert({
                  question_id: question.id,
                  summary_text: summary
                });
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

// Mock function for generating commentary - replace with actual AI implementation
async function generateCommentary(question: Question, modelName: string): Promise<string> {
  // This is a placeholder - in a real implementation, you would call the actual AI service
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
4. Additional context or real-world applications`;

  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000));

  return `[${modelName.toUpperCase()}] This question tests understanding of ${question.subject} concepts. The correct answer is ${question.correct_answer}. Students should focus on understanding the underlying principles rather than memorizing facts. Common mistakes include confusing similar concepts and not reading all options carefully.`;
}

// Mock function for generating summary - replace with actual AI implementation
async function generateSummary(commentaries: string[]): Promise<string> {
  // This is a placeholder - in a real implementation, you would call the actual AI service
  await new Promise(resolve => setTimeout(resolve, 500));

  return `Summary of AI Analysis: Multiple AI models have analyzed this question and provided consistent insights about the key learning objectives and common student challenges. The question effectively tests important concepts and provides good learning opportunities.`;
}

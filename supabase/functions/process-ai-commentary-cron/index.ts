
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting AI commentary processing cron job');

    // Get current settings
    const { data: settings, error: settingsError } = await supabase
      .from('ai_commentary_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (settingsError || !settings) {
      console.error('Failed to get settings:', settingsError);
      return new Response(JSON.stringify({ error: 'Failed to get settings' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!settings.feature_enabled || !settings.auto_trigger_enabled) {
      console.log('AI commentary feature is disabled');
      return new Response(JSON.stringify({ message: 'Feature disabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Find questions that need processing (older than processing_delay_minutes)
    const delayMinutes = settings.processing_delay_minutes || 60;
    const cutoffTime = new Date(Date.now() - delayMinutes * 60 * 1000).toISOString();

    const { data: questionsToProcess, error: questionsError } = await supabase
      .from('questions')
      .select('id, question, option_a, option_b, option_c, option_d, option_e, correct_answer, comment, user_id')
      .eq('ai_commentary_status', 'pending')
      .lt('ai_commentary_queued_at', cutoffTime)
      .limit(settings.batch_size || 5);

    if (questionsError) {
      console.error('Failed to get questions:', questionsError);
      return new Response(JSON.stringify({ error: 'Failed to get questions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!questionsToProcess || questionsToProcess.length === 0) {
      console.log('No questions to process');
      return new Response(JSON.stringify({ message: 'No questions to process' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Processing ${questionsToProcess.length} questions`);

    // Process each question
    const results = [];
    for (const question of questionsToProcess) {
      try {
        // Check if user is premium
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_premium')
          .eq('id', question.user_id)
          .single();

        if (!profile?.is_premium) {
          console.log(`Skipping question ${question.id} - user not premium`);
          continue;
        }

        // Mark as processing
        await supabase
          .from('questions')
          .update({ ai_commentary_status: 'processing' })
          .eq('id', question.id);

        // Call the AI processing function
        const { data: processResult, error: processError } = await supabase.functions.invoke(
          'process-ai-commentary',
          { body: { question } }
        );

        if (processError) {
          console.error(`Failed to process question ${question.id}:`, processError);
          await supabase
            .from('questions')
            .update({ ai_commentary_status: 'failed' })
            .eq('id', question.id);
        } else {
          console.log(`Successfully processed question ${question.id}`);
          results.push({ questionId: question.id, status: 'success' });
        }
      } catch (error) {
        console.error(`Error processing question ${question.id}:`, error);
        await supabase
          .from('questions')
          .update({ ai_commentary_status: 'failed' })
          .eq('id', question.id);
      }
    }

    return new Response(JSON.stringify({ 
      message: `Processed ${results.length} questions`,
      results 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in process-ai-commentary-cron:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

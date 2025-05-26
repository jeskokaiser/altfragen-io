
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
    const { taskId } = await req.json();
    
    if (!taskId) {
      return new Response(
        JSON.stringify({ error: 'Missing taskId parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Attempting to fetch status from: https://api.altfragen.io/status/${taskId}`);
    
    const statusResponse = await fetch(`https://api.altfragen.io/status/${taskId}`);
    console.log(`Status check response from https://api.altfragen.io/status/${taskId}: ${statusResponse.status}`);
    
    if (!statusResponse.ok) {
      return new Response(
        JSON.stringify({ 
          error: 'Failed to check task status',
          status: statusResponse.status,
          statusText: statusResponse.statusText
        }),
        { status: statusResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const taskData = await statusResponse.json();
    console.log('Task status data:', JSON.stringify(taskData).substring(0, 200) + '...');

    // If task is completed, perform post-processing to fix university_id
    if (taskData.success && taskData.status === 'completed') {
      console.log('Task processing completed successfully');
      
      // Initialize Supabase client for post-processing
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Post-process questions to fix university_id assignment
      try {
        // Get questions that were just created (within the last few minutes) with university visibility but no university_id
        const { data: questionsToFix, error: fetchError } = await supabase
          .from('questions')
          .select('id, user_id, visibility')
          .eq('visibility', 'university')
          .is('university_id', null)
          .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()); // Last 10 minutes

        if (fetchError) {
          console.error('Error fetching questions to fix:', fetchError);
        } else if (questionsToFix && questionsToFix.length > 0) {
          console.log(`Found ${questionsToFix.length} questions to fix university_id for`);

          // Process each question
          for (const question of questionsToFix) {
            // Get user's university_id from profiles
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('university_id')
              .eq('id', question.user_id)
              .single();

            if (profileError) {
              console.error(`Error fetching profile for user ${question.user_id}:`, profileError);
              continue;
            }

            if (profile?.university_id) {
              // Update question with correct university_id
              const { error: updateError } = await supabase
                .from('questions')
                .update({ university_id: profile.university_id })
                .eq('id', question.id);

              if (updateError) {
                console.error(`Error updating question ${question.id}:`, updateError);
              } else {
                console.log(`Successfully updated question ${question.id} with university_id: ${profile.university_id}`);
              }
            } else {
              console.warn(`User ${question.user_id} has no university_id in profile`);
            }
          }
        }
      } catch (postProcessError) {
        console.error('Error during post-processing:', postProcessError);
        // Don't fail the main response if post-processing fails
      }
    }

    return new Response(
      JSON.stringify(taskData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error checking PDF status:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

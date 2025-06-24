import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Define interfaces for AI commentary outputs
interface CommentaryOutput {
  general_comment: string;
  comment_a: string;
  comment_b: string;
  comment_c: string;
  comment_d: string;
  comment_e: string;
}

interface ModelCommentProcessingResult extends CommentaryOutput {
  processing_status: 'completed' | 'failed';
}

interface AnswerCommentsMap {
  [model: string]: ModelCommentProcessingResult | undefined;
  openai?: ModelCommentProcessingResult;
  claude?: ModelCommentProcessingResult;
  gemini?: ModelCommentProcessingResult;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Rate limiting configuration
const RATE_LIMITS = {
  openai: { maxConcurrent: 5, delayMs: 100 },
  claude: { maxConcurrent: 2, delayMs: 500 },  // Grok 3 Mini (primary for claude)
  gemini: { maxConcurrent: 4, delayMs: 150 },   // Gemini 2.5 Pro (primary for gemini)
  grok: { maxConcurrent: 3, delayMs: 200 },     // Rate limit for Grok
  mistral: { maxConcurrent: 3, delayMs: 300 }   // Rate limit for Mistral fallback
};

// Timeout configuration (in milliseconds)
const API_TIMEOUT = 60000; // 60 seconds per API call
const GROK_TIMEOUT = 60000; // 60 seconds for Grok API

// Simple rate limiter implementation
class RateLimiter {
  private queue: Array<() => void> = [];
  private activeCount = 0;
  
  constructor(private maxConcurrent: number, private delayMs: number) {}
  
  async acquire(): Promise<void> {
    if (this.activeCount >= this.maxConcurrent) {
      await new Promise<void>(resolve => this.queue.push(resolve));
    }
    this.activeCount++;
    if (this.delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delayMs));
    }
  }
  
  release(): void {
    this.activeCount--;
    const next = this.queue.shift();
    if (next) next();
  }
}

// Create rate limiters for each model
const rateLimiters = {
  openai: new RateLimiter(RATE_LIMITS.openai.maxConcurrent, RATE_LIMITS.openai.delayMs),
  claude: new RateLimiter(RATE_LIMITS.claude.maxConcurrent, RATE_LIMITS.claude.delayMs),
  gemini: new RateLimiter(RATE_LIMITS.gemini.maxConcurrent, RATE_LIMITS.gemini.delayMs),
  grok: new RateLimiter(RATE_LIMITS.grok.maxConcurrent, RATE_LIMITS.grok.delayMs),
  mistral: new RateLimiter(RATE_LIMITS.mistral.maxConcurrent, RATE_LIMITS.mistral.delayMs)
};

// Helper function to add timeout to promises
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ]);
}

// Helper function to properly log Supabase errors
function logSupabaseError(context: string, error: any, additionalData?: any) {
  console.error(`${context}:`, {
    message: error?.message || 'Unknown error',
    details: error?.details || null,
    hint: error?.hint || null,
    code: error?.code || null,
    fullError: String(error)
  });
  if (additionalData) {
    console.error(`${context} - Additional Data:`, JSON.stringify(additionalData, null, 2));
  }
}

serve(async (req)=>{
  console.log('Edge Function Version: 2.0 - Enhanced Error Logging');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    console.log('AI Commentary processing started');
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);
    // Get AI commentary settings
    const { data: settings, error: settingsError } = await supabase.from('ai_commentary_settings').select('*').single();
    if (settingsError) {
      console.error('Error fetching settings:', settingsError);
      return new Response(JSON.stringify({
        error: 'Settings not found'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const aiSettings = {
      batch_size: settings.batch_size || 5,
      processing_delay_minutes: settings.processing_delay_minutes || 60,
      models_enabled: settings.models_enabled
    };
    console.log('Settings loaded:', aiSettings);
    // Check if feature is enabled
    if (!settings.feature_enabled) {
      console.log('AI Commentary feature is disabled');
      return new Response(JSON.stringify({
        message: 'AI Commentary feature is disabled',
        processed: 0
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Calculate the delay threshold
    const delayThreshold = new Date();
    delayThreshold.setMinutes(delayThreshold.getMinutes() - aiSettings.processing_delay_minutes);
    
    // Get question IDs that already have entries in ai_answer_comments
    const { data: existingComments, error: commentsError } = await supabase
      .from('ai_answer_comments')
      .select('question_id');
    
    if (commentsError) {
      console.error('Error fetching existing comments:', commentsError);
      return new Response(JSON.stringify({
        error: 'Failed to fetch existing comments'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Get question IDs that already have entries in ai_commentary_summaries
    const { data: existingSummaries, error: summariesError } = await supabase
      .from('ai_commentary_summaries')
      .select('question_id');
    
    if (summariesError) {
      console.error('Error fetching existing summaries:', summariesError);
      return new Response(JSON.stringify({
        error: 'Failed to fetch existing summaries'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Combine existing question IDs from both tables
    const existingQuestionIds = new Set([
      ...(existingComments?.map(item => item.question_id) || []),
      ...(existingSummaries?.map(item => item.question_id) || [])
    ]);
    
    console.log(`Found ${existingQuestionIds.size} questions that already have commentary or summaries`);
    
    // Get pending questions that are older than the delay threshold
    // We'll filter out existing ones after fetching to avoid URL length issues
    const { data: allPendingQuestions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('ai_commentary_status', 'pending')
      .lt('ai_commentary_queued_at', delayThreshold.toISOString())
      .limit(aiSettings.batch_size * 3); // Fetch more to account for filtering
    
    if (questionsError) {
      console.error('Error fetching pending questions:', questionsError);
      return new Response(JSON.stringify({
        error: 'Failed to fetch questions'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Filter out questions that already have commentary or summaries
    const pendingQuestions = (allPendingQuestions || [])
      .filter(question => !existingQuestionIds.has(question.id))
      .slice(0, aiSettings.batch_size); // Limit to the actual batch size
    
         console.log(`Filtered down to ${pendingQuestions.length} questions that need processing`);
    console.log(`Found ${pendingQuestions?.length || 0} questions to process`);
    if (!pendingQuestions || pendingQuestions.length === 0) {
      return new Response(JSON.stringify({
        message: 'No questions to process',
        processed: 0
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    let processedCount = 0;
    const enabledModels = Object.entries(aiSettings.models_enabled).filter(([_, enabled])=>enabled).map(([model, _])=>model);
    console.log('Enabled models:', enabledModels);
    
    // Configure concurrent processing
    const MAX_CONCURRENT_QUESTIONS = 3; // Process up to 3 questions at the same time
    const questionBatches: typeof pendingQuestions[] = [];
    
    // Split questions into batches for controlled concurrent processing
    for (let i = 0; i < pendingQuestions.length; i += MAX_CONCURRENT_QUESTIONS) {
      questionBatches.push(pendingQuestions.slice(i, i + MAX_CONCURRENT_QUESTIONS));
    }
    
    console.log(`Processing ${pendingQuestions.length} questions in ${questionBatches.length} batches`);
    
    const allResults: PromiseSettledResult<{ success: boolean; questionId: string; error?: string }>[] = [];
    
    // Process batches sequentially, but questions within each batch in parallel
    for (const [batchIndex, batch] of questionBatches.entries()) {
      console.log(`Processing batch ${batchIndex + 1} of ${questionBatches.length} (${batch.length} questions)`);
      
      // Process all questions in current batch in parallel
      const batchResults = await Promise.allSettled(
        batch.map(async (question) => {
          try {
            // Update status to processing
            await supabase.from('questions').update({
              ai_commentary_status: 'processing'
            }).eq('id', question.id);
            
            console.log(`Processing question ${question.id}`);
            
            // Generate commentaries for all enabled models in parallel
            const modelPromises = enabledModels.map(async (modelName) => {
              try {
                const commentary = await generateCommentary(question, modelName);
                return {
                  modelName,
                  commentary: commentary ? {
                    ...commentary,
                    processing_status: 'completed'
                  } : null
                };
              } catch (error) {
                console.error(`Error generating commentary for ${modelName}:`, error);
                return {
                  modelName,
                  commentary: {
                    general_comment: `Fehler: ${error.message}`,
                    comment_a: `Fehler: ${error.message}`,
                    comment_b: `Fehler: ${error.message}`,
                    comment_c: `Fehler: ${error.message}`,
                    comment_d: `Fehler: ${error.message}`,
                    comment_e: `Fehler: ${error.message}`,
                    processing_status: 'failed'
                  }
                };
              }
            });
            
            // Wait for all model commentaries to complete
            const modelResults = await Promise.all(modelPromises);
            
            // Convert results to AnswerCommentsMap
            const answerComments: AnswerCommentsMap = {};
            modelResults.forEach(({ modelName, commentary }) => {
              if (commentary) {
                answerComments[modelName] = commentary;
              }
            });
            
            // Insert answer comments to database
            if (Object.keys(answerComments).length > 0) {
              console.log(`Preparing to insert comments for question ${question.id}`);
              
              // Prepare data for insertion with separate columns for each model and answer
              const insertData = {
                question_id: question.id,
                // General comments
                openai_general_comment: answerComments.openai?.general_comment || null,
                claude_general_comment: answerComments.claude?.general_comment || null,
                gemini_general_comment: answerComments.gemini?.general_comment || null,
                // OpenAI comments
                openai_comment_a: answerComments.openai?.comment_a || null,
                openai_comment_b: answerComments.openai?.comment_b || null,
                openai_comment_c: answerComments.openai?.comment_c || null,
                openai_comment_d: answerComments.openai?.comment_d || null,
                openai_comment_e: answerComments.openai?.comment_e || null,
                // Claude comments
                claude_comment_a: answerComments.claude?.comment_a || null,
                claude_comment_b: answerComments.claude?.comment_b || null,
                claude_comment_c: answerComments.claude?.comment_c || null,
                claude_comment_d: answerComments.claude?.comment_d || null,
                claude_comment_e: answerComments.claude?.comment_e || null,
                // Gemini comments
                gemini_comment_a: answerComments.gemini?.comment_a || null,
                gemini_comment_b: answerComments.gemini?.comment_b || null,
                gemini_comment_c: answerComments.gemini?.comment_c || null,
                gemini_comment_d: answerComments.gemini?.comment_d || null,
                gemini_comment_e: answerComments.gemini?.comment_e || null,
                processing_status: 'completed'
              };
              
              // Generate and insert summary in parallel with the main insert
              const summaryPromise = (async () => {
                try {
                  const successfulCommentaries: AnswerCommentsMap = Object.entries(answerComments)
                    .filter(([, modelResult]) => modelResult?.processing_status === 'completed')
                    .reduce((acc, [modelName, modelResult]) => {
                      if (modelResult) { 
                        acc[modelName] = modelResult;
                      }
                      return acc;
                    }, {} as AnswerCommentsMap);
                  
                  if (Object.keys(successfulCommentaries).length > 0) {
                    const summary = await generateSummary(successfulCommentaries, question);
                    if (summary) {
                      const { error: summaryError } = await supabase.from('ai_commentary_summaries').upsert({
                        question_id: question.id,
                        summary_general_comment: summary.general_comment,
                        summary_comment_a: summary.comment_a,
                        summary_comment_b: summary.comment_b,
                        summary_comment_c: summary.comment_c,
                        summary_comment_d: summary.comment_d,
                        summary_comment_e: summary.comment_e
                      });
                      if (summaryError) {
                        logSupabaseError('Error inserting summary', summaryError, {
                          question_id: question.id,
                          summary
                        });
                      }
                    }
                  }
                } catch (error) {
                  console.error('Error generating summary:', error);
                }
              })();
              
              // Wait for both main insert and summary to complete
              await Promise.all([
                (async () => {
                  const { error: insertError } = await supabase.from('ai_answer_comments').upsert(insertData);
                  if (insertError) {
                    logSupabaseError('Error inserting answer comments', insertError, insertData);
                    throw insertError;
                  }
                })(),
                summaryPromise
              ]);
            }
            
            // Update status to completed
            await supabase.from('questions').update({
              ai_commentary_status: 'completed',
              ai_commentary_processed_at: new Date().toISOString()
            }).eq('id', question.id);
            
            console.log(`Successfully processed question ${question.id}`);
            return { success: true, questionId: question.id };
            
          } catch (error) {
            console.error(`Error processing question ${question.id}:`, error);
            // Update status to failed
            await supabase.from('questions').update({
              ai_commentary_status: 'failed'
            }).eq('id', question.id);
            return { success: false, questionId: question.id, error: error.message };
          }
        })
      );
      
      allResults.push(...batchResults);
      
      // Log batch completion
      const batchSuccessCount = batchResults.filter(
        result => result.status === 'fulfilled' && result.value?.success
      ).length;
      console.log(`Batch ${batchIndex + 1} completed: ${batchSuccessCount}/${batch.length} successful`);
    }
    
    // Count total successful processes
    processedCount = allResults.filter(
      result => result.status === 'fulfilled' && result.value?.success
    ).length;
    
    console.log(`AI Commentary processing completed. Processed: ${processedCount} out of ${pendingQuestions.length}`);
    return new Response(JSON.stringify({
      message: 'Processing completed',
      processed: processedCount
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in process-ai-commentary function:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
// Generate commentary using real AI APIs
async function generateCommentary(question, modelName) {
  const prompt = `Analysiere diese Multiple-Choice-Frage und erstelle kurze Kommentare für jede Antwortmöglichkeit:

Frage: ${question.question}
A) ${question.option_a}
B) ${question.option_b}
C) ${question.option_c}
D) ${question.option_d}
E) ${question.option_e}

Richtige Antwort aus Gedächtnisprotokoll: ${question.correct_answer}
Fachbereich: ${question.subject}
Kommentar aus Gedächtnisprotokoll: ${question.comment}

  Erstelle:
1. Einen allgemeinen Kommentar zur Frage (max. 100 Wörter), der folgende Fragen beantwortet:
   - Was ist der Kerninhalt der Frage? Gib eine kurze, auf den Punkt gebrachte Übersicht.
   - Ist die protokollierte Lösung korrekt? Analysiere kritisch und wähle im Zweifel eine andere Antwort, wenn diese deutlich besser passt.
   - Warum ist die richtige Antwort korrekt?
   - Warum sind die anderen Antworten falsch?

2. Für jede Antwortmöglichkeit (A-E) einen kurzen, prägnanten Kommentar (max. 50 Wörter), der spezifisch erklärt warum diese Antwort richtig oder falsch ist.`;
  
  const modelKey = modelName.toLowerCase();
  const rateLimiter = rateLimiters[modelKey];
  
  if (!rateLimiter) {
    throw new Error(`No rate limiter configured for model: ${modelName}`);
  }
  
  // Acquire rate limit slot
  await rateLimiter.acquire();
  
  try {
    let result;
    switch(modelKey){
      case 'openai':
        result = await withTimeout(
          callOpenAI(prompt),
          API_TIMEOUT,
          'OpenAI API timeout after 30 seconds'
        );
        break;
      case 'claude':
        try {
          result = await withTimeout(
            callGrok(prompt),
            GROK_TIMEOUT,
            `Grok API timeout after ${GROK_TIMEOUT / 1000} seconds`
          );
        } catch (grokError) {
          console.log('Grok failed, falling back to Magistral Small 2506...');
          try {
            result = await withTimeout(
              callMistral(prompt),
              API_TIMEOUT,
              `Mistral API timeout after ${API_TIMEOUT / 1000} seconds`
            );
            console.log('Successfully used Magistral Small 2506 as fallback for Grok (data will be saved in claude_* fields)');
          } catch (mistralError) {
            console.error('Mistral fallback also failed:', mistralError);
            throw new Error(`Both Grok and Magistral failed. Grok: ${grokError.message}, Magistral: ${mistralError.message}`);
          }
        }
        break;
      case 'gemini':
        try {
          result = await withTimeout(
            callGemini(prompt),
            API_TIMEOUT,
            'Gemini API timeout after 30 seconds'
          );
        } catch (geminiError) {
          // Check if it's a quota error based on the exact Gemini API error structure
          const errorMessage = geminiError.message || '';
          const isQuotaError = errorMessage.includes('429') || 
                              errorMessage.toLowerCase().includes('exceeded your current quota') ||
                              errorMessage.toLowerCase().includes('resource_exhausted') ||
                              errorMessage.toLowerCase().includes('quotafailure') ||
                              errorMessage.toLowerCase().includes('generaterequestsperday');
          
          if (isQuotaError) {
            console.log('Gemini 2.5 Pro quota exceeded, falling back to Gemini 2.5 Flash...');
            
            // Try Gemini 2.5 Flash as fallback
            try {
              result = await withTimeout(
                callGeminiFlash(prompt),
                API_TIMEOUT,
                `Gemini Flash API timeout after ${API_TIMEOUT / 1000} seconds`
              );
              console.log('Successfully used Gemini 2.5 Flash as fallback (data will be saved in gemini_* fields)');
            } catch (flashError) {
              console.error('Gemini Flash fallback also failed:', flashError);
              throw new Error(`Both Gemini Pro and Flash failed. Pro: ${geminiError.message}, Flash: ${flashError.message}`);
            }
          } else {
            // If it's not a quota error, throw the original error
            throw geminiError;
          }
        }
        break;
      default:
        throw new Error(`Unknown model: ${modelName}`);
    }
    return result;
  } finally {
    // Always release the rate limit slot
    rateLimiter.release();
  }
}
// OpenAI API call
async function callOpenAI(prompt) {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'o4-mini',
      messages: [
        {
          role: 'system',
          content: 'Du bist ein Experte für medizinische Prüfungsfragen, der strukturierte Kommentare zu Antwortmöglichkeiten auf Deutsch abgibt. Antworte immer auf Deutsch im JSON-Format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "answer_comments",
          schema: {
            type: "object",
            properties: {
              general_comment: {
                type: "string",
                description: "Allgemeiner Kommentar zur Frage (max. 100 Wörter)"
              },
              comment_a: {
                type: "string",
                description: "Kurzer Kommentar zu Antwort A (max. 50 Wörter)"
              },
              comment_b: {
                type: "string",
                description: "Kurzer Kommentar zu Antwort B (max. 50 Wörter)"
              },
              comment_c: {
                type: "string",
                description: "Kurzer Kommentar zu Antwort C (max. 50 Wörter)"
              },
              comment_d: {
                type: "string",
                description: "Kurzer Kommentar zu Antwort D (max. 50 Wörter)"
              },
              comment_e: {
                type: "string",
                description: "Kurzer Kommentar zu Antwort E (max. 50 Wörter)"
              }
            },
            required: ["general_comment", "comment_a", "comment_b", "comment_c", "comment_d", "comment_e"],
            additionalProperties: false
          }
        }
      }
    })
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`OpenAI API error: ${response.status} - ${errorText}`);
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

// Gemini 2.5 Pro API call (Primary)
async function callGemini(prompt) {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  const geminiSchema = {
    type: "object",
    properties: {
      general_comment: {
        type: "string",
        description: "Allgemeiner Kommentar zur Frage (max. 100 Wörter)"
      },
      comment_a: {
        type: "string",
        description: "Kurzer Kommentar zu Antwort A (max. 50 Wörter)"
      },
      comment_b: {
        type: "string",
        description: "Kurzer Kommentar zu Antwort B (max. 50 Wörter)"
      },
      comment_c: {
        type: "string",
        description: "Kurzer Kommentar zu Antwort C (max. 50 Wörter)"
      },
      comment_d: {
        type: "string",
        description: "Kurzer Kommentar zu Antwort D (max. 50 Wörter)"
      },
      comment_e: {
        type: "string",
        description: "Kurzer Kommentar zu Antwort E (max. 50 Wörter)"
      }
    },
    required: ["general_comment", "comment_a", "comment_b", "comment_c", "comment_d", "comment_e"]
  };

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `Du bist ein Experte für medizinische Prüfungsfragen. Antworte immer auf Deutsch.
Deine Ausgabe muss ein String sein, der ein valides JSON-Objekt darstellt und dem Schema entspricht.
Achte besonders darauf, dass alle Strings innerhalb des JSON (z.B. Kommentare) korrekt JSON-escaped sind (z.B. Zeilenumbrüche als \\n, Anführungszeichen als \\").

${prompt}`
            }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: 5500,
        temperature: 0.7,
        responseMimeType: "application/json",
        response_schema: geminiSchema
      }
    })
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Gemini API error: ${response.status} - ${errorText}`);
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }
  const data = await response.json();

  // Add robust checks for the response structure
  if (!data.candidates || data.candidates.length === 0) {
    console.error('Gemini API Error: No candidates found in response', JSON.stringify(data, null, 2));
    throw new Error('Gemini API Error: No candidates found in response');
  }
  const candidate = data.candidates[0];
  if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
    console.error('Gemini API Error: No content parts found in candidate', JSON.stringify(data, null, 2));
    throw new Error('Gemini API Error: No content parts found in candidate');
  }
  if (!candidate.content.parts[0].text) {
    console.error('Gemini API Error: No text found in the first part of the candidate', JSON.stringify(data, null, 2));
    throw new Error('Gemini API Error: No text found in the first part of the candidate');
  }

  return JSON.parse(candidate.content.parts[0].text);
}
// Gemini 2.5 Flash API call (Fallback for Gemini Pro)
async function callGeminiFlash(prompt) {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  const geminiSchema = {
    type: "object",
    properties: {
      general_comment: {
        type: "string",
        description: "Allgemeiner Kommentar zur Frage (max. 100 Wörter)"
      },
      comment_a: {
        type: "string",
        description: "Kurzer Kommentar zu Antwort A (max. 50 Wörter)"
      },
      comment_b: {
        type: "string",
        description: "Kurzer Kommentar zu Antwort B (max. 50 Wörter)"
      },
      comment_c: {
        type: "string",
        description: "Kurzer Kommentar zu Antwort C (max. 50 Wörter)"
      },
      comment_d: {
        type: "string",
        description: "Kurzer Kommentar zu Antwort D (max. 50 Wörter)"
      },
      comment_e: {
        type: "string",
        description: "Kurzer Kommentar zu Antwort E (max. 50 Wörter)"
      }
    },
    required: ["general_comment", "comment_a", "comment_b", "comment_c", "comment_d", "comment_e"]
  };

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `Du bist ein Experte für medizinische Prüfungsfragen. Antworte immer auf Deutsch.
Deine Ausgabe muss ein String sein, der ein valides JSON-Objekt darstellt und dem Schema entspricht.
Achte besonders darauf, dass alle Strings innerhalb des JSON (z.B. Kommentare) korrekt JSON-escaped sind (z.B. Zeilenumbrüche als \\n, Anführungszeichen als \\").

${prompt}`
            }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: 5500,
        temperature: 0.7,
        responseMimeType: "application/json",
        response_schema: geminiSchema
      }
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Gemini Flash API error: ${response.status} - ${errorText}`);
    throw new Error(`Gemini Flash API error: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();

  // Add robust checks for the response structure
  if (!data.candidates || data.candidates.length === 0) {
    console.error('Gemini Flash API Error: No candidates found in response', JSON.stringify(data, null, 2));
    throw new Error('Gemini Flash API Error: No candidates found in response');
  }
  const candidate = data.candidates[0];
  if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
    console.error('Gemini Flash API Error: No content parts found in candidate', JSON.stringify(data, null, 2));
    throw new Error('Gemini Flash API Error: No content parts found in candidate');
  }
  if (!candidate.content.parts[0].text) {
    console.error('Gemini Flash API Error: No text found in the first part of the candidate', JSON.stringify(data, null, 2));
    throw new Error('Gemini Flash API Error: No text found in the first part of the candidate');
  }

  return JSON.parse(candidate.content.parts[0].text);
}
// Mistral Magistral Small API call - Fallback for Grok
// Uses the new small reasoning model optimized for medical Q&A
async function callMistral(prompt) {
  const apiKey = Deno.env.get('MISTRAL_API_KEY');
  if (!apiKey) {
    throw new Error('Mistral API key not configured');
  }

  // Acquire rate limit slot
  const rateLimiter = rateLimiters.mistral;
  await rateLimiter.acquire();
  
  try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'magistral-small-2506',  // Small reasoning model optimized for medical Q&A
      messages: [
        {
          role: 'system',
          content: `Du bist ein Experte für medizinische Prüfungsfragen, der strukturierte Kommentare zu Antwortmöglichkeiten auf Deutsch abgibt. 

Antworte IMMER im folgenden JSON-Format:
{
  "general_comment": "Allgemeiner Kommentar zur Frage (max. 100 Wörter)",
  "comment_a": "Kurzer Kommentar zu Antwort A (max. 50 Wörter)",
  "comment_b": "Kurzer Kommentar zu Antwort B (max. 50 Wörter)",
  "comment_c": "Kurzer Kommentar zu Antwort C (max. 50 Wörter)",
  "comment_d": "Kurzer Kommentar zu Antwort D (max. 50 Wörter)",
  "comment_e": "Kurzer Kommentar zu Antwort E (max. 50 Wörter)"
}

Alle Kommentare müssen auf Deutsch sein. Die JSON-Struktur muss genau eingehalten werden.`
        },
        {
          role: 'user',
          content: prompt + '\n\nBitte antworte nur mit dem JSON-Objekt, ohne zusätzlichen Text oder Markdown-Formatierung.'
        }
      ],
      temperature: 0.7,
      max_tokens: 4096,
      stream: false
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Mistral API error: ${response.status} - ${errorText}`);
    throw new Error(`Mistral API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  // Check if we have the expected response structure
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    console.error('Unexpected Mistral response structure:', data);
    throw new Error('Unexpected Mistral response structure');
  }
  
  // Parse the JSON response content
  try {
    let content = data.choices[0].message.content;
    
    // Remove markdown code block formatting if present
    if (content.includes('```json')) {
      content = content.replace(/```json\s*\n?/g, '').replace(/```\s*$/g, '').trim();
    }
    
    const parsedContent = JSON.parse(content);
    
    // Ensure all required fields are present
    const requiredFields = ['general_comment', 'comment_a', 'comment_b', 'comment_c', 'comment_d', 'comment_e'];
    
    for (const field of requiredFields) {
      if (!parsedContent[field]) {
        parsedContent[field] = 'Keine Bewertung verfügbar.';
      }
    }
    
    return parsedContent;
  } catch (parseError) {
    console.error('Failed to parse Mistral response:', parseError);
    throw new Error('Failed to parse Mistral response as JSON');
  }
  } finally {
    // Always release the rate limit slot
    rateLimiter.release();
  }
}
// Grok 3 Mini API call (xAI) - Fallback for Gemini
// Uses the new reasoning model with 'low' effort for efficient commentary generation
// Supports two configurations:
// 1. Direct xAI API: Set GROK_API_KEY with xAI API key
// 2. OpenRouter proxy: Set GROK_API_KEY and OPENROUTER_API_KEY (more reliable)
async function callGrok(prompt) {
  const apiKey = Deno.env.get('GROK_API_KEY');
  if (!apiKey) {
    throw new Error('Grok API key not configured');
  }

  // Acquire rate limit slot
  const rateLimiter = rateLimiters.grok;
  await rateLimiter.acquire();
  
  try {
    // Use OpenRouter as proxy for xAI Grok (more reliable availability)
  const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
  const useOpenRouter = !!openRouterKey; // Use OpenRouter if key is available
  
  const response = await fetch(
    useOpenRouter 
      ? 'https://openrouter.ai/api/v1/chat/completions'
      : 'https://api.x.ai/v1/chat/completions', 
    {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${useOpenRouter ? openRouterKey : apiKey}`,
      'Content-Type': 'application/json',
      ...(useOpenRouter && { 
        'HTTP-Referer': 'https://altfragen.com',
        'X-Title': 'AltFragen AI Commentary'
      })
    },
    body: JSON.stringify({
      model: useOpenRouter ? 'x-ai/grok-3-mini' : 'grok-3-mini',
      messages: [
        {
          role: 'system',
          content: `Du bist ein Experte für medizinische Prüfungsfragen, der strukturierte Kommentare zu Antwortmöglichkeiten auf Deutsch abgibt. 

Antworte IMMER im folgenden JSON-Format:
{
  "general_comment": "Allgemeiner Kommentar zur Frage (max. 100 Wörter)",
  "comment_a": "Kurzer Kommentar zu Antwort A (max. 50 Wörter)",
  "comment_b": "Kurzer Kommentar zu Antwort B (max. 50 Wörter)",
  "comment_c": "Kurzer Kommentar zu Antwort C (max. 50 Wörter)",
  "comment_d": "Kurzer Kommentar zu Antwort D (max. 50 Wörter)",
  "comment_e": "Kurzer Kommentar zu Antwort E (max. 50 Wörter)"
}

Alle Kommentare müssen auf Deutsch sein. Die JSON-Struktur muss genau eingehalten werden.`
        },
        {
          role: 'user',
          content: prompt + '\n\nBitte antworte nur mit dem JSON-Objekt, ohne zusätzlichen Text oder Markdown-Formatierung.'
        }
      ],
      reasoning_effort: Deno.env.get('GROK_REASONING_EFFORT') || 'low',  // 'low' or 'high' - low for efficiency, high for complex cases
      temperature: 0.7,
      max_tokens: 4096,
      stream: false
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Grok API error: ${response.status} - ${errorText}`);
    throw new Error(`Grok API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  // Check if we have the expected response structure
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    console.error('Unexpected Grok response structure:', data);
    throw new Error('Unexpected Grok response structure');
  }
  
  // Parse the JSON response content
  try {
    const message = data.choices[0].message;
    let content = message.content;
    
    // Log reasoning content if available (Grok 3 Mini feature)
    if (message.reasoning_content) {
      console.log('Grok reasoning trace available (not logged for brevity)');
    }
    
    // Remove markdown code block formatting if present (similar to Deepseek)
    if (content.includes('```json')) {
      content = content.replace(/```json\s*\n?/g, '').replace(/```\s*$/g, '').trim();
    }
    
    const parsedContent = JSON.parse(content);
    
    // Ensure all required fields are present
    const requiredFields = ['general_comment', 'comment_a', 'comment_b', 'comment_c', 'comment_d', 'comment_e'];
    
    for (const field of requiredFields) {
      if (!parsedContent[field]) {
        parsedContent[field] = 'Keine Bewertung verfügbar.';
      }
    }
    
    return parsedContent;
  } catch (parseError) {
    console.error('Failed to parse Grok response:', parseError);
    throw new Error('Failed to parse Grok response as JSON');
  }
  } finally {
    // Always release the rate limit slot
    rateLimiter.release();
  }
}
// Generate unified summary using GPT-4.1-mini
async function generateSummary(commentaries, question) {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OpenAI API key not configured for summary generation');
  }
  
  const modelNames = Object.keys(commentaries);
  const generalComments = modelNames.map(model => `${model.toUpperCase()}: ${commentaries[model].general_comment}`).join('\n\n');
  const answerComments = ['a', 'b', 'c', 'd', 'e'].map(letter => {
    const comments = modelNames.map(model => `${model.toUpperCase()}: ${commentaries[model][`comment_${letter}`]}`).join('\n');
    return `Antwort ${letter.toUpperCase()}:\n${comments}`;
  }).join('\n\n');

  const summaryPrompt = `Basierend auf den folgenden KI-Kommentaren zu einer ${question.subject}-Frage, erstelle eine strukturierte Zusammenfassung mit Übereinstimmungsanalyse:

Frage: ${question.question}
Richtige Antwort: ${question.correct_answer}

ALLGEMEINE KOMMENTARE:
${generalComments}

ANTWORT-SPEZIFISCHE KOMMENTARE:
${answerComments}

Erstelle:
1. Einen allgemeinen Zusammenfassungskommentar (max. 150 Wörter), der die wichtigsten Erkenntnisse synthetisiert
2. Für jede Antwortmöglichkeit (A-E) einen kurzen Zusammenfassungskommentar (max. 50 Wörter)

Antworte auf Deutsch.`;
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4.1-nano',
      messages: [
        {
          role: 'system',
          content: 'Du bist eine Experten-KI für Bildung, die strukturierte Zusammenfassungen aus mehreren KI-Kommentaren erstellt. Antworte immer auf Deutsch im JSON-Format.'
        },
        {
          role: 'user',
          content: summaryPrompt
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "summary_comments",
          schema: {
            type: "object",
            properties: {
              general_comment: {
                type: "string",
                description: "Allgemeiner Zusammenfassungskommentar (max. 150 Wörter)"
              },
              comment_a: {
                type: "string",
                description: "Zusammenfassungskommentar zu Antwort A (max. 50 Wörter)"
              },
              comment_b: {
                type: "string",
                description: "Zusammenfassungskommentar zu Antwort B (max. 50 Wörter)"
              },
              comment_c: {
                type: "string",
                description: "Zusammenfassungskommentar zu Antwort C (max. 50 Wörter)"
              },
              comment_d: {
                type: "string",
                description: "Zusammenfassungskommentar zu Antwort D (max. 50 Wörter)"
              },
              comment_e: {
                type: "string",
                description: "Zusammenfassungskommentar zu Antwort E (max. 50 Wörter)"
              }
            },
            required: ["general_comment", "comment_a", "comment_b", "comment_c", "comment_d", "comment_e"],
            additionalProperties: false
          }
        }
      }
    })
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`OpenAI API error for summary: ${response.status} - ${errorText}`);
    throw new Error(`OpenAI API error for summary: ${response.status} - ${errorText}`);
  }
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}


import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReassignSubjectsRequest {
  examName: string;
  subjects: string[];
  universityId?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Reassign subjects function started');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user has admin role
    const { data: hasAdminRole } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!hasAdminRole) {
      return new Response(JSON.stringify({ error: 'Unauthorized - Admin role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: ReassignSubjectsRequest = await req.json();
    const { examName, subjects, universityId } = body;

    if (!examName || !subjects || subjects.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing required fields: examName and subjects' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing reassignment for exam: ${examName}, subjects: ${subjects.join(', ')}`);

    // Build query for fetching questions
    let query = supabase
      .from('questions')
      .select('id, question, exam_name, university_id')
      .eq('exam_name', examName);

    // Add university filter if provided
    if (universityId) {
      query = query.eq('university_id', universityId);
    }

    const { data: questions, error: questionsError } = await query;

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch questions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!questions || questions.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No questions found for the specified criteria',
        processed: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${questions.length} questions to process`);

    let processedCount = 0;
    const updates = [];

    // Process each question
    for (const question of questions) {
      try {
        // Use the same logic as the original assign-subjects function
        const assignedSubject = assignSubjectToQuestion(question.question, subjects);
        
        if (assignedSubject) {
          updates.push({
            id: question.id,
            subject: assignedSubject
          });
          processedCount++;
        }
      } catch (error) {
        console.error(`Error processing question ${question.id}:`, error);
      }
    }

    // Batch update questions
    if (updates.length > 0) {
      const { error: updateError } = await supabase
        .from('questions')
        .upsert(updates);

      if (updateError) {
        console.error('Error updating questions:', updateError);
        return new Response(JSON.stringify({ error: 'Failed to update questions' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    console.log(`Successfully processed ${processedCount} questions`);

    return new Response(JSON.stringify({
      message: 'Subject reassignment completed successfully',
      totalQuestions: questions.length,
      processed: processedCount,
      examName: examName
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in reassign-subjects function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Subject assignment logic (same as in assign-subjects function)
function assignSubjectToQuestion(questionText: string, subjects: string[]): string | null {
  const text = questionText.toLowerCase();
  
  // Define keywords for each potential subject
  const subjectKeywords: { [key: string]: string[] } = {
    'Anästhesie': ['anästhesie', 'anästhetikum', 'narkose', 'intubation', 'beatmung', 'relaxans', 'analgesie'],
    'Innere Medizin': ['kardiologie', 'pneumologie', 'gastroenterologie', 'nephrologie', 'endokrinologie', 'hämatologie', 'onkologie', 'rheumatologie'],
    'Chirurgie': ['operation', 'chirurgie', 'laparoskopie', 'endoskopie', 'resektion', 'anastomose', 'drainage'],
    'Neurologie': ['neurologie', 'epilepsie', 'parkinson', 'schlaganfall', 'meningitis', 'enzephalitis', 'neuropathie'],
    'Psychiatrie': ['psychiatrie', 'depression', 'schizophrenie', 'bipolar', 'angststörung', 'psychose', 'demenz'],
    'Pädiatrie': ['pädiatrie', 'kinder', 'säugling', 'neugeborene', 'entwicklung', 'impfung', 'wachstum'],
    'Gynäkologie': ['gynäkologie', 'schwangerschaft', 'geburt', 'menstruation', 'ovulation', 'kontrazeption', 'mammographie'],
    'Orthopädie': ['orthopädie', 'fraktur', 'luxation', 'arthrose', 'arthritis', 'wirbelsäule', 'gelenk'],
    'Radiologie': ['röntgen', 'ct', 'mrt', 'ultraschall', 'mammographie', 'angiographie', 'szintigraphie'],
    'Pathologie': ['pathologie', 'histologie', 'biopsie', 'tumor', 'metastase', 'dysplasie', 'nekrose'],
    'Pharmakologie': ['pharmakologie', 'medikament', 'dosierung', 'nebenwirkung', 'wechselwirkung', 'toxikologie'],
    'Mikrobiologie': ['bakterien', 'viren', 'pilze', 'parasiten', 'antibiotika', 'resistenz', 'infektion'],
    'Biochemie': ['biochemie', 'enzyme', 'hormone', 'stoffwechsel', 'protein', 'kohlenhydrate', 'lipide'],
    'Physiologie': ['physiologie', 'funktion', 'regulation', 'homeostase', 'kreislauf', 'atmung', 'verdauung']
  };

  // Score each subject based on keyword matches
  const subjectScores: { [key: string]: number } = {};
  
  for (const subject of subjects) {
    const keywords = subjectKeywords[subject] || [];
    let score = 0;
    
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        score += 1;
      }
    }
    
    if (score > 0) {
      subjectScores[subject] = score;
    }
  }

  // Return the subject with the highest score
  if (Object.keys(subjectScores).length > 0) {
    return Object.keys(subjectScores).reduce((a, b) => 
      subjectScores[a] > subjectScores[b] ? a : b
    );
  }

  // Fallback: return the first subject if no keywords match
  return subjects[0] || null;
}

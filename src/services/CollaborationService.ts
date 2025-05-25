
import { supabase } from '@/integrations/supabase/client';
import { ExamSession, SessionParticipant, DraftQuestion } from '@/types/ExamSession';
import { toast } from 'sonner';

// Create a new collaboration session
export const createCollaborationSession = async (
  title: string,
  description: string,
  subject: string,
  semester: string | null,
  year: string | null,
  userId: string,
  universityId: string | null
): Promise<ExamSession | null> => {
  try {
    const { data: session, error } = await supabase
      .from('exam_sessions')
      .insert({
        title,
        description,
        subject,
        semester,
        year,
        creator_id: userId,
        university_id: universityId,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;

    // Add creator as host
    await supabase
      .from('session_participants')
      .insert({
        session_id: session.id,
        user_id: userId,
        role: 'host'
      });

    // Log activity (simplified for now)
    console.log(`Session created: ${session.id} by ${userId}`);

    return session as ExamSession;
  } catch (error) {
    console.error('Error creating session:', error);
    toast.error('Failed to create session');
    return null;
  }
};

// Join a session
export const joinCollaborationSession = async (sessionId: string, userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('session_participants')
      .insert({
        session_id: sessionId,
        user_id: userId,
        role: 'participant'
      });

    if (error && error.code !== '23505') { // Ignore unique constraint violations
      throw error;
    }

    // Log activity (simplified for now)
    console.log(`User ${userId} joined session ${sessionId}`);

    return true;
  } catch (error) {
    console.error('Error joining session:', error);
    toast.error('Failed to join session');
    return false;
  }
};

// Add a question to the session
export const addQuestionToSession = async (
  sessionId: string,
  userId: string,
  questionData: {
    question: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    option_e: string;
    correct_answer: 'A' | 'B' | 'C' | 'D' | 'E';
    comment?: string;
    difficulty: number;
  }
): Promise<DraftQuestion | null> => {
  try {
    const { data, error } = await supabase
      .from('draft_questions')
      .insert({
        session_id: sessionId,
        creator_id: userId,
        ...questionData,
        status: 'draft'
      })
      .select()
      .single();

    if (error) throw error;

    // Log activity (simplified for now)
    console.log(`Question added to session ${sessionId} by ${userId}`);

    return data as DraftQuestion;
  } catch (error) {
    console.error('Error adding question:', error);
    toast.error('Failed to add question');
    return null;
  }
};

// Update question status
export const updateQuestionStatus = async (
  questionId: string,
  sessionId: string,
  userId: string,
  status: 'draft' | 'reviewed' | 'published'
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('draft_questions')
      .update({ status })
      .eq('id', questionId);

    if (error) throw error;

    // Log activity (simplified for now)
    console.log(`Question ${questionId} marked as ${status} by ${userId}`);

    return true;
  } catch (error) {
    console.error('Error updating question status:', error);
    return false;
  }
};

// Publish reviewed questions
export const publishSessionQuestions = async (
  sessionId: string,
  userId: string,
  universityId: string | null
): Promise<boolean> => {
  try {
    // Get session info
    const { data: session, error: sessionError } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError) throw sessionError;

    // Get reviewed questions
    const { data: questions, error: questionsError } = await supabase
      .from('draft_questions')
      .select('*')
      .eq('session_id', sessionId)
      .eq('status', 'reviewed');

    if (questionsError) throw questionsError;

    if (!questions || questions.length === 0) {
      toast.error('No reviewed questions to publish');
      return false;
    }

    // Insert into main questions table
    const questionsToInsert = questions.map(q => ({
      question: q.question,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      option_e: q.option_e,
      correct_answer: q.correct_answer,
      comment: q.comment || '',
      subject: session.subject,
      filename: `Collaboration-${session.title}`,
      difficulty: q.difficulty,
      visibility: universityId ? 'university' : 'private',
      exam_semester: session.semester,
      exam_year: session.year,
      user_id: userId,
      university_id: universityId
    }));

    const { error: insertError } = await supabase
      .from('questions')
      .insert(questionsToInsert);

    if (insertError) throw insertError;

    // Update draft questions status
    await supabase
      .from('draft_questions')
      .update({ status: 'published' })
      .eq('session_id', sessionId)
      .eq('status', 'reviewed');

    // Log activity (simplified for now)
    console.log(`Published ${questions.length} questions from session ${sessionId}`);

    toast.success(`Successfully published ${questions.length} questions!`);
    return true;
  } catch (error) {
    console.error('Error publishing questions:', error);
    toast.error('Failed to publish questions');
    return false;
  }
};

// Close session
export const closeCollaborationSession = async (sessionId: string, userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('exam_sessions')
      .update({ is_active: false })
      .eq('id', sessionId);

    if (error) throw error;

    // Log activity (simplified for now)
    console.log(`Session ${sessionId} closed by ${userId}`);

    return true;
  } catch (error) {
    console.error('Error closing session:', error);
    return false;
  }
};

// Real-time subscription setup
export const subscribeToSessionUpdates = (
  sessionId: string,
  onSessionUpdate: (session: ExamSession) => void,
  onParticipantUpdate: (participants: SessionParticipant[]) => void,
  onQuestionUpdate: (questions: DraftQuestion[]) => void
) => {
  const channels: any[] = [];

  // Subscribe to session changes
  const sessionChannel = supabase
    .channel(`session-${sessionId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'exam_sessions',
      filter: `id=eq.${sessionId}`
    }, (payload) => {
      if (payload.new) {
        onSessionUpdate(payload.new as ExamSession);
      }
    })
    .subscribe();

  // Subscribe to participants changes
  const participantsChannel = supabase
    .channel(`participants-${sessionId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'session_participants',
      filter: `session_id=eq.${sessionId}`
    }, async () => {
      // Refetch all participants
      const { data } = await supabase
        .from('session_participants')
        .select('*')
        .eq('session_id', sessionId);
      
      if (data) {
        onParticipantUpdate(data as SessionParticipant[]);
      }
    })
    .subscribe();

  // Subscribe to questions changes
  const questionsChannel = supabase
    .channel(`questions-${sessionId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'draft_questions',
      filter: `session_id=eq.${sessionId}`
    }, async () => {
      // Refetch all questions
      const { data } = await supabase
        .from('draft_questions')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });
      
      if (data) {
        onQuestionUpdate(data as DraftQuestion[]);
      }
    })
    .subscribe();

  channels.push(sessionChannel, participantsChannel, questionsChannel);

  // Return cleanup function
  return () => {
    channels.forEach(channel => supabase.removeChannel(channel));
  };
};

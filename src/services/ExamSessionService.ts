import { supabase } from '@/integrations/supabase/client';
import { ExamSession, SessionParticipant, DraftQuestion } from '@/types/ExamSession';
import { Question } from '@/types/Question';
import { toast } from 'sonner';

// Create a new exam session
export const createExamSession = async (
  title: string,
  description: string,
  subject: string,
  semester: string | null,
  year: string | null,
  userId: string,
  universityId: string | null
): Promise<ExamSession | null> => {
  try {
    const { data, error } = await supabase
      .from('exam_sessions')
      .insert({
        title,
        description,
        subject,
        semester,
        year,
        creator_id: userId,
        university_id: universityId
      })
      .select('*')
      .single();

    if (error) throw error;

    // Automatically add creator as a host
    if (data) {
      await addSessionParticipant(data.id, userId, 'host');
    }

    return data as ExamSession;
  } catch (error) {
    console.error('Error creating exam session:', error);
    return null;
  }
};

// Get all exam sessions for a user
export const getUserExamSessions = async (userId: string): Promise<ExamSession[]> => {
  try {
    const { data, error } = await supabase
      .from('session_participants')
      .select('session_id')
      .eq('user_id', userId);

    if (error) throw error;

    if (!data || data.length === 0) return [];

    const sessionIds = data.map(p => p.session_id);

    const { data: sessions, error: sessionsError } = await supabase
      .from('exam_sessions')
      .select('*')
      .in('id', sessionIds)
      .order('created_at', { ascending: false });

    if (sessionsError) throw sessionsError;

    return sessions as ExamSession[];
  } catch (error) {
    console.error('Error fetching user exam sessions:', error);
    return [];
  }
};

// Get all exam sessions - adding this function that was missing
export const fetchExamSessions = async (): Promise<ExamSession[]> => {
  try {
    const { data, error } = await supabase
      .from('exam_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as ExamSession[];
  } catch (error) {
    console.error('Error fetching exam sessions:', error);
    return [];
  }
};

// Get a single exam session by ID
export const getExamSessionById = async (sessionId: string): Promise<ExamSession | null> => {
  try {
    const { data, error } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) throw error;
    return data as ExamSession;
  } catch (error) {
    console.error('Error fetching exam session:', error);
    return null;
  }
};
// Alias for compatibility
export const fetchExamSessionById = getExamSessionById;

// Add a participant to a session
export const addSessionParticipant = async (
  sessionId: string, 
  userId: string, 
  role: 'host' | 'participant' = 'participant'
): Promise<SessionParticipant | null> => {
  try {
    const { data, error } = await supabase
      .from('session_participants')
      .insert({
        session_id: sessionId,
        user_id: userId,
        role
      })
      .select('*')
      .single();

    if (error) throw error;
    return data as SessionParticipant;
  } catch (error) {
    console.error('Error adding session participant:', error);
    return null;
  }
};

// Get all participants for a session
export const getSessionParticipants = async (sessionId: string): Promise<SessionParticipant[]> => {
  try {
    const { data, error } = await supabase
      .from('session_participants')
      .select('*')
      .eq('session_id', sessionId);

    if (error) throw error;
    return (data || []) as SessionParticipant[];
  } catch (error) {
    console.error('Error fetching session participants:', error);
    return [];
  }
};
// Alias for compatibility
export const fetchSessionParticipants = getSessionParticipants;

// Create a new draft question
export const createDraftQuestion = async (
  sessionId: string,
  creatorId: string,
  question: string,
  optionA: string,
  optionB: string,
  optionC: string,
  optionD: string,
  optionE: string,
  correctAnswer: 'A' | 'B' | 'C' | 'D' | 'E',
  comment: string = '',
  difficulty: number = 3
): Promise<DraftQuestion | null> => {
  try {
    const { data, error } = await supabase
      .from('draft_questions')
      .insert({
        session_id: sessionId,
        creator_id: creatorId,
        question,
        option_a: optionA,
        option_b: optionB,
        option_c: optionC,
        option_d: optionD,
        option_e: optionE,
        correct_answer: correctAnswer,
        comment,
        difficulty,
        status: 'draft' as const
      })
      .select('*')
      .single();

    if (error) throw error;
    return data as DraftQuestion;
  } catch (error) {
    console.error('Error creating draft question:', error);
    return null;
  }
};

// Update a draft question
export const updateDraftQuestion = async (
  questionId: string,
  updates: Partial<DraftQuestion>
): Promise<DraftQuestion | null> => {
  try {
    const { data, error } = await supabase
      .from('draft_questions')
      .update(updates)
      .eq('id', questionId)
      .select('*')
      .single();

    if (error) throw error;
    return data as DraftQuestion;
  } catch (error) {
    console.error('Error updating draft question:', error);
    return null;
  }
};

// Get all draft questions for a session
export const getSessionDraftQuestions = async (sessionId: string): Promise<DraftQuestion[]> => {
  try {
    const { data, error } = await supabase
      .from('draft_questions')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as DraftQuestion[];
  } catch (error) {
    console.error('Error fetching draft questions:', error);
    return [];
  }
};
// Alias for compatibility
export const fetchDraftQuestions = getSessionDraftQuestions;

// Publish draft questions to the main questions table
export const publishDraftQuestions = async (
  sessionId: string,
  universityId: string | null,
  userId: string
): Promise<boolean> => {
  try {
    // First, get all draft questions from the session
    const { data: draftQuestions, error: fetchError } = await supabase
      .from('draft_questions')
      .select('*')
      .eq('session_id', sessionId)
      .eq('status', 'reviewed');

    if (fetchError) throw fetchError;
    
    if (!draftQuestions || draftQuestions.length === 0) {
      toast.error('No reviewed questions to publish');
      return false;
    }
    
    // Get session data to use as metadata
    const { data: session, error: sessionError } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
      
    if (sessionError) throw sessionError;
    
    // Convert draft questions to the format expected by the questions table
    const questionsToInsert = draftQuestions.map(q => ({
      question: q.question,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      option_e: q.option_e,
      subject: session.subject,
      correct_answer: q.correct_answer,
      comment: q.comment || '',
      filename: `Collab-${session.title}`,
      difficulty: q.difficulty,
      visibility: universityId ? 'university' : 'private',
      semester: session.semester,
      year: session.year,
      user_id: userId,
      university_id: universityId
    }));
    
    // Insert the questions into the questions table - using individual inserts to avoid type issues
    for (const question of questionsToInsert) {
      const { error: insertError } = await supabase
        .from('questions')
        .insert(question);
        
      if (insertError) throw insertError;
    }
    
    // Update the status of the draft questions to 'published'
    const { error: updateError } = await supabase
      .from('draft_questions')
      .update({ status: 'published' })
      .eq('session_id', sessionId)
      .eq('status', 'reviewed');
      
    if (updateError) throw updateError;
    
    // Broadcast a publication event to all participants
    const channel = supabase.channel(`room_${sessionId}`);
    await channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.send({
          type: 'broadcast',
          event: 'questions_published',
          payload: {
            user_id: userId,
            count: questionsToInsert.length,
            timestamp: new Date().toISOString()
          }
        });
      }
    });
    
    toast.success(`${questionsToInsert.length} questions published successfully`);
    return true;
  } catch (error) {
    console.error('Error publishing draft questions:', error);
    toast.error('Failed to publish questions');
    return false;
  }
};

// Delete a draft question
export const deleteDraftQuestion = async (questionId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('draft_questions')
      .delete()
      .eq('id', questionId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting draft question:', error);
    return false;
  }
};

// Update a draft question's status
export const updateDraftQuestionStatus = async (
  questionId: string, 
  status: 'draft' | 'reviewed' | 'published'
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('draft_questions')
      .update({ status })
      .eq('id', questionId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating draft question status:', error);
    return false;
  }
};

// Close an exam session
export const closeExamSession = async (sessionId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('exam_sessions')
      .update({ is_active: false })
      .eq('id', sessionId);

    if (error) throw error;
    
    // Broadcast session closure to all participants
    const channel = supabase.channel(`room_${sessionId}`);
    await channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.send({
          type: 'broadcast',
          event: 'session_closed',
          payload: {
            timestamp: new Date().toISOString()
          }
        });
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error closing exam session:', error);
    return false;
  }
};

// Join a session as a participant
export const joinSession = async (sessionId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!data.user) throw new Error('User not authenticated');

    const { error: insertError } = await supabase
      .from('session_participants')
      .insert({
        session_id: sessionId,
        user_id: data.user.id,
        role: 'participant'
      });

    if (insertError) {
      if (insertError.code === '23505') { // Unique violation - user already in session
        return true;
      }
      throw insertError;
    }
    return true;
  } catch (error) {
    console.error('Error joining session:', error);
    return false;
  }
};

// Check if user is a host of a session
export const checkIsHost = async (sessionId: string, userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('session_participants')
      .select('role')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data.role === 'host';
  } catch (error) {
    console.error('Error checking host status:', error);
    return false;
  }
};

// Setup real-time subscriptions for a session
export const subscribeToSessionUpdates = (
  sessionId: string,
  onParticipantJoined: (participant: SessionParticipant) => void,
  onParticipantLeft: (participant: SessionParticipant) => void,
  onQuestionCreated: (question: DraftQuestion) => void,
  onQuestionUpdated: (question: DraftQuestion) => void,
  onQuestionDeleted: (question: DraftQuestion) => void
): (() => void) => {
  // Create a Supabase channel
  const channel = supabase
    .channel(`session-${sessionId}`)
    // Listen for participant changes
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'session_participants',
      filter: `session_id=eq.${sessionId}`
    }, (payload) => {
      onParticipantJoined(payload.new as SessionParticipant);
    })
    .on('postgres_changes', {
      event: 'DELETE',
      schema: 'public',
      table: 'session_participants',
      filter: `session_id=eq.${sessionId}`
    }, (payload) => {
      onParticipantLeft(payload.old as SessionParticipant);
    })
    // Listen for question changes
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'draft_questions',
      filter: `session_id=eq.${sessionId}`
    }, (payload) => {
      onQuestionCreated(payload.new as DraftQuestion);
    })
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'draft_questions',
      filter: `session_id=eq.${sessionId}`
    }, (payload) => {
      onQuestionUpdated(payload.new as DraftQuestion);
    })
    .on('postgres_changes', {
      event: 'DELETE',
      schema: 'public',
      table: 'draft_questions',
      filter: `session_id=eq.${sessionId}`
    }, (payload) => {
      onQuestionDeleted(payload.old as DraftQuestion);
    })
    .subscribe();

  // Set up a channel for custom events (e.g., typing indicators, cursor positions)
  const broadcastChannel = supabase.channel(`broadcast-${sessionId}`);
  
  broadcastChannel
    .on('broadcast', { event: 'typing' }, (payload) => {
      console.log('Someone is typing:', payload);
      // Handle typing indicators
    })
    .on('broadcast', { event: 'question_view' }, (payload) => {
      console.log('Someone is viewing a question:', payload);
      // Handle when someone is viewing a question
    })
    .on('broadcast', { event: 'questions_published' }, (payload) => {
      console.log('Questions published:', payload);
      // Handle when questions are published
      toast.info(`${payload.payload.count} questions were published`);
    })
    .on('broadcast', { event: 'session_closed' }, () => {
      console.log('Session closed');
      // Handle when the session is closed
      toast.info('This session has been closed by the host');
    })
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
    supabase.removeChannel(broadcastChannel);
  };
};

// Send a typing indicator when a user is creating or editing a question
export const sendTypingIndicator = async (
  sessionId: string, 
  userId: string, 
  questionId?: string
): Promise<void> => {
  try {
    const channel = supabase.channel(`broadcast-${sessionId}`);
    await channel.subscribe();
    
    // Send typing event
    await channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        user_id: userId,
        question_id: questionId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error sending typing indicator:', error);
  }
};

// Send a notification that a user is viewing a specific question
export const sendQuestionViewNotification = async (
  sessionId: string,
  userId: string,
  questionId: string
): Promise<void> => {
  try {
    const channel = supabase.channel(`broadcast-${sessionId}`);
    await channel.subscribe();
    
    // Send question view event
    await channel.send({
      type: 'broadcast',
      event: 'question_view',
      payload: {
        user_id: userId,
        question_id: questionId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error sending question view notification:', error);
  }
};

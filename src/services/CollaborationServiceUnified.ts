
import { supabase } from '@/integrations/supabase/client';
import { ExamSession, SessionParticipant, DraftQuestion } from '@/types/ExamSession';
import { toast } from 'sonner';

export class CollaborationServiceUnified {
  // Session management
  static async createSession(
    title: string,
    description: string,
    subject: string,
    semester: string | null,
    year: string | null,
    userId: string,
    universityId: string | null
  ): Promise<ExamSession | null> {
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

      toast.success('Session created successfully!');
      return session as ExamSession;
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create session');
      return null;
    }
  }

  static async getSession(sessionId: string): Promise<ExamSession | null> {
    try {
      const { data, error } = await supabase
        .from('exam_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      return data as ExamSession;
    } catch (error) {
      console.error('Error fetching session:', error);
      return null;
    }
  }

  static async getAllSessions(): Promise<ExamSession[]> {
    try {
      // Select only the columns needed for the sessions list
      const { data, error } = await supabase
        .from('exam_sessions')
        .select('id, title, description, creator_id, university_id, subject, semester, year, is_active, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ExamSession[];
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }
  }

  static async closeSession(sessionId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('exam_sessions')
        .update({ is_active: false })
        .eq('id', sessionId)
        .eq('creator_id', userId);

      if (error) throw error;
      toast.success('Session closed successfully');
      return true;
    } catch (error) {
      console.error('Error closing session:', error);
      toast.error('Failed to close session');
      return false;
    }
  }

  // Participant management
  static async joinSession(sessionId: string, userId: string): Promise<boolean> {
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

      toast.success('Joined session successfully!');
      return true;
    } catch (error) {
      console.error('Error joining session:', error);
      toast.error('Failed to join session');
      return false;
    }
  }

  static async getParticipants(sessionId: string): Promise<SessionParticipant[]> {
    try {
      const { data, error } = await supabase
        .from('session_participants')
        .select('*')
        .eq('session_id', sessionId);

      if (error) throw error;
      return data as SessionParticipant[];
    } catch (error) {
      console.error('Error fetching participants:', error);
      return [];
    }
  }

  static async checkParticipation(sessionId: string, userId: string): Promise<{ isParticipant: boolean; isHost: boolean }> {
    try {
      const { data, error } = await supabase
        .from('session_participants')
        .select('role')
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      return {
        isParticipant: !!data,
        isHost: data?.role === 'host'
      };
    } catch (error) {
      console.error('Error checking participation:', error);
      return { isParticipant: false, isHost: false };
    }
  }

  // Question management
  static async addQuestion(
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
  ): Promise<DraftQuestion | null> {
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
      toast.success('Question added successfully!');
      return data as DraftQuestion;
    } catch (error) {
      console.error('Error adding question:', error);
      toast.error('Failed to add question');
      return null;
    }
  }

  static async getQuestions(sessionId: string): Promise<DraftQuestion[]> {
    try {
      const { data, error } = await supabase
        .from('draft_questions')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DraftQuestion[];
    } catch (error) {
      console.error('Error fetching questions:', error);
      return [];
    }
  }

  static async updateQuestionStatus(
    questionId: string,
    status: 'draft' | 'reviewed' | 'published'
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('draft_questions')
        .update({ status })
        .eq('id', questionId);

      if (error) throw error;
      toast.success(`Question marked as ${status}`);
      return true;
    } catch (error) {
      console.error('Error updating question status:', error);
      toast.error('Failed to update question status');
      return false;
    }
  }

  static async publishQuestions(
    sessionId: string,
    userId: string,
    universityId: string | null
  ): Promise<boolean> {
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

      toast.success(`Successfully published ${questions.length} questions!`);
      return true;
    } catch (error) {
      console.error('Error publishing questions:', error);
      toast.error('Failed to publish questions');
      return false;
    }
  }

  // Real-time subscriptions
  static subscribeToSession(
    sessionId: string,
    callbacks: {
      onSessionUpdate?: (session: ExamSession) => void;
      onParticipantUpdate?: (participants: SessionParticipant[]) => void;
      onQuestionUpdate?: (questions: DraftQuestion[]) => void;
    }
  ) {
    const channels: any[] = [];

    // Subscribe to session changes
    if (callbacks.onSessionUpdate) {
      const sessionChannel = supabase
        .channel(`session-${sessionId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'exam_sessions',
          filter: `id=eq.${sessionId}`
        }, (payload) => {
          if (payload.new) {
            callbacks.onSessionUpdate!(payload.new as ExamSession);
          }
        })
        .subscribe();
      channels.push(sessionChannel);
    }

    // Subscribe to participants changes
    if (callbacks.onParticipantUpdate) {
      const participantsChannel = supabase
        .channel(`participants-${sessionId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'session_participants',
          filter: `session_id=eq.${sessionId}`
        }, async () => {
          const participants = await this.getParticipants(sessionId);
          callbacks.onParticipantUpdate!(participants);
        })
        .subscribe();
      channels.push(participantsChannel);
    }

    // Subscribe to questions changes
    if (callbacks.onQuestionUpdate) {
      const questionsChannel = supabase
        .channel(`questions-${sessionId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'draft_questions',
          filter: `session_id=eq.${sessionId}`
        }, async () => {
          const questions = await this.getQuestions(sessionId);
          callbacks.onQuestionUpdate!(questions);
        })
        .subscribe();
      channels.push(questionsChannel);
    }

    // Return cleanup function
    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }
}


import { useState, useEffect, useCallback } from 'react';
import { ExamSession, DraftQuestion, SessionParticipant } from '@/types/ExamSession';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SessionState {
  session: ExamSession | null;
  participants: SessionParticipant[];
  questions: DraftQuestion[];
  isHost: boolean;
  hasJoined: boolean;
  isLoading: boolean;
  error: string | null;
}

interface SessionStateActions {
  loadSessionData: () => Promise<void>;
  joinSession: () => Promise<boolean>;
  refreshData: () => Promise<void>;
}

export const useSessionState = (
  sessionId: string | undefined,
  userId: string | null
): [SessionState, SessionStateActions] => {
  const [state, setState] = useState<SessionState>({
    session: null,
    participants: [],
    questions: [],
    isHost: false,
    hasJoined: false,
    isLoading: true,
    error: null
  });

  const updateState = useCallback((updates: Partial<SessionState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const loadSessionData = useCallback(async () => {
    if (!sessionId || !userId) {
      updateState({ isLoading: false, error: 'Missing session ID or user ID' });
      return;
    }

    try {
      updateState({ isLoading: true, error: null });

      // Load session
      const { data: sessionData, error: sessionError } = await supabase
        .from('exam_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      // Check if user is participant
      const { data: participantData, error: participantError } = await supabase
        .from('session_participants')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .maybeSingle();

      if (participantError) throw participantError;

      const hasJoined = !!participantData;
      const isHost = participantData?.role === 'host';

      updateState({
        session: sessionData as ExamSession,
        hasJoined,
        isHost,
        isLoading: false
      });

      // Only load additional data if user has joined
      if (hasJoined) {
        await loadParticipantsAndQuestions();
      }

    } catch (error) {
      console.error('Error loading session data:', error);
      updateState({ 
        isLoading: false, 
        error: 'Failed to load session data' 
      });
      toast.error('Failed to load session data');
    }
  }, [sessionId, userId]);

  const loadParticipantsAndQuestions = useCallback(async () => {
    if (!sessionId) return;

    try {
      // Load participants
      const { data: participantsData, error: participantsError } = await supabase
        .from('session_participants')
        .select('*')
        .eq('session_id', sessionId);

      if (participantsError) throw participantsError;

      // Load questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('draft_questions')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (questionsError) throw questionsError;

      updateState({
        participants: participantsData as SessionParticipant[],
        questions: questionsData as DraftQuestion[]
      });

    } catch (error) {
      console.error('Error loading participants and questions:', error);
      toast.error('Failed to load session details');
    }
  }, [sessionId]);

  const joinSession = useCallback(async (): Promise<boolean> => {
    if (!sessionId || !userId) return false;

    try {
      const { error } = await supabase
        .from('session_participants')
        .insert({
          session_id: sessionId,
          user_id: userId,
          role: 'participant'
        });

      if (error && error.code !== '23505') { // Ignore duplicate key errors
        throw error;
      }

      // Reload session data after joining
      await loadSessionData();
      return true;

    } catch (error) {
      console.error('Error joining session:', error);
      toast.error('Failed to join session');
      return false;
    }
  }, [sessionId, userId, loadSessionData]);

  const refreshData = useCallback(async () => {
    await loadParticipantsAndQuestions();
  }, [loadParticipantsAndQuestions]);

  return [
    state,
    {
      loadSessionData,
      joinSession,
      refreshData
    }
  ];
};

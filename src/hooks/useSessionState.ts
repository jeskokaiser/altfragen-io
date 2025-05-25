
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

      // Load session first
      const { data: sessionData, error: sessionError } = await supabase
        .from('exam_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error('Session not found');
      }

      // Try to check participation status with better error handling
      let hasJoined = false;
      let isHost = false;
      let participantData = null;

      try {
        const { data, error: participantError } = await supabase
          .from('session_participants')
          .select('*')
          .eq('session_id', sessionId)
          .eq('user_id', userId)
          .maybeSingle();

        // If we get an RLS error, assume user is not a participant yet
        if (participantError) {
          console.warn('Participant check failed (likely RLS):', participantError);
          hasJoined = false;
          isHost = false;
        } else {
          participantData = data;
          hasJoined = !!data;
          isHost = data?.role === 'host';
        }
      } catch (error) {
        console.warn('Participant check failed:', error);
        hasJoined = false;
        isHost = false;
      }

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
        error: error instanceof Error ? error.message : 'Failed to load session data'
      });
    }
  }, [sessionId, userId]);

  const loadParticipantsAndQuestions = useCallback(async () => {
    if (!sessionId) return;

    try {
      // Try to load participants with error handling
      let participantsData: SessionParticipant[] = [];
      try {
        const { data, error: participantsError } = await supabase
          .from('session_participants')
          .select('*')
          .eq('session_id', sessionId);

        if (participantsError) {
          console.warn('Failed to load participants:', participantsError);
        } else {
          participantsData = data as SessionParticipant[];
        }
      } catch (error) {
        console.warn('Participants query failed:', error);
      }

      // Try to load questions with error handling
      let questionsData: DraftQuestion[] = [];
      try {
        const { data, error: questionsError } = await supabase
          .from('draft_questions')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: false });

        if (questionsError) {
          console.warn('Failed to load questions:', questionsError);
        } else {
          questionsData = data as DraftQuestion[];
        }
      } catch (error) {
        console.warn('Questions query failed:', error);
      }

      updateState({
        participants: participantsData,
        questions: questionsData
      });

    } catch (error) {
      console.error('Error loading participants and questions:', error);
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
        console.error('Join session error:', error);
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

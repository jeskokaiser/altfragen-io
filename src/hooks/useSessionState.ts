
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

      // Load session first - this should always work regardless of participation
      const { data: sessionData, error: sessionError } = await supabase
        .from('exam_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error('Session not found');
      }

      // Check if user is the creator (host)
      const isCreator = sessionData.creator_id === userId;
      
      // Try to check if user is a participant - but handle RLS errors gracefully
      let hasJoined = isCreator; // Creator is always considered joined
      let isHost = isCreator;

      if (!isCreator) {
        try {
          // Use a simple count query to avoid RLS recursion issues
          const { count, error: participantError } = await supabase
            .from('session_participants')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', sessionId)
            .eq('user_id', userId);

          if (!participantError && count && count > 0) {
            hasJoined = true;
            
            // Only check role if we know user is a participant
            const { data: roleData } = await supabase
              .from('session_participants')
              .select('role')
              .eq('session_id', sessionId)
              .eq('user_id', userId)
              .single();
            
            isHost = roleData?.role === 'host';
          }
        } catch (error) {
          console.warn('Could not verify participation status:', error);
          // Assume not joined if we can't verify
          hasJoined = false;
          isHost = false;
        }
      }

      updateState({
        session: sessionData as ExamSession,
        hasJoined,
        isHost,
        isLoading: false
      });

      // Only load additional data if user has access
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
      // Load participants and questions in parallel, with error handling
      const [participantsResult, questionsResult] = await Promise.allSettled([
        supabase
          .from('session_participants')
          .select('*')
          .eq('session_id', sessionId),
        supabase
          .from('draft_questions')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: false })
      ]);

      let participantsData: SessionParticipant[] = [];
      let questionsData: DraftQuestion[] = [];

      if (participantsResult.status === 'fulfilled' && !participantsResult.value.error) {
        participantsData = participantsResult.value.data as SessionParticipant[];
      } else {
        console.warn('Failed to load participants:', participantsResult);
      }

      if (questionsResult.status === 'fulfilled' && !questionsResult.value.error) {
        questionsData = questionsResult.value.data as DraftQuestion[];
      } else {
        console.warn('Failed to load questions:', questionsResult);
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

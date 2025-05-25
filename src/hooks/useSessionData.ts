
import { useState, useEffect, useCallback } from 'react';
import { ExamSession, DraftQuestion, SessionParticipant } from '@/types/ExamSession';
import { CollaborationServiceUnified } from '@/services/CollaborationServiceUnified';
import { toast } from 'sonner';

interface SessionData {
  session: ExamSession | null;
  participants: SessionParticipant[];
  questions: DraftQuestion[];
  isParticipant: boolean;
  isHost: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useSessionData = (sessionId: string | undefined, userId: string | null) => {
  const [data, setData] = useState<SessionData>({
    session: null,
    participants: [],
    questions: [],
    isParticipant: false,
    isHost: false,
    isLoading: true,
    error: null
  });

  const loadData = useCallback(async () => {
    if (!sessionId || !userId) {
      setData(prev => ({ ...prev, isLoading: false, error: 'Missing session ID or user ID' }));
      return;
    }

    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));

      // Load session data
      const session = await CollaborationServiceUnified.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Check participation
      const { isParticipant, isHost } = await CollaborationServiceUnified.checkParticipation(sessionId, userId);

      // Load additional data if user is participant or creator
      let participants: SessionParticipant[] = [];
      let questions: DraftQuestion[] = [];

      if (isParticipant || session.creator_id === userId) {
        [participants, questions] = await Promise.all([
          CollaborationServiceUnified.getParticipants(sessionId),
          CollaborationServiceUnified.getQuestions(sessionId)
        ]);
      }

      setData({
        session,
        participants,
        questions,
        isParticipant: isParticipant || session.creator_id === userId,
        isHost: isHost || session.creator_id === userId,
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Error loading session data:', error);
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load session data'
      }));
    }
  }, [sessionId, userId]);

  const joinSession = useCallback(async (): Promise<boolean> => {
    if (!sessionId || !userId) return false;

    const success = await CollaborationServiceUnified.joinSession(sessionId, userId);
    if (success) {
      await loadData();
    }
    return success;
  }, [sessionId, userId, loadData]);

  const addQuestion = useCallback(async (questionData: any): Promise<boolean> => {
    if (!sessionId || !userId) return false;

    const result = await CollaborationServiceUnified.addQuestion(sessionId, userId, questionData);
    if (result) {
      await loadData();
      return true;
    }
    return false;
  }, [sessionId, userId, loadData]);

  const updateQuestionStatus = useCallback(async (questionId: string, status: 'draft' | 'reviewed' | 'published'): Promise<boolean> => {
    const success = await CollaborationServiceUnified.updateQuestionStatus(questionId, status);
    if (success) {
      await loadData();
    }
    return success;
  }, [loadData]);

  const publishQuestions = useCallback(async (universityId: string | null): Promise<boolean> => {
    if (!sessionId || !userId) return false;

    const success = await CollaborationServiceUnified.publishQuestions(sessionId, userId, universityId);
    if (success) {
      await loadData();
    }
    return success;
  }, [sessionId, userId, loadData]);

  const closeSession = useCallback(async (): Promise<boolean> => {
    if (!sessionId || !userId) return false;

    const success = await CollaborationServiceUnified.closeSession(sessionId, userId);
    if (success) {
      await loadData();
    }
    return success;
  }, [sessionId, userId, loadData]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!sessionId || !data.isParticipant) return;

    const cleanup = CollaborationServiceUnified.subscribeToSession(sessionId, {
      onSessionUpdate: (session) => {
        setData(prev => ({ ...prev, session }));
      },
      onParticipantUpdate: (participants) => {
        setData(prev => ({ ...prev, participants }));
      },
      onQuestionUpdate: (questions) => {
        setData(prev => ({ ...prev, questions }));
      }
    });

    return cleanup;
  }, [sessionId, data.isParticipant]);

  return {
    ...data,
    actions: {
      loadData,
      joinSession,
      addQuestion,
      updateQuestionStatus,
      publishQuestions,
      closeSession
    }
  };
};

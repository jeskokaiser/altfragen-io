import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TrainingSessionService } from '@/services/TrainingSessionService';
import type { CreateTrainingSessionInput, TrainingSession } from '@/types/TrainingSession';

export const useTrainingSessions = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ['training-sessions', userId],
    queryFn: () => userId ? TrainingSessionService.list(userId) : Promise.resolve([] as TrainingSession[]),
    enabled: !!userId,
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateTrainingSessionInput) => {
      if (!userId) throw new Error('Missing userId');
      return TrainingSessionService.create(userId, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-sessions', userId] });
    }
  });

  const removeMutation = useMutation({
    mutationFn: async (sessionId: string) => TrainingSessionService.remove(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-sessions', userId] });
    }
  });

  return {
    sessions: listQuery.data,
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    createSession: createMutation.mutateAsync,
    deleteSession: removeMutation.mutateAsync,
    refetch: listQuery.refetch,
  };
};

export const useTrainingSession = (sessionId: string | undefined, userId: string | undefined) => {
  const queryClient = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: ['training-session', sessionId, userId],
    queryFn: () => (sessionId && userId) ? TrainingSessionService.getById(sessionId, userId) : Promise.resolve(null),
    enabled: !!sessionId && !!userId,
  });

  const updateIndex = useMutation({
    mutationFn: (currentIndex: number) => TrainingSessionService.updateIndex(sessionId!, currentIndex),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-session', sessionId, userId] });
      // Also invalidate the list to update progress indicators
      queryClient.invalidateQueries({ queryKey: ['training-sessions', userId] });
    }
  });

  const updateStatus = useMutation({
    mutationFn: (status: 'active' | 'paused' | 'completed') => TrainingSessionService.updateStatus(sessionId!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-session', sessionId, userId] });
      // Also invalidate the list to update status badges and progress
      queryClient.invalidateQueries({ queryKey: ['training-sessions', userId] });
    }
  });

  return {
    session: sessionQuery.data,
    isLoading: sessionQuery.isLoading,
    error: sessionQuery.error,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['training-session', sessionId, userId] }),
    setIndex: updateIndex.mutateAsync,
    setStatus: updateStatus.mutateAsync,
  };
};

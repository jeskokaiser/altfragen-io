import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createUpcomingExam,
  deleteUpcomingExam,
  fetchUpcomingExam,
  listUpcomingExamsForUser,
  linkQuestionsToExam,
  unlinkQuestionFromExam,
  updateUpcomingExam,
} from '@/services/UpcomingExamService';
import type { CreateUpcomingExamInput } from '@/services/UpcomingExamService';

export const useUpcomingExams = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ['upcoming-exams', userId],
    queryFn: async () => {
      if (!userId) return [];
      return listUpcomingExamsForUser(userId);
    },
    enabled: !!userId,
  });

  const createMut = useMutation({
    mutationFn: (input: CreateUpcomingExamInput) => createUpcomingExam(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upcoming-exams', userId] });
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ examId, updates }: { examId: string; updates: any }) =>
      updateUpcomingExam(examId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upcoming-exams', userId] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (examId: string) => deleteUpcomingExam(examId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upcoming-exams', userId] });
    },
  });

  // Questions are now automatically linked by exam_name matching
  // These mutations are kept for backward compatibility but are no-ops
  const linkMut = useMutation({
    mutationFn: async ({
      examId,
      questionIds,
      sourceOf,
    }: {
      examId: string;
      questionIds: string[];
      sourceOf: (qid: string) => 'personal' | 'university';
    }) => {
      // Questions are automatically linked by exam_name, so this is a no-op
      return linkQuestionsToExam(examId, questionIds, sourceOf);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upcoming-exams', userId] });
    },
  });

  const unlinkMut = useMutation({
    mutationFn: async ({ examId, questionId }: { examId: string; questionId: string }) => {
      // Questions are automatically linked by exam_name, so this is a no-op
      // To unlink, the question's exam_name would need to be changed
      return unlinkQuestionFromExam(examId, questionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upcoming-exams', userId] });
    },
  });

  return {
    exams: listQuery.data || [],
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    createExam: createMut.mutateAsync,
    updateExam: updateMut.mutateAsync,
    deleteExam: deleteMut.mutateAsync,
    linkQuestions: linkMut.mutateAsync,
    unlinkQuestion: unlinkMut.mutateAsync,
  };
};

/**
 * One exam, cached under `['exam', examId]`.
 *
 * Every reader of that key goes through here, so they all cache the same shape:
 * two screens once stored different column sets under it, and whichever read
 * first decided what the other got for the next five minutes.
 */
export const useUpcomingExam = (examId: string | null | undefined, enabled = true) =>
  useQuery({
    queryKey: ['exam', examId],
    queryFn: () => (examId ? fetchUpcomingExam(examId) : Promise.resolve(null)),
    enabled: !!examId && enabled,
  });

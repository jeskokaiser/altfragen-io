import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createUpcomingExam, deleteUpcomingExam, listUpcomingExamsForUser, linkQuestionsToExam, unlinkQuestionFromExam, updateUpcomingExam } from '@/services/UpcomingExamService';
import type { CreateUpcomingExamInput } from '@/services/UpcomingExamService';

export const useUpcomingExams = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ['upcoming-exams', userId],
    queryFn: async () => {
      if (!userId) return [];
      return listUpcomingExamsForUser(userId);
    },
    enabled: !!userId
  });

  const createMut = useMutation({
    mutationFn: (input: CreateUpcomingExamInput) => createUpcomingExam(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upcoming-exams', userId] });
    }
  });

  const updateMut = useMutation({
    mutationFn: ({ examId, updates }: { examId: string; updates: any }) => updateUpcomingExam(examId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upcoming-exams', userId] });
    }
  });

  const deleteMut = useMutation({
    mutationFn: (examId: string) => deleteUpcomingExam(examId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upcoming-exams', userId] });
    }
  });

  const linkMut = useMutation({
    mutationFn: ({ examId, questionIds, sourceOf }: { examId: string; questionIds: string[]; sourceOf: (qid: string) => 'personal' | 'university' }) =>
      linkQuestionsToExam(examId, questionIds, sourceOf),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upcoming-exams', userId] });
    }
  });

  const unlinkMut = useMutation({
    mutationFn: ({ examId, questionId }: { examId: string; questionId: string }) => unlinkQuestionFromExam(examId, questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upcoming-exams', userId] });
    }
  });

  return {
    exams: listQuery.data || [],
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    createExam: createMut.mutateAsync,
    updateExam: updateMut.mutateAsync,
    deleteExam: deleteMut.mutateAsync,
    linkQuestions: linkMut.mutateAsync,
    unlinkQuestion: unlinkMut.mutateAsync
  };
};



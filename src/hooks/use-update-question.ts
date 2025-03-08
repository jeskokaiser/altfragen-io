
import { useState } from 'react';
import { Question } from '@/types/Question';
import { updateQuestion as updateQuestionService } from '@/services/DatabaseService';
import { showToast } from '@/utils/toast';
import { useLoadingState } from './use-loading-state';
import { useQueryClient } from '@tanstack/react-query';

export const useUpdateQuestion = () => {
  const queryClient = useQueryClient();
  const { isLoading, execute } = useLoadingState<Question>();

  const updateQuestion = async (question: Question): Promise<Question> => {
    return execute(
      async () => {
        const updatedQuestion = await updateQuestionService(question);
        
        // Invalidate queries that might contain this question
        queryClient.invalidateQueries({ queryKey: ['questions'] });
        queryClient.invalidateQueries({ queryKey: ['question', question.id] });
        
        return updatedQuestion;
      },
      {
        showSuccessToast: true,
        successMessage: 'Question updated successfully',
        showErrorToast: true,
        errorMessage: 'Failed to update question'
      }
    ) as Promise<Question>;
  };

  return { updateQuestion, isLoading };
};

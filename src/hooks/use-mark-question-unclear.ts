
import { markQuestionUnclear as markUnclear } from '@/services/DatabaseService';
import { useLoadingState } from './use-loading-state';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const useMarkQuestionUnclear = () => {
  const queryClient = useQueryClient();
  const { isLoading, execute } = useLoadingState<boolean>();

  const markQuestionUnclear = async (questionId: string) => {
    return execute(
      async () => {
        const result = await markUnclear(questionId, true);
        
        // Invalidate queries that might contain this question
        queryClient.invalidateQueries({ queryKey: ['questions'] });
        queryClient.invalidateQueries({ queryKey: ['question', questionId] });
        
        return result;
      },
      {
        showSuccessToast: true,
        successMessage: 'Question marked as unclear',
        showErrorToast: true,
        errorMessage: 'Failed to mark question as unclear'
      }
    );
  };

  return { markQuestionUnclear, isLoading };
};

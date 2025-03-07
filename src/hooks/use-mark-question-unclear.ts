
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showToast } from '@/utils/toast';
import { markQuestionUnclear as markUnclear } from '@/services/DatabaseService';

export const useMarkQuestionUnclear = () => {
  const [isLoading, setIsLoading] = useState(false);

  const markQuestionUnclear = async (questionId: string) => {
    setIsLoading(true);
    try {
      await markUnclear(questionId, true);
      showToast.success('Question marked as unclear');
    } catch (error) {
      console.error('Error marking question as unclear:', error);
      showToast.error('Failed to mark question as unclear');
    } finally {
      setIsLoading(false);
    }
  };

  return { markQuestionUnclear, isLoading };
};

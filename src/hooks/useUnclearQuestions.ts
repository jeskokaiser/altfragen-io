
import { useState, useEffect } from 'react';
import { UnclearQuestionsService } from '@/services/UnclearQuestionsService';
import { toast } from 'sonner';

export const useUnclearQuestions = (questionId?: string) => {
  const [isUnclear, setIsUnclear] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (questionId) {
      checkUnclearStatus();
    }
  }, [questionId]);

  const checkUnclearStatus = async () => {
    if (!questionId) return;
    
    const unclear = await UnclearQuestionsService.isQuestionUnclearForUser(questionId);
    setIsUnclear(unclear);
  };

  const toggleUnclear = async () => {
    if (!questionId) return;
    
    setIsLoading(true);
    try {
      if (isUnclear) {
        const { error } = await UnclearQuestionsService.unmarkQuestionUnclear(questionId);
        if (error) throw error;
        
        setIsUnclear(false);
        toast.success('Frage wurde aus unklaren Fragen entfernt');
      } else {
        const { error } = await UnclearQuestionsService.markQuestionUnclear(questionId);
        if (error) throw error;
        
        setIsUnclear(true);
        toast.info('Frage als unklar markiert');
      }
    } catch (error) {
      console.error('Error toggling unclear status:', error);
      toast.error('Fehler beim Ändern des Status');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isUnclear,
    isLoading,
    toggleUnclear
  };
};

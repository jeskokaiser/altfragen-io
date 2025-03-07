
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useMarkQuestionUnclear = () => {
  const [isLoading, setIsLoading] = useState(false);

  const markQuestionUnclear = async (questionId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('questions')
        .update({
          is_unclear: true,
          marked_unclear_at: new Date().toISOString(),
        })
        .eq('id', questionId);

      if (error) throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { markQuestionUnclear, isLoading };
};

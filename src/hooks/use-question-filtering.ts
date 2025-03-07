
import { Question } from '@/types/Question';
import { FormValues } from '@/components/training/types/FormValues';
import { filterQuestions, prioritizeQuestions } from '@/utils/questionFilters';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useQuestionFiltering = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const filterAndPrioritizeQuestions = async (questions: Question[], values: FormValues): Promise<Question[]> => {
    setIsLoading(true);
    try {
      // Get user progress data before filtering
      const { data: userProgress } = await supabase
        .from('user_progress')
        .select('question_id, is_correct, attempts_count')
        .eq('user_id', user?.id);

      // Create results map for filtering wrong questions
      const questionResults = new Map();
      userProgress?.forEach(progress => {
        questionResults.set(progress.question_id, progress.is_correct);
      });
      
      // Pass the questionResults to filterQuestions
      const filteredQuestions = filterQuestions(questions, values, questionResults);
      
      const questionCount = values.questionCount === 'all' 
        ? filteredQuestions.length 
        : parseInt(values.questionCount);
      
      // Create attempts count map for sorting
      const attemptsCount = new Map();
      userProgress?.forEach(progress => {
        attemptsCount.set(progress.question_id, progress.attempts_count || 0);
      });

      const prioritizedQuestions = prioritizeQuestions(
        filteredQuestions,
        questionResults,
        questionCount,
        values.isRandomSelection,
        values.sortByAttempts,
        attemptsCount,
        values.sortDirection
      );

      return prioritizedQuestions;
    } finally {
      setIsLoading(false);
    }
  };

  return { filterAndPrioritizeQuestions, isLoading };
};

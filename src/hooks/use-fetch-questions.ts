
import { useQuery } from '@tanstack/react-query';
import { fetchQuestions } from '@/services/QuestionService';
import { Question } from '@/types/Question';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { useMemo } from 'react';

/**
 * Hook for fetching and filtering questions
 */
export const useFetchQuestions = () => {
  const { isDatasetArchived } = useUserPreferences();
  
  const {
    data: questions,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['questions'],
    queryFn: fetchQuestions,
  });

  // Filter out archived questions
  const unarchivedQuestions = useMemo(() => {
    if (!questions) return [];
    return questions.filter(q => !isDatasetArchived(q.filename));
  }, [questions, isDatasetArchived]);

  // Group questions by filename
  const groupedQuestions = useMemo(() => {
    return unarchivedQuestions.reduce((acc, question) => {
      if (!acc[question.filename]) {
        acc[question.filename] = [];
      }
      acc[question.filename].push(question);
      return acc;
    }, {} as Record<string, Question[]>);
  }, [unarchivedQuestions]);

  return {
    questions,
    unarchivedQuestions,
    groupedQuestions,
    isLoading,
    error,
    refetch
  };
};

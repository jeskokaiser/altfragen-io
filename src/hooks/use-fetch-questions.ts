
import { useQuery } from '@tanstack/react-query';
import { fetchQuestions } from '@/services/QuestionService';
import { Question } from '@/types/Question';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { useMemo, useCallback } from 'react';

/**
 * Hook for fetching and filtering questions with optimized caching
 */
export const useFetchQuestions = () => {
  // Get user preferences safely with a fallback
  const userPreferences = useUserPreferences();
  const isDatasetArchived = userPreferences?.isDatasetArchived || (() => false);
  
  const {
    data: questions,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['questions'],
    queryFn: fetchQuestions,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes (renamed from cacheTime in v5)
  });

  // Memoized filter function
  const filterUnarchivedQuestions = useCallback((questionsData: Question[] | undefined) => {
    if (!questionsData) return [];
    return questionsData.filter(q => !isDatasetArchived(q.filename));
  }, [isDatasetArchived]);

  // Filter out archived questions with memoization
  const unarchivedQuestions = useMemo(() => 
    filterUnarchivedQuestions(questions), 
    [questions, filterUnarchivedQuestions]
  );

  // Group questions by filename with memoization
  const groupedQuestions = useMemo(() => {
    const result: Record<string, Question[]> = {};
    
    if (!unarchivedQuestions || unarchivedQuestions.length === 0) {
      return result;
    }
    
    return unarchivedQuestions.reduce((acc, question) => {
      if (!acc[question.filename]) {
        acc[question.filename] = [];
      }
      acc[question.filename].push(question);
      return acc;
    }, {} as Record<string, Question[]>);
  }, [unarchivedQuestions]);

  return {
    questions: questions || [],
    unarchivedQuestions: unarchivedQuestions || [],
    groupedQuestions,
    isLoading,
    error,
    refetch
  };
};

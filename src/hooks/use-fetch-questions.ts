
import { useQuery } from '@tanstack/react-query';
import { fetchQuestions } from '@/services/QuestionService';
import { Question } from '@/types/models/Question';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { useMemo, useCallback } from 'react';
import { logError } from '@/utils/errorHandler';
import { QuestionVisibility } from '@/types/api/database';

/**
 * Hook for fetching and filtering questions with optimized caching and error handling
 * 
 * @returns An object containing the questions data, loading state, error state and utility functions
 * 
 * @example
 * ```tsx
 * const { 
 *   questions, 
 *   unarchivedQuestions, 
 *   groupedQuestions, 
 *   isLoading, 
 *   error, 
 *   refetch 
 * } = useFetchQuestions();
 * 
 * if (isLoading) return <Loading />;
 * if (error) return <ErrorDisplay error={error} />;
 * ```
 */
export const useFetchQuestions = (visibility?: QuestionVisibility) => {
  // Get user preferences safely with a fallback
  const userPreferencesContext = useUserPreferences();
  
  if (!userPreferencesContext) {
    console.warn('useUserPreferences returned undefined, using default values');
  }
  
  const isDatasetArchived = userPreferencesContext?.isDatasetArchived || (() => false);
  
  // Fetch questions with React Query
  const {
    data: questions,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['questions', visibility], // Add visibility to queryKey so it refetches when visibility changes
    queryFn: async () => fetchQuestions(visibility),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes (renamed from cacheTime in v5)
    retry: 2, // Retry failed requests up to 2 times
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    meta: {
      errorHandler: (error: any) => {
        logError(error, { hook: 'useFetchQuestions' });
      }
    },
  });

  /**
   * Filters out questions from archived datasets
   * @param questionsData - The questions data to filter
   * @returns Filtered questions data
   */
  const filterUnarchivedQuestions = useCallback((questionsData: Question[] | undefined) => {
    if (!questionsData) {
      return [];
    }
    
    try {
      return questionsData.filter(q => !isDatasetArchived(q.filename));
    } catch (error) {
      logError(error, { 
        hook: 'useFetchQuestions', 
        function: 'filterUnarchivedQuestions' 
      });
      return [];
    }
  }, [isDatasetArchived]);

  /**
   * Filtered questions that are not archived
   */
  const unarchivedQuestions = useMemo(() => 
    filterUnarchivedQuestions(questions), 
    [questions, filterUnarchivedQuestions]
  );

  /**
   * Groups questions by filename for easier dataset management
   */
  const groupedQuestions = useMemo(() => {
    const result: Record<string, Question[]> = {};
    
    if (!unarchivedQuestions || unarchivedQuestions.length === 0) {
      return result;
    }
    
    try {
      return unarchivedQuestions.reduce((acc, question) => {
        if (!acc[question.filename]) {
          acc[question.filename] = [];
        }
        acc[question.filename].push(question);
        return acc;
      }, {} as Record<string, Question[]>);
    } catch (error) {
      logError(error, { 
        hook: 'useFetchQuestions', 
        function: 'groupedQuestions' 
      });
      return result;
    }
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

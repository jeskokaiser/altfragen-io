
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchQuestions, fetchPersonalQuestions, fetchOrganizationalQuestions } from '@/services/QuestionService';
import { updateDatasetVisibility } from '@/services/DatabaseService';
import { getUserOrganization } from '@/services/OrganizationService';
import { Question } from '@/types/models/Question';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { useState, useCallback, useMemo } from 'react';
import { logError } from '@/utils/errorHandler';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type DatasetView = 'all' | 'personal' | 'organizational';

/**
 * Hook for managing datasets including fetching, filtering, and sharing operations
 */
export const useDatasetManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [datasetView, setDatasetView] = useState<DatasetView>('all');

  // Get user preferences safely with a fallback
  const userPreferencesContext = useUserPreferences();
  
  if (!userPreferencesContext) {
    console.warn('useUserPreferences returned undefined, using default values');
  }
  
  const isDatasetArchived = userPreferencesContext?.isDatasetArchived || (() => false);
  
  // Fetch all questions with React Query
  const {
    data: allQuestions,
    isLoading: isAllQuestionsLoading,
    error: allQuestionsError,
    refetch: refetchAllQuestions
  } = useQuery({
    queryKey: ['questions', 'all'],
    queryFn: fetchQuestions,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes (renamed from cacheTime in v5)
    retry: 2, // Retry failed requests up to 2 times
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    meta: {
      errorHandler: (error: any) => {
        logError(error, { hook: 'useDatasetManagement', query: 'allQuestions' });
      }
    },
  });

  // Fetch personal questions (created by the user)
  const {
    data: personalQuestions,
    isLoading: isPersonalQuestionsLoading,
    error: personalQuestionsError,
  } = useQuery({
    queryKey: ['questions', 'personal', user?.id],
    queryFn: () => fetchPersonalQuestions(user?.id || ''),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    meta: {
      errorHandler: (error: any) => {
        logError(error, { hook: 'useDatasetManagement', query: 'personalQuestions' });
      }
    },
  });

  // Fetch organizational questions (shared by users with the same domain)
  const {
    data: organizationalQuestions,
    isLoading: isOrganizationalQuestionsLoading,
    error: organizationalQuestionsError,
  } = useQuery({
    queryKey: ['questions', 'organizational'],
    queryFn: fetchOrganizationalQuestions,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    meta: {
      errorHandler: (error: any) => {
        logError(error, { hook: 'useDatasetManagement', query: 'organizationalQuestions' });
      }
    },
  });

  // Get user organization
  const {
    data: userOrganization,
    isLoading: isOrganizationLoading,
  } = useQuery({
    queryKey: ['organization', user?.id],
    queryFn: () => getUserOrganization(user?.id || ''),
    enabled: !!user,
    staleTime: 1000 * 60 * 30, // 30 minutes
    meta: {
      errorHandler: (error: any) => {
        logError(error, { hook: 'useDatasetManagement', query: 'userOrganization' });
      }
    },
  });

  // Mutation for updating dataset visibility
  const updateVisibilityMutation = useMutation({
    mutationFn: ({ filename, visibility }: { filename: string, visibility: 'private' | 'organization' }) => 
      updateDatasetVisibility(filename, visibility, user?.id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast.success('Dataset visibility updated', {
        description: 'The sharing settings for this dataset have been updated successfully.'
      });
    },
    onError: (error) => {
      logError(error, { hook: 'useDatasetManagement', mutation: 'updateVisibility' });
      toast.error('Failed to update visibility', {
        description: 'There was an error updating the dataset visibility. Please try again.'
      });
    }
  });

  // Active questions based on current view
  const activeQuestions = useMemo(() => {
    switch (datasetView) {
      case 'personal':
        return personalQuestions || [];
      case 'organizational':
        return organizationalQuestions || [];
      case 'all':
      default:
        return allQuestions || [];
    }
  }, [datasetView, allQuestions, personalQuestions, organizationalQuestions]);

  /**
   * Filters out questions from archived datasets
   */
  const filterUnarchivedQuestions = useCallback((questionsData: Question[] | undefined) => {
    if (!questionsData) {
      return [];
    }
    
    try {
      return questionsData.filter(q => !isDatasetArchived(q.filename));
    } catch (error) {
      logError(error, { 
        hook: 'useDatasetManagement', 
        function: 'filterUnarchivedQuestions' 
      });
      return [];
    }
  }, [isDatasetArchived]);

  /**
   * Filtered questions that are not archived
   */
  const unarchivedQuestions = useMemo(() => 
    filterUnarchivedQuestions(activeQuestions), 
    [activeQuestions, filterUnarchivedQuestions]
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
        hook: 'useDatasetManagement', 
        function: 'groupedQuestions' 
      });
      return result;
    }
  }, [unarchivedQuestions]);

  /**
   * Updates the visibility of a dataset
   */
  const toggleDatasetVisibility = useCallback((filename: string, currentVisibility: 'private' | 'organization') => {
    const newVisibility = currentVisibility === 'private' ? 'organization' : 'private';
    updateVisibilityMutation.mutate({ filename, visibility: newVisibility });
  }, [updateVisibilityMutation]);

  /**
   * Determines if a dataset is shared with the organization
   */
  const isDatasetShared = useCallback((questions: Question[]): boolean => {
    if (!questions || questions.length === 0) return false;
    // If any question in the dataset is shared, consider the dataset shared
    return questions.some(q => q.visibility === 'organization');
  }, []);

  const isLoading = 
    isAllQuestionsLoading || 
    isPersonalQuestionsLoading || 
    isOrganizationalQuestionsLoading ||
    isOrganizationLoading ||
    updateVisibilityMutation.isPending;

  const error = allQuestionsError || personalQuestionsError || organizationalQuestionsError;

  return {
    datasetView,
    setDatasetView,
    allQuestions: allQuestions || [],
    personalQuestions: personalQuestions || [],
    organizationalQuestions: organizationalQuestions || [],
    activeQuestions,
    unarchivedQuestions,
    groupedQuestions,
    userOrganization,
    isLoading,
    error,
    refetchAllQuestions,
    toggleDatasetVisibility,
    isDatasetShared,
    updateVisibilityMutation
  };
};

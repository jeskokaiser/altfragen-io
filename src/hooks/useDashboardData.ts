
import { useDashboardStats } from './useDashboardStats';
import { useOptimizedQuestions } from './useOptimizedQuestions';

export const useDashboardData = (userId: string | undefined, universityId?: string | null) => {
  const statsQuery = useDashboardStats(userId);
  const questionsQuery = useOptimizedQuestions(userId, universityId);

  // Combine all questions for compatibility with existing code
  const allQuestions = [
    ...questionsQuery.personalQuestions,
    ...questionsQuery.universityQuestions
  ];

  return {
    questions: allQuestions,
    personalQuestions: questionsQuery.personalQuestions,
    universityQuestions: questionsQuery.universityQuestions,
    isQuestionsLoading: questionsQuery.isLoading,
    questionsError: questionsQuery.personalError || questionsQuery.universityError,
    todayNewCount: statsQuery.data?.todayNew,
    todayPracticeCount: statsQuery.data?.todayPractice,
    totalAnsweredCount: statsQuery.data?.totalAnswered,
    totalAttemptsCount: statsQuery.data?.totalAttempts,
    isStatsLoading: statsQuery.isLoading,
    statsError: statsQuery.error
  };
};

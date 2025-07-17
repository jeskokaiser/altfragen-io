
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fetchAllQuestions } from '@/services/DatabaseService';

export const useDashboardData = (userId: string | undefined, universityId?: string | null) => {
  const questionsQuery = useQuery({
    queryKey: ['all-questions', userId, universityId],
    queryFn: async () => {
      if (!userId) return [];
      return fetchAllQuestions(userId, universityId);
    },
    enabled: !!userId
  });

  const todayNewCountQuery = useQuery({
    queryKey: ['today-new', userId],
    queryFn: async () => {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const { count, error } = await supabase
        .from('user_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', today.toISOString());
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!userId
  });

  const todayPracticeCountQuery = useQuery({
    queryKey: ['today-practice', userId],
    queryFn: async () => {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const { count, error } = await supabase
        .from('user_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('updated_at', today.toISOString());
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!userId
  });

  const totalAnsweredCountQuery = useQuery({
    queryKey: ['total-answers', userId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('user_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId
  });

  const totalAttemptsCountQuery = useQuery({
    queryKey: ['total-attempts', userId],
    queryFn: async () => {
      // Use Supabase's sum aggregation via RPC if available, otherwise fetch minimal data
      const { data, error } = await supabase
        .from('user_progress')
        .select('attempts_count')
        .eq('user_id', userId);
      if (error) throw error;
      const totalAttempts = data.reduce((sum, record) => sum + (record.attempts_count || 1), 0);
      return totalAttempts;
    },
    enabled: !!userId
  });

  return {
    questions: questionsQuery.data,
    isQuestionsLoading: questionsQuery.isLoading,
    questionsError: questionsQuery.error,
    todayNewCount: todayNewCountQuery.data,
    todayPracticeCount: todayPracticeCountQuery.data,
    totalAnsweredCount: totalAnsweredCountQuery.data,
    totalAttemptsCount: totalAttemptsCountQuery.data,
  };
};

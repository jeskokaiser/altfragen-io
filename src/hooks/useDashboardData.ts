
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fetchAllQuestions } from '@/services/DatabaseService';
import { StatisticsDateRange } from '@/contexts/UserPreferencesContext';

// Helper function to calculate date range bounds
const getDateRangeBounds = (dateRange: StatisticsDateRange): { start: string | null; end: string | null } => {
  const now = new Date();
  let start: Date | null = null;
  let end: Date | null = new Date();

  switch (dateRange.preset) {
    case '7days':
      start = new Date(now);
      start.setDate(start.getDate() - 7);
      break;
    case '30days':
      start = new Date(now);
      start.setDate(start.getDate() - 30);
      break;
    case '90days':
      start = new Date(now);
      start.setDate(start.getDate() - 90);
      break;
    case 'custom':
      start = dateRange.start ? new Date(dateRange.start) : null;
      end = dateRange.end ? new Date(dateRange.end) : null;
      break;
    case 'all':
    default:
      return { start: null, end: null };
  }

  return {
    start: start ? start.toISOString() : null,
    end: end ? end.toISOString() : null
  };
};

export const useDashboardData = (
  userId: string | undefined, 
  universityId?: string | null,
  dateRange?: StatisticsDateRange
) => {
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
        .from('session_question_progress')
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
        .from('session_question_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('updated_at', today.toISOString());
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!userId
  });

  const totalAnsweredCountQuery = useQuery({
    queryKey: ['total-answers', userId, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('session_question_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Apply date range filter if not 'all'
      if (dateRange && dateRange.preset !== 'all') {
        const { start, end } = getDateRangeBounds(dateRange);
        if (start) query = query.gte('created_at', start);
        if (end) query = query.lte('created_at', end);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId
  });

  const totalAttemptsCountQuery = useQuery({
    queryKey: ['total-attempts', userId, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('session_question_progress')
        .select('attempts_count')
        .eq('user_id', userId);

      // Apply date range filter if not 'all'
      if (dateRange && dateRange.preset !== 'all') {
        const { start, end } = getDateRangeBounds(dateRange);
        if (start) query = query.gte('created_at', start);
        if (end) query = query.lte('created_at', end);
      }

      const { data, error } = await query;
      if (error) throw error;
      const totalAttempts = data.reduce((sum, record) => sum + (record.attempts_count || 0), 0);
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


import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  todayNew: number;
  todayPractice: number;
  totalAnswered: number;
  totalAttempts: number;
}

export const useDashboardStats = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['dashboard-stats', userId],
    queryFn: async (): Promise<DashboardStats> => {
      if (!userId) {
        return {
          todayNew: 0,
          todayPractice: 0,
          totalAnswered: 0,
          totalAttempts: 0
        };
      }

      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Single query to get all statistics at once
      const { data, error } = await supabase
        .from('user_progress')
        .select('created_at, updated_at, attempts_count')
        .eq('user_id', userId);

      if (error) throw error;

      const stats = {
        todayNew: 0,
        todayPractice: 0,
        totalAnswered: data?.length || 0,
        totalAttempts: 0
      };

      if (data) {
        data.forEach(record => {
          // Count total attempts
          stats.totalAttempts += record.attempts_count || 1;
          
          // Count today's new questions (created today)
          if (record.created_at >= todayISO) {
            stats.todayNew++;
          }
          
          // Count today's practice (updated today)
          if (record.updated_at >= todayISO) {
            stats.todayPractice++;
          }
        });
      }

      return stats;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false
  });
};


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
      const todayISO = today.toISOString();

      // Query both tables for questions first answered today
      // "New" means questions that have their first progress record created today
      const [sessionProgressResult, userProgressResult] = await Promise.all([
        supabase
          .from('session_question_progress')
          .select('question_id, created_at')
          .eq('user_id', userId)
          .gte('created_at', todayISO),
        supabase
          .from('user_progress')
          .select('question_id, created_at')
          .eq('user_id', userId)
          .gte('created_at', todayISO)
      ]);

      if (sessionProgressResult.error) throw sessionProgressResult.error;
      if (userProgressResult.error) throw userProgressResult.error;

      // Collect unique question IDs from today
      const questionsFromToday = new Set<string>();
      (sessionProgressResult.data || []).forEach((p: any) => {
        if (p.question_id) questionsFromToday.add(p.question_id);
      });
      (userProgressResult.data || []).forEach((p: any) => {
        if (p.question_id) questionsFromToday.add(p.question_id);
      });

      if (questionsFromToday.size === 0) return 0;

      // Check which of these questions have progress records before today
      const questionIdsArray = Array.from(questionsFromToday);
      const BATCH_SIZE = 300;
      const batches: string[][] = [];
      for (let i = 0; i < questionIdsArray.length; i += BATCH_SIZE) {
        batches.push(questionIdsArray.slice(i, i + BATCH_SIZE));
      }

      const beforeTodayPromises = batches.map(batch => {
        return Promise.all([
          supabase
            .from('session_question_progress')
            .select('question_id')
            .eq('user_id', userId)
            .in('question_id', batch)
            .lt('created_at', todayISO),
          supabase
            .from('user_progress')
            .select('question_id')
            .eq('user_id', userId)
            .in('question_id', batch)
            .lt('created_at', todayISO)
        ]);
      });

      const beforeTodayResults = await Promise.all(beforeTodayPromises);
      
      // Collect questions that have progress before today
      const questionsWithPreviousProgress = new Set<string>();
      beforeTodayResults.forEach(([sessionResult, userResult]) => {
        (sessionResult.data || []).forEach((p: any) => {
          if (p.question_id) questionsWithPreviousProgress.add(p.question_id);
        });
        (userResult.data || []).forEach((p: any) => {
          if (p.question_id) questionsWithPreviousProgress.add(p.question_id);
        });
      });

      // "New" questions = those answered today but without previous progress
      const newQuestionsCount = Array.from(questionsFromToday).filter(
        qid => !questionsWithPreviousProgress.has(qid)
      ).length;

      return newQuestionsCount;
    },
    enabled: !!userId
  });

  const todayPracticeCountQuery = useQuery({
    queryKey: ['today-practice', userId],
    queryFn: async () => {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Query both tables for questions updated today
      const [sessionProgressResult, userProgressResult] = await Promise.all([
        supabase
          .from('session_question_progress')
          .select('question_id, updated_at')
          .eq('user_id', userId)
          .gte('updated_at', todayISO),
        supabase
          .from('user_progress')
          .select('question_id, updated_at')
          .eq('user_id', userId)
          .gte('updated_at', todayISO)
      ]);

      if (sessionProgressResult.error) throw sessionProgressResult.error;
      if (userProgressResult.error) throw userProgressResult.error;

      // Collect unique question IDs, prioritizing session_question_progress
      const uniqueQuestions = new Set<string>();
      
      // First add from session_question_progress (newer system)
      (sessionProgressResult.data || []).forEach((p: any) => {
        if (p.question_id) uniqueQuestions.add(p.question_id);
      });

      // Then add from user_progress only if not already present
      (userProgressResult.data || []).forEach((p: any) => {
        if (p.question_id && !uniqueQuestions.has(p.question_id)) {
          uniqueQuestions.add(p.question_id);
        }
      });

      return uniqueQuestions.size;
    },
    enabled: !!userId
  });

  const totalAnsweredCountQuery = useQuery({
    queryKey: ['total-answers', userId, dateRange],
    queryFn: async () => {
      const { start, end } = getDateRangeBounds(dateRange || { preset: 'all' });

      // Query both tables
      let sessionQuery = supabase
        .from('session_question_progress')
        .select('question_id, created_at')
        .eq('user_id', userId);

      let userQuery = supabase
        .from('user_progress')
        .select('question_id, created_at')
        .eq('user_id', userId);

      // Apply date range filter if not 'all'
      if (start) {
        sessionQuery = sessionQuery.gte('created_at', start);
        userQuery = userQuery.gte('created_at', start);
      }
      if (end) {
        sessionQuery = sessionQuery.lte('created_at', end);
        userQuery = userQuery.lte('created_at', end);
      }

      const [sessionProgressResult, userProgressResult] = await Promise.all([
        sessionQuery,
        userQuery
      ]);

      if (sessionProgressResult.error) throw sessionProgressResult.error;
      if (userProgressResult.error) throw userProgressResult.error;

      // Collect unique question IDs, prioritizing session_question_progress
      const uniqueQuestions = new Set<string>();
      
      // First add from session_question_progress (newer system)
      (sessionProgressResult.data || []).forEach((p: any) => {
        if (p.question_id) uniqueQuestions.add(p.question_id);
      });

      // Then add from user_progress only if not already present
      (userProgressResult.data || []).forEach((p: any) => {
        if (p.question_id && !uniqueQuestions.has(p.question_id)) {
          uniqueQuestions.add(p.question_id);
        }
      });

      return uniqueQuestions.size;
    },
    enabled: !!userId
  });

  const totalAttemptsCountQuery = useQuery({
    queryKey: ['total-attempts', userId, dateRange],
    queryFn: async () => {
      const { start, end } = getDateRangeBounds(dateRange || { preset: 'all' });

      // Query both tables for attempts_count
      let sessionQuery = supabase
        .from('session_question_progress')
        .select('attempts_count, created_at')
        .eq('user_id', userId);

      let userQuery = supabase
        .from('user_progress')
        .select('attempts_count, created_at')
        .eq('user_id', userId);

      // Apply date range filter if not 'all'
      if (start) {
        sessionQuery = sessionQuery.gte('created_at', start);
        userQuery = userQuery.gte('created_at', start);
      }
      if (end) {
        sessionQuery = sessionQuery.lte('created_at', end);
        userQuery = userQuery.lte('created_at', end);
      }

      const [sessionProgressResult, userProgressResult] = await Promise.all([
        sessionQuery,
        userQuery
      ]);

      if (sessionProgressResult.error) throw sessionProgressResult.error;
      if (userProgressResult.error) throw userProgressResult.error;

      // Sum attempts from both tables
      const sessionAttempts = (sessionProgressResult.data || []).reduce(
        (sum, record) => sum + (record.attempts_count || 0), 
        0
      );
      const userAttempts = (userProgressResult.data || []).reduce(
        (sum, record) => sum + (record.attempts_count || 0), 
        0
      );

      return sessionAttempts + userAttempts;
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

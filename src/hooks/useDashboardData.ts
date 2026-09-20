import { useQuery } from '@tanstack/react-query';
import { fetchAllQuestions } from '@/services/DatabaseService';
import {
  fetchProgressActivity,
  fetchQuestionIdsWithProgressBefore,
} from '@/services/UserProgressService';
import { StatisticsDateRange } from '@/contexts/UserPreferencesContext';

// Helper function to calculate date range bounds
const getDateRangeBounds = (
  dateRange: StatisticsDateRange,
): { start: string | null; end: string | null } => {
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
    end: end ? end.toISOString() : null,
  };
};

/** Midnight UTC today, the boundary the daily statistics are cut at. */
const startOfToday = (): string => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today.toISOString();
};

const distinctQuestionIds = (rows: { questionId: string }[]): Set<string> =>
  new Set(rows.map((row) => row.questionId));

export const useDashboardData = (
  userId: string | undefined,
  universityId?: string | null,
  dateRange?: StatisticsDateRange,
) => {
  const questionsQuery = useQuery({
    queryKey: ['all-questions', userId, universityId],
    queryFn: async () => {
      if (!userId) return [];
      return fetchAllQuestions(userId, universityId);
    },
    enabled: !!userId,
  });

  // "New" means answered today and never before.
  const todayNewCountQuery = useQuery({
    queryKey: ['today-new', userId],
    queryFn: async () => {
      if (!userId) return 0;

      const today = startOfToday();
      const answeredToday = distinctQuestionIds(
        await fetchProgressActivity(userId, { createdFrom: today }),
      );

      if (answeredToday.size === 0) return 0;

      const answeredBefore = await fetchQuestionIdsWithProgressBefore(
        userId,
        Array.from(answeredToday),
        today,
      );

      return Array.from(answeredToday).filter((id) => !answeredBefore.has(id)).length;
    },
    enabled: !!userId,
  });

  const todayPracticeCountQuery = useQuery({
    queryKey: ['today-practice', userId],
    queryFn: async () => {
      if (!userId) return 0;

      const rows = await fetchProgressActivity(userId, { updatedFrom: startOfToday() });

      return distinctQuestionIds(rows).size;
    },
    enabled: !!userId,
  });

  // "Repeated" means answered today with a previous answer to look back on: either
  // progress from before today, or an earlier session today. A question first
  // answered in session 1 and answered again in session 2 counts as both new and
  // repeated, which is why this is its own query rather than a subtraction.
  const todayRepeatedCountQuery = useQuery({
    queryKey: ['today-repeated', userId],
    queryFn: async () => {
      if (!userId) return 0;

      const today = startOfToday();
      const rows = await fetchProgressActivity(userId, { createdFrom: today });
      const answeredToday = distinctQuestionIds(rows);

      if (answeredToday.size === 0) return 0;

      const sessionsPerQuestion = new Map<string, number>();
      rows
        .filter((row) => row.source === 'session')
        .forEach((row) => {
          sessionsPerQuestion.set(
            row.questionId,
            (sessionsPerQuestion.get(row.questionId) || 0) + 1,
          );
        });

      const answeredBefore = await fetchQuestionIdsWithProgressBefore(
        userId,
        Array.from(answeredToday),
        today,
      );

      return Array.from(answeredToday).filter(
        (id) => answeredBefore.has(id) || (sessionsPerQuestion.get(id) || 0) > 1,
      ).length;
    },
    enabled: !!userId,
  });

  const totalAnsweredCountQuery = useQuery({
    queryKey: ['total-answers', userId, dateRange],
    queryFn: async () => {
      if (!userId) return 0;

      const { start, end } = getDateRangeBounds(dateRange || { preset: 'all' });
      const rows = await fetchProgressActivity(userId, { createdFrom: start, createdTo: end });

      return distinctQuestionIds(rows).size;
    },
    enabled: !!userId,
  });

  // Attempts are summed across both tables rather than deduplicated: answering the
  // same question in a session and in a one-off run is two attempts.
  const totalAttemptsCountQuery = useQuery({
    queryKey: ['total-attempts', userId, dateRange],
    queryFn: async () => {
      if (!userId) return 0;

      const { start, end } = getDateRangeBounds(dateRange || { preset: 'all' });
      const rows = await fetchProgressActivity(userId, { createdFrom: start, createdTo: end });

      return rows.reduce((sum, row) => sum + (row.attemptsCount || 0), 0);
    },
    enabled: !!userId,
  });

  return {
    questions: questionsQuery.data,
    isQuestionsLoading: questionsQuery.isLoading,
    questionsError: questionsQuery.error,
    todayNewCount: todayNewCountQuery.data,
    todayPracticeCount: todayPracticeCountQuery.data,
    todayRepeatedCount: todayRepeatedCountQuery.data,
    totalAnsweredCount: totalAnsweredCountQuery.data,
    totalAttemptsCount: totalAttemptsCountQuery.data,
  };
};

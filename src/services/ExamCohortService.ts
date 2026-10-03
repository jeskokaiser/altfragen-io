import { supabase } from '@/integrations/supabase/client';
import type { Database, Json } from '@/integrations/supabase/types';

/**
 * Reads how a user compares with the other students of their university on
 * one exam: the database function `get_exam_cohort_stats`, which scores every
 * student who answered the exam's university questions. The score is computed
 * there; `utils/cohortScoring.ts` is a client copy of the formula that has
 * drifted from it (`COHORT_N_REF` 3000 there, 2000 in the function).
 */

export interface ScoreBucket {
  bucketMin: number; // e.g., 0, 5, 10, ...
  bucketMax: number; // e.g., 5, 10, 15, ...
  count: number; // number of users in this bucket
}

export interface CohortComparisonStats {
  meanScore: number;
  stdDevScore: number;
  sampleSize: number;
  userScore: number;
  userPercentile: number; // 0..100
  userAnswered: number;
  userCorrect: number;
  userAnsweredPercentile: number | null; // 0..100
  userAccuracyPercentile: number | null; // 0..100
  cohortAnsweredMean: number;
  cohortAnsweredMedian: number | null;
  cohortAnsweredPercentile: number | null; // the 80th percentile
  cohortAccuracyMean: number | null;
  cohortAccuracyMedian: number | null;
  p0: number; // cohort baseline accuracy used for Bayesian prior
  scoreDistribution: ScoreBucket[] | null; // histogram buckets
  answeredDistribution: ScoreBucket[] | null; // histogram buckets for answered questions
  accuracyDistribution: ScoreBucket[] | null; // histogram buckets for accuracy (0-100%)
}

type CohortStatsRow = Database['public']['CompositeTypes']['exam_cohort_stats'];

const isBucket = (value: Json): value is { bucketMin: number; bucketMax: number; count: number } =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  typeof value.bucketMin === 'number' &&
  typeof value.bucketMax === 'number' &&
  typeof value.count === 'number';

/** A histogram as the function builds it (jsonb), or null when it is not one. */
const toBuckets = (value: Json | null): ScoreBucket[] | null => {
  if (!Array.isArray(value) || !value.every(isBucket)) return null;
  return value.map(({ bucketMin, bucketMax, count }) => ({ bucketMin, bucketMax, count }));
};

const toCohortStats = (row: CohortStatsRow): CohortComparisonStats => ({
  meanScore: row.mean_score ?? 0,
  stdDevScore: row.stddev_score ?? 0,
  sampleSize: row.sample_size ?? 0,
  userScore: row.user_score ?? 0,
  userPercentile: row.user_percentile ?? 0,
  userAnswered: row.user_answered ?? 0,
  userCorrect: row.user_correct ?? 0,
  userAnsweredPercentile: row.user_answered_percentile ?? null,
  userAccuracyPercentile: row.user_accuracy_percentile ?? null,
  cohortAnsweredMean: row.cohort_answered_mean ?? 0,
  cohortAnsweredMedian: row.cohort_answered_median ?? null,
  cohortAnsweredPercentile: row.cohort_answered_p80 ?? null,
  cohortAccuracyMean: row.cohort_accuracy_mean ?? null,
  cohortAccuracyMedian: row.cohort_accuracy_median ?? null,
  p0: row.p0 ?? 0,
  scoreDistribution: toBuckets(row.score_distribution),
  answeredDistribution: toBuckets(row.answered_distribution),
  accuracyDistribution: toBuckets(row.accuracy_distribution),
});

/**
 * The user's standing on the exam among the students of the exam's
 * university. Throws on a database error.
 *
 * When there is nothing to compare -- the exam has no university, none of its
 * questions are shared with it, or the user has answered none -- the function
 * answers with a row of nulls rather than no row, which reads here as a cohort
 * of 0 (`sampleSize` 0).
 */
export const fetchExamCohortStats = async (
  examId: string,
  userId: string,
): Promise<CohortComparisonStats | null> => {
  const { data, error } = await supabase.rpc('get_exam_cohort_stats', {
    p_exam_id: examId,
    p_user_id: userId,
  });

  if (error) throw error;

  return data ? toCohortStats(data) : null;
};

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { queriesFor, queueResponse, resetSupabaseDouble } from '@/test/supabaseDouble';

vi.mock('@/integrations/supabase/client', async () => ({
  supabase: (await import('@/test/supabaseDouble')).supabaseDouble,
}));

import { fetchExamCohortStats } from './ExamCohortService';

const bucket = (bucketMin: number, count: number) => ({
  bucketMin,
  bucketMax: bucketMin + 5,
  count,
});

const statsRow = {
  mean_score: 61.2,
  stddev_score: 8.4,
  sample_size: 42,
  user_score: 70.1,
  user_percentile: 88,
  user_answered: 310,
  user_correct: 250,
  user_answered_percentile: 75,
  user_accuracy_percentile: 80,
  cohort_answered_mean: 180.5,
  cohort_answered_median: 150,
  cohort_answered_p80: 290,
  cohort_accuracy_mean: 0.68,
  cohort_accuracy_median: 0.7,
  p0: 0.66,
  score_distribution: [bucket(55, 10), bucket(60, 32)],
  answered_distribution: [bucket(0, 42)],
  accuracy_distribution: [bucket(65, 42)],
};

// What the function answers when there is nothing to compare: one row, all null.
const nullRow = Object.fromEntries(Object.keys(statsRow).map((key) => [key, null]));

beforeEach(resetSupabaseDouble);

describe('fetchExamCohortStats', () => {
  it('asks get_exam_cohort_stats about the exam and the user', async () => {
    queueResponse('get_exam_cohort_stats', { data: statsRow });

    await fetchExamCohortStats('exam-1', 'user-1');

    expect(queriesFor('get_exam_cohort_stats')[0].ops).toEqual([
      { method: 'rpc', args: [{ p_exam_id: 'exam-1', p_user_id: 'user-1' }] },
    ]);
  });

  it('maps every column to the domain type, the 80th percentile included', async () => {
    queueResponse('get_exam_cohort_stats', { data: statsRow });

    expect(await fetchExamCohortStats('exam-1', 'user-1')).toEqual({
      meanScore: 61.2,
      stdDevScore: 8.4,
      sampleSize: 42,
      userScore: 70.1,
      userPercentile: 88,
      userAnswered: 310,
      userCorrect: 250,
      userAnsweredPercentile: 75,
      userAccuracyPercentile: 80,
      cohortAnsweredMean: 180.5,
      cohortAnsweredMedian: 150,
      cohortAnsweredPercentile: 290,
      cohortAccuracyMean: 0.68,
      cohortAccuracyMedian: 0.7,
      p0: 0.66,
      scoreDistribution: [bucket(55, 10), bucket(60, 32)],
      answeredDistribution: [bucket(0, 42)],
      accuracyDistribution: [bucket(65, 42)],
    });
  });

  it('reads a row of nulls as an empty cohort', async () => {
    // The page then says there is too little data, as it did before.
    queueResponse('get_exam_cohort_stats', { data: nullRow });

    expect(await fetchExamCohortStats('exam-1', 'user-1')).toMatchObject({
      sampleSize: 0,
      meanScore: 0,
      userScore: 0,
      userAnsweredPercentile: null,
      cohortAccuracyMean: null,
      scoreDistribution: null,
      answeredDistribution: null,
      accuracyDistribution: null,
    });
  });

  it('drops a histogram that is not a list of buckets rather than drawing it', async () => {
    queueResponse('get_exam_cohort_stats', {
      data: {
        ...statsRow,
        score_distribution: [bucket(55, 10), { bucketMin: 60 }],
        answered_distribution: { bucketMin: 0, bucketMax: 5, count: 1 },
      },
    });

    const stats = await fetchExamCohortStats('exam-1', 'user-1');

    expect(stats?.scoreDistribution).toBeNull();
    expect(stats?.answeredDistribution).toBeNull();
    expect(stats?.accuracyDistribution).toEqual([bucket(65, 42)]);
  });

  it('returns null without an answer', async () => {
    queueResponse('get_exam_cohort_stats', { data: null });

    expect(await fetchExamCohortStats('exam-1', 'user-1')).toBeNull();
  });

  it('throws on a failed call, so the page can say the comparison is unavailable', async () => {
    queueResponse('get_exam_cohort_stats', { error: { message: 'boom' } });

    await expect(fetchExamCohortStats('exam-1', 'user-1')).rejects.toEqual({ message: 'boom' });
  });
});

import { describe, expect, it } from 'vitest';
import {
  COHORT_N_REF,
  computeActivityFactor,
  computeBayesianAccuracy,
  computeCohortScore,
} from './cohortScoring';

describe('computeBayesianAccuracy', () => {
  it('falls back to the cohort baseline when nothing was answered', () => {
    expect(computeBayesianAccuracy({ n: 0, r: 0, p0: 0.6 })).toBe(0.6);
  });

  it('shrinks a small perfect run towards the baseline', () => {
    // Three correct out of three is not 100% accuracy: with a prior of 75
    // pseudo-questions, three answers barely move the baseline of 0.6.
    expect(computeBayesianAccuracy({ n: 3, r: 3, p0: 0.6 })).toBeCloseTo(0.615, 3);
  });

  it('lets a large sample outweigh the prior', () => {
    expect(computeBayesianAccuracy({ n: 10000, r: 9000, p0: 0.6 })).toBeCloseTo(0.898, 3);
  });

  it('honours an explicit prior strength', () => {
    // m = 0 removes the shrinkage entirely and leaves the raw ratio.
    expect(computeBayesianAccuracy({ n: 4, r: 3, p0: 0.6, m: 0 })).toBe(0.75);
  });

  it('returns 0 for negative input rather than a negative accuracy', () => {
    expect(computeBayesianAccuracy({ n: -1, r: 0, p0: 0.6 })).toBe(0);
    expect(computeBayesianAccuracy({ n: 10, r: -1, p0: 0.6 })).toBe(0);
  });
});

describe('computeActivityFactor', () => {
  it('is 0 without activity', () => {
    expect(computeActivityFactor({ n: 0 })).toBe(0);
    expect(computeActivityFactor({ n: -5 })).toBe(0);
  });

  it('reaches 1 at the reference activity level', () => {
    expect(computeActivityFactor({ n: COHORT_N_REF })).toBe(1);
  });

  it('caps at 1 beyond the reference level', () => {
    expect(computeActivityFactor({ n: COHORT_N_REF * 10 })).toBe(1);
  });

  it('grows logarithmically, so early answers count for most', () => {
    const first = computeActivityFactor({ n: 10 });
    const second = computeActivityFactor({ n: 100 });
    const third = computeActivityFactor({ n: 1000 });

    expect(first).toBeLessThan(second);
    expect(second).toBeLessThan(third);

    // Each tenfold step adds roughly the same amount, not ten times as much:
    // going from 10 to 100 answers is worth about as much as 100 to 1000.
    const ratio = (third - second) / (second - first);
    expect(ratio).toBeGreaterThan(0.9);
    expect(ratio).toBeLessThan(1.1);
  });
});

describe('computeCohortScore', () => {
  it('stays within 0 and 100', () => {
    expect(computeCohortScore({ n: 0, r: 0, p0: 0 })).toBeGreaterThanOrEqual(0);
    expect(computeCohortScore({ n: 100000, r: 100000, p0: 1 })).toBeLessThanOrEqual(100);
  });

  it('ranks a large, good cohort above a tiny, perfect one', () => {
    // This is what the shrinkage and the activity factor exist for: three
    // correct answers must not beat a semester of work.
    const tinyAndPerfect = computeCohortScore({ n: 3, r: 3, p0: 0.6 });
    const largeAndGood = computeCohortScore({ n: 3000, r: 2700, p0: 0.6 });

    expect(tinyAndPerfect).toBeCloseTo(54.9, 1);
    expect(largeAndGood).toBeCloseTo(90.9, 1);
    expect(largeAndGood).toBeGreaterThan(tinyAndPerfect);
  });

  it('rewards accuracy more than volume', () => {
    // Quality carries 0.85 of the score, activity 0.15.
    const accurateButQuiet = computeCohortScore({ n: 300, r: 285, p0: 0.5 });
    const busyButWrong = computeCohortScore({ n: 3000, r: 900, p0: 0.5 });

    expect(accurateButQuiet).toBeGreaterThan(busyButWrong);
  });
});

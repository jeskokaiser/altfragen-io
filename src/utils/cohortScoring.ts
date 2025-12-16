// --- Cohort scoring configuration (easy to tweak) ---
export const COHORT_PRIOR_M = 30; // pseudo-questions for Bayesian shrinkage
export const COHORT_N_REF = 200; // reference activity level for a(n)
export const COHORT_QUALITY_WEIGHT = 0.8;
export const COHORT_ACTIVITY_WEIGHT = 0.2;

// --- Cohort score helpers (keep in sync with backend implementation) ---

/**
 * Computes Bayesian-shrunk accuracy p_bayes given:
 * n = total answered, r = total correct, p0 = cohort baseline accuracy, m = prior strength.
 */
export const computeBayesianAccuracy = (params: {
  n: number;
  r: number;
  p0: number;
  m?: number;
}) => {
  const { n, r, p0, m = COHORT_PRIOR_M } = params;
  if (n < 0 || r < 0) return 0;
  if (n === 0) return p0;
  const alpha = p0 * m;
  const beta = (1 - p0) * m;
  return (r + alpha) / (n + alpha + beta);
};

/**
 * Computes activity factor a(n) in [0,1] using a logarithmic scale with cap.
 */
export const computeActivityFactor = (params: { n: number; nRef?: number }) => {
  const { n, nRef = COHORT_N_REF } = params;
  if (n <= 0) return 0;
  const numerator = Math.log(1 + n);
  const denominator = Math.log(1 + Math.max(nRef, 1));
  if (denominator <= 0) return 0;
  return Math.min(1, numerator / denominator);
};

/**
 * Computes final cohort score S in [0,100] combining quality and quantity.
 */
export const computeCohortScore = (params: {
  n: number;
  r: number;
  p0: number;
}) => {
  const { n, r, p0 } = params;
  const pBayes = computeBayesianAccuracy({ n, r, p0 });
  const a = computeActivityFactor({ n });
  const score =
    100 *
    (COHORT_QUALITY_WEIGHT * pBayes + COHORT_ACTIVITY_WEIGHT * a);
  return Math.max(0, Math.min(100, score));
};


import { Attempt } from './types';

/**
 * Calculate a score for a learner attempt.
 * @param attempt Attempt metadata available at submission time.
 * @returns Numeric score to accumulate toward the session total.
 * @todo TODO(impl): Replace placeholder with scoring heuristics.
 */
export function scoreAttempt(attempt: Attempt): number {
  // TODO(impl): Inject scoring rules once finalized.
  void attempt;
  return 0;
}

/**
 * Apply penalties for hint reveals to the base score.
 * @param score Base score before adjustments.
 * @param revealCount Count of hints revealed for the submission.
 * @returns Adjusted score after subtracting penalties.
 * @todo TODO(impl): Replace placeholder with hint penalty formula.
 */
export function applyRevealPenalty(score: number, revealCount: number): number {
  // TODO(impl): Implement reveal penalty scaling.
  void revealCount;
  return score;
}

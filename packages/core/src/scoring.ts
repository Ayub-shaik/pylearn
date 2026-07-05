import type { Attempt, HintStage } from './types';

/**
 * Calculate a score for a learner attempt.
 * @todo TODO(impl): Replace placeholder with richer scoring heuristics.
 */
export function scoreAttempt(attempt: Attempt): number {
  const baseScore = attempt.isCorrect ? 1 : 0;
  return applyRevealPenalty(baseScore, attempt.lastHintLevel);
}

/**
 * Apply penalties for hint reveals to the base score.
 * Currently subtracts a small amount per hint stage (H0→0.1, H1→0.2, H2→0.3, Reveal→0.5).
 * @todo TODO(impl): Tune penalties once UX metrics are available.
 */
export function applyRevealPenalty(score: number, level: HintStage | null | undefined): number {
  if (!level) return score;
  const penalties: Record<HintStage, number> = {
    H0: 0.1,
    H1: 0.2,
    H2: 0.3,
    REVEAL: 0.5,
  };
  const penalty = penalties[level] ?? 0;
  return Math.max(0, score - penalty);
}

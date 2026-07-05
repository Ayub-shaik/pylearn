import { Attempt, Mastery, HintStage } from './types';

const MAX_MASTERY = 100;
const MIN_MASTERY = 0;
const BASE_CORRECT_DELTA = 8;
const BASE_INCORRECT_DELTA = -5;
const HINT_PENALTY_PER_LEVEL = 2;
const REVEAL_PENALTY = 4;
const MIN_CORRECT_DELTA = 1;

const HINT_LEVEL_INDEX: Record<HintStage, number> = { H0: 0, H1: 1, H2: 2, REVEAL: 3 };

/**
 * Compute the mastery delta contributed by a single attempt.
 * Correct answers earn credit, reduced by hints/reveals used to get there.
 * Incorrect answers cost a flat penalty regardless of hints used.
 */
export function computeMasteryDelta(attempt: Attempt): number {
  if (!attempt.isCorrect) {
    return BASE_INCORRECT_DELTA;
  }

  const hintIndex = attempt.lastHintLevel ? HINT_LEVEL_INDEX[attempt.lastHintLevel] : 0;
  const revealPenalty = attempt.revealsUsed > 0 ? REVEAL_PENALTY : 0;
  const delta = BASE_CORRECT_DELTA - hintIndex * HINT_PENALTY_PER_LEVEL - revealPenalty;
  return Math.max(delta, MIN_CORRECT_DELTA);
}

/**
 * Produce an updated mastery snapshot after processing an attempt.
 * Per-lesson mastery moves by the attempt's delta; overall mastery is the
 * average across all tracked lessons.
 */
export function updateMastery(prev: Mastery, attempt: Attempt): Mastery {
  const delta = computeMasteryDelta(attempt);
  const prevLessonPercent = prev.lessonPercent[attempt.lessonId] ?? 0;
  const nextLessonPercent = clamp(prevLessonPercent + delta, MIN_MASTERY, MAX_MASTERY);

  const lessonPercent = { ...prev.lessonPercent, [attempt.lessonId]: nextLessonPercent };
  const values = Object.values(lessonPercent);
  const overallPercent = values.length
    ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
    : 0;

  return {
    overallPercent,
    lessonPercent,
    updatedAt: Date.now(),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

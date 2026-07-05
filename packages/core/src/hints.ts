import type { HintStage } from './types';

const ORDER: HintStage[] = ['H0', 'H1', 'H2', 'REVEAL'];

/**
 * Advance to the next hint level in the sequence (H0 → H1 → H2 → REVEAL).
 */
export function advanceHintLevel(current: HintStage | null | undefined): HintStage {
  if (!current) return 'H0';
  const index = ORDER.indexOf(current);
  if (index === -1 || index === ORDER.length - 1) {
    return 'REVEAL';
  }
  return ORDER[index + 1];
}

/**
 * Return how many hints have been consumed for the given level.
 */
export function hintUsageCount(level: HintStage | null | undefined): number {
  if (!level) return 0;
  const index = ORDER.indexOf(level);
  return index >= 0 ? index + 1 : 0;
}

export function isRevealStage(level: HintStage | null | undefined): boolean {
  return level === 'REVEAL';
}

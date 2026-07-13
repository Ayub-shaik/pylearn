import type { ReactElement, HTMLAttributes } from 'react';

export interface StreakChipProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  streakCount: number;
  isActive?: boolean;
  onActivate?: (_streakCount: number) => void;
}

/**
 * Highlight the learner's current streak in a compact badge.
 */
export function StreakChip({
  streakCount,
  isActive,
  onActivate,
  onClick,
  className,
  'aria-label': ariaLabel,
  ...rest
}: StreakChipProps): ReactElement {
  return (
    <div
      {...rest}
      role="button"
      tabIndex={0}
      data-component="StreakChip"
      data-streak-count={streakCount}
      data-active={isActive ?? false}
      aria-pressed={isActive ?? false}
      aria-label={ariaLabel ?? `Streak ${streakCount}`}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          onActivate?.(streakCount);
        }
      }}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs font-medium transition-colors duration-150 ${
        streakCount > 0
          ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
          : 'border-slate-800 bg-slate-900/60 text-slate-400'
      } ${className ?? ''}`}
    >
      <span aria-hidden="true">🔥</span>
      {streakCount} streak
    </div>
  );
}

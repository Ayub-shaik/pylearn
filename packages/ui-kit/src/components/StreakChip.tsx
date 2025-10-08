import type { ReactElement, HTMLAttributes } from 'react';

export interface StreakChipProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  streakCount: number;
  isActive?: boolean;
  onActivate?: (_streakCount: number) => void;
}

/**
 * Highlight the learner's current streak in a compact badge.
 * @todo TODO(impl): Replace placeholder markup with styled chip UI.
 */
export function StreakChip({
  streakCount: _streakCount,
  isActive,
  onActivate,
  onClick,
  'aria-label': ariaLabel,
  ...rest
}: StreakChipProps): ReactElement {
  return (
    <div
      {...rest}
      role="button"
      tabIndex={0}
      data-component="StreakChip"
      data-streak-count={_streakCount}
      data-active={isActive ?? false}
      aria-pressed={isActive ?? false}
      aria-label={ariaLabel ?? `Streak ${_streakCount}`}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          onActivate?.(_streakCount);
        }
      }}
    >
      Streak {_streakCount}
    </div>
  );
}

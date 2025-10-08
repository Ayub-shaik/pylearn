import type { ReactElement, HTMLAttributes } from 'react';

export type HintLevel = 'H0' | 'H1' | 'H2';

export interface HintPanelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  checkpointId: string;
  currentLevel: HintLevel | null;
  availableLevels: HintLevel[];
  isRevealed: boolean;
  onRevealNext?: (_nextLevel: HintLevel) => void;
}

/**
 * Show contextual hints with controls to reveal additional guidance.
 * @todo TODO(impl): Replace placeholder markup with progressive disclosure UI.
 */
export function HintPanel({
  checkpointId,
  currentLevel,
  availableLevels,
  isRevealed,
  onRevealNext,
  onClick,
  'aria-live': ariaLive = 'polite',
  'aria-label': ariaLabel,
  ...rest
}: HintPanelProps): ReactElement {
  const _nextLevel = availableLevels.find((level) => level !== currentLevel);

  return (
    <div
      {...rest}
      role="complementary"
      data-component="HintPanel"
      data-checkpoint-id={checkpointId}
      data-current-hint={currentLevel ?? ''}
      data-revealed={isRevealed}
      aria-live={ariaLive}
      aria-label={ariaLabel ?? 'Hint panel'}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && _nextLevel) {
          onRevealNext?.(_nextLevel);
        }
      }}
    >
      Hint level: {currentLevel ?? 'None'}
    </div>
  );
}

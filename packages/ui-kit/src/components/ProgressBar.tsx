import type { ReactElement, HTMLAttributes } from 'react';

export interface ProgressBarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  value: number;
  max: number;
  label?: string;
  variant?: 'default' | 'success' | 'warning';
}

/**
 * Communicate progress toward a goal using a determinate bar representation.
 * @todo TODO(impl): Replace placeholder markup with styled progress bar.
 */
export function ProgressBar({
  value,
  max,
  label,
  variant = 'default',
  'aria-label': ariaLabel,
  ...rest
}: ProgressBarProps): ReactElement {
  const clampedValue = Number.isFinite(value) ? Math.max(0, Math.min(value, max)) : 0;

  return (
    <div
      {...rest}
      role="progressbar"
      data-component="ProgressBar"
      data-variant={variant}
      aria-valuemin={0}
      aria-valuenow={clampedValue}
      aria-valuemax={max}
      aria-label={ariaLabel ?? label ?? 'Progress'}
    >
      {label ?? 'Progress'}: {clampedValue}/{max}
    </div>
  );
}

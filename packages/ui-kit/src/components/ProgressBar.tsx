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

  const percent = max > 0 ? Math.round((clampedValue / max) * 100) : 0;
  const color =
    variant === 'success'
      ? 'bg-emerald-500'
      : variant === 'warning'
        ? 'bg-amber-500'
        : 'bg-primary';

  return (
    <div {...rest} className="space-y-1" aria-label={ariaLabel ?? label ?? 'Progress'}>
      {label ? <p className="text-xs font-medium text-slate-300">{label}</p> : null}
      <div
        role="progressbar"
        data-component="ProgressBar"
        data-variant={variant}
        aria-valuemin={0}
        aria-valuenow={clampedValue}
        aria-valuemax={max}
        className="h-2 w-full overflow-hidden rounded-full bg-slate-800"
      >
        <div
          className={`${color} h-full transition-all duration-300`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs text-slate-400">
        {clampedValue}/{max} ({percent}%)
      </p>
    </div>
  );
}

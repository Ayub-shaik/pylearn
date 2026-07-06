import type { ReactElement, HTMLAttributes } from 'react';

export interface ProgressRingProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  variant?: 'default' | 'success' | 'warning';
  label?: string;
}

const STROKE_COLOR: Record<NonNullable<ProgressRingProps['variant']>, string> = {
  default: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
};

/**
 * Compact circular progress indicator for module/track-level completion,
 * used where a full-width ProgressBar would be too heavy (roadmap sidebar).
 */
export function ProgressRing({
  value,
  max,
  size = 40,
  strokeWidth = 4,
  variant = 'default',
  label,
  'aria-label': ariaLabel,
  className,
  ...rest
}: ProgressRingProps): ReactElement {
  const clampedValue = Number.isFinite(value) ? Math.max(0, Math.min(value, max)) : 0;
  const percent = max > 0 ? Math.round((clampedValue / max) * 100) : 0;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);
  const center = size / 2;

  return (
    <div
      {...rest}
      role="progressbar"
      data-component="ProgressRing"
      data-variant={variant}
      aria-valuemin={0}
      aria-valuenow={clampedValue}
      aria-valuemax={max}
      aria-label={ariaLabel ?? label ?? 'Progress'}
      className={`relative inline-flex items-center justify-center ${className ?? ''}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={STROKE_COLOR[variant]}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[0.6rem] font-medium text-slate-200">{percent}%</span>
    </div>
  );
}

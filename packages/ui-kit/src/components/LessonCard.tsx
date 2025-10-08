import type { ReactElement, HTMLAttributes, MouseEvent } from 'react';

export interface LessonCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  lessonId: string;
  title: string;
  summary: string;
  durationMinutes?: number;
  progressPercent?: number;
  isActive?: boolean;
  onSelectLesson?: (_lessonId: string) => void;
}

/**
 * Present summary metadata for a lesson the learner can pick.
 * @todo TODO(impl): Replace placeholder markup with the production card UI.
 */
export function LessonCard({
  lessonId: _lessonId,
  title,
  summary,
  durationMinutes,
  progressPercent,
  isActive,
  onSelectLesson,
  onFocus,
  onBlur,
  onClick,
  'aria-label': ariaLabel,
  ...rest
}: LessonCardProps): ReactElement {
  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    onClick?.(event);
    if (!event.defaultPrevented) {
      onSelectLesson?.(_lessonId);
    }
  };

  return (
    <div
      {...rest}
      role="group"
      tabIndex={0}
      data-component="LessonCard"
      data-lesson-id={_lessonId}
      data-active={isActive ?? false}
      data-progress={progressPercent ?? undefined}
      data-duration={durationMinutes ?? undefined}
      aria-label={ariaLabel ?? `Lesson ${title}`}
      onClick={handleClick}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      {title} — {summary}
    </div>
  );
}

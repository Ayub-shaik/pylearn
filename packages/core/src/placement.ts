export type StartingLevel = 'new' | 'basics' | 'loops' | 'scripts';

/**
 * Lesson to start a learner at based on their onboarding self-assessment.
 * Only a handful of lessons exist today, so this is a small lookup, not an
 * adaptive engine — it grows as content grows.
 */
const STARTING_LESSON_BY_LEVEL: Record<StartingLevel, string> = {
  new: 'lesson.python.basics.getting-started',
  basics: 'lesson.python.basics.variables',
  loops: 'lesson.python.basics.types',
  scripts: 'lesson.python.basics.types',
};

export function recommendedStartingLessonId(level: StartingLevel): string {
  return STARTING_LESSON_BY_LEVEL[level];
}

export function isStartingLevel(value: string | null | undefined): value is StartingLevel {
  return value !== null && value !== undefined && value in STARTING_LESSON_BY_LEVEL;
}

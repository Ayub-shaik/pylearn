export type StartingLevel = 'new' | 'basics' | 'loops' | 'scripts';
export type LearningGoal = 'general' | 'devops' | 'network';

export interface OnboardingAnswers {
  startingLevel: StartingLevel;
  learningGoal: LearningGoal;
}

export const STARTING_LEVEL_OPTIONS: { value: StartingLevel; label: string }[] = [
  { value: 'new', label: "I'm new to programming" },
  { value: 'basics', label: 'I know the basics (variables, types)' },
  { value: 'loops', label: 'I know loops & functions' },
  { value: 'scripts', label: "I've written scripts before" },
];

export const LEARNING_GOAL_OPTIONS: { value: LearningGoal; label: string }[] = [
  { value: 'general', label: 'General Python' },
  { value: 'devops', label: 'Automation for DevOps' },
  { value: 'network', label: 'Automation for networking' },
];

/**
 * Recommended lesson to jump to based on prior-knowledge self-assessment.
 * Only two lessons exist today, so this is a small lookup, not an adaptive
 * engine — it grows as content grows.
 */
const STARTING_LESSON_BY_LEVEL: Record<StartingLevel, string> = {
  new: 'lesson.python.basics.variables',
  basics: 'lesson.python.basics.variables',
  loops: 'lesson.python.basics.types',
  scripts: 'lesson.python.basics.types',
};

export function recommendedStartingLessonId(level: StartingLevel): string {
  return STARTING_LESSON_BY_LEVEL[level];
}

const LOCAL_STORAGE_KEY = 'pylearn:onboarding';

export function loadLocalOnboarding(): OnboardingAnswers | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as OnboardingAnswers) : undefined;
  } catch {
    return undefined;
  }
}

export function saveLocalOnboarding(answers: OnboardingAnswers): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(answers));
}

import type { Lesson, Mastery, Module, SessionState, Track } from './types';

/**
 * Clear all attempts and mastery for a single module's lessons, and point the
 * session back at its first checkpoint — a "retake this module" action.
 * Other modules' progress is untouched.
 */
export function resetModuleProgress(
  track: Track,
  session: SessionState,
  moduleId: string,
): SessionState {
  const module = track.modules.find((candidate) => candidate.id === moduleId);
  if (!module) return session;

  const lessonIds = new Set(module.lessons.map((lesson) => lesson.id));
  const attempts = session.attempts.filter((attempt) => !lessonIds.has(attempt.lessonId));

  const lessonPercent = { ...session.mastery.lessonPercent };
  for (const lessonId of lessonIds) {
    delete lessonPercent[lessonId];
  }
  const values = Object.values(lessonPercent);
  const overallPercent = values.length
    ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
    : 0;

  const mastery: Mastery = {
    ...session.mastery,
    lessonPercent,
    overallPercent,
    updatedAt: Date.now(),
  };
  const firstLesson = module.lessons[0];
  const firstCheckpoint = firstLesson?.checkpoints[0];

  return {
    ...session,
    attempts,
    mastery,
    currentLessonId: firstLesson?.id ?? session.currentLessonId,
    currentCheckpointId: firstCheckpoint?.id ?? session.currentCheckpointId,
    completedAt: undefined,
  };
}

/** A lesson only counts as "done" once its running mastery score clears this bar. */
export const MASTERY_COMPLETION_THRESHOLD = 80;

export function lessonProgressPercent(mastery: Mastery, lessonId: string): number {
  return mastery.lessonPercent[lessonId] ?? 0;
}

export function isLessonComplete(mastery: Mastery, lessonId: string): boolean {
  return lessonProgressPercent(mastery, lessonId) >= MASTERY_COMPLETION_THRESHOLD;
}

export function isModuleComplete(module: Module, mastery: Mastery): boolean {
  if (module.lessons.length === 0) return false;
  return module.lessons.every((lesson) => isLessonComplete(mastery, lesson.id));
}

function moduleProgressPercent(module: Module, mastery: Mastery): number {
  if (module.lessons.length === 0) return 0;
  const total = module.lessons.reduce(
    (sum, lesson) => sum + lessonProgressPercent(mastery, lesson.id),
    0,
  );
  return Math.round(total / module.lessons.length);
}

export type ModuleStatus = 'completed' | 'current' | 'locked' | 'available';
export type LessonStatus = 'completed' | 'current' | 'locked' | 'available';

export interface RoadmapLessonView {
  lesson: Lesson;
  status: LessonStatus;
  progressPercent: number;
}

export interface RoadmapModuleView {
  module: Module;
  status: ModuleStatus;
  progressPercent: number;
  lessons: RoadmapLessonView[];
}

export interface RoadmapView {
  track: Track;
  modules: RoadmapModuleView[];
  overallProgressPercent: number;
}

/**
 * Build the module/lesson tree the roadmap sidebar renders, deriving status
 * and progress purely from the track's own content plus the learner's
 * mastery/session cursor — no separate roadmap state is persisted anywhere.
 */
export function buildRoadmapView(track: Track, session: SessionState): RoadmapView {
  const mastery = session.mastery;
  const moduleById = new Map(track.modules.map((module) => [module.id, module]));

  const modules: RoadmapModuleView[] = track.modules.map((module) => {
    const prerequisitesMet = (module.prerequisites ?? []).every((prereqId) => {
      const prereq = moduleById.get(prereqId);
      return prereq ? isModuleComplete(prereq, mastery) : true;
    });

    const complete = isModuleComplete(module, mastery);
    const containsCurrentLesson = module.lessons.some(
      (lesson) => lesson.id === session.currentLessonId,
    );

    const moduleStatus: ModuleStatus = !prerequisitesMet
      ? 'locked'
      : complete
        ? 'completed'
        : containsCurrentLesson
          ? 'current'
          : 'available';

    const lessons: RoadmapLessonView[] = module.lessons.map((lesson) => {
      const lessonComplete = isLessonComplete(mastery, lesson.id);
      const lessonStatus: LessonStatus =
        moduleStatus === 'locked'
          ? 'locked'
          : lessonComplete
            ? 'completed'
            : lesson.id === session.currentLessonId
              ? 'current'
              : 'available';

      return {
        lesson,
        status: lessonStatus,
        progressPercent: lessonProgressPercent(mastery, lesson.id),
      };
    });

    return {
      module,
      status: moduleStatus,
      progressPercent: moduleProgressPercent(module, mastery),
      lessons,
    };
  });

  const overallProgressPercent = modules.length
    ? Math.round(modules.reduce((sum, m) => sum + m.progressPercent, 0) / modules.length)
    : 0;

  return { track, modules, overallProgressPercent };
}

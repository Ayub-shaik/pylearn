import { updateMastery } from './mastery';
import { scoreAttempt } from './scoring';
import {
  Attempt,
  Checkpoint,
  CheckpointRef,
  Lesson,
  Mastery,
  SessionState,
  SessionSummary,
  SubmissionFeedback,
  Track,
} from './types';

const DEFAULT_OVERALL_MASTERY = 0;

export interface SubmissionOutcome {
  session: SessionState;
  feedback: SubmissionFeedback;
}

export interface StartSessionOptions {
  /** Skip straight to this lesson's first checkpoint (e.g. onboarding placement). */
  startingLessonId?: string;
}

export function startSession(track: Track, options?: StartSessionOptions): SessionState {
  const baseMastery: Mastery = {
    overallPercent: DEFAULT_OVERALL_MASTERY,
    lessonPercent: buildLessonPercentMap(track),
    updatedAt: Date.now(),
  };

  const emptySession: SessionState = {
    id: `session-${Date.now()}`,
    trackId: track.id,
    attempts: [],
    mastery: baseMastery,
    startedAt: Date.now(),
  };

  const firstRef =
    firstCheckpointOfLesson(track, options?.startingLessonId) ??
    selectNextCheckpoint(track, emptySession);
  return {
    ...emptySession,
    currentLessonId: firstRef?.lessonId,
    currentCheckpointId: firstRef?.checkpointId,
  };
}

export function firstCheckpointOfLesson(
  track: Track,
  lessonId?: string,
): CheckpointRef | undefined {
  if (!lessonId) return undefined;
  const lesson = findLesson(track, lessonId);
  const checkpoint = lesson?.checkpoints[0];
  return checkpoint ? { lessonId, checkpointId: checkpoint.id } : undefined;
}

export function selectNextCheckpoint(
  track: Track,
  session: SessionState,
): CheckpointRef | undefined {
  const attempted = new Set(session.attempts.map((attempt) => attempt.checkpointId));
  return flattenCheckpoints(track).find((ref) => !attempted.has(ref.checkpointId));
}

export function submitAnswer(
  track: Track,
  session: SessionState,
  attempt: Attempt,
): SubmissionOutcome {
  const checkpoint = resolveCheckpoint(track, {
    lessonId: attempt.lessonId,
    checkpointId: attempt.checkpointId,
  });

  const evaluation = evaluateAttempt(checkpoint, attempt);
  const recordedAttempt: Attempt = {
    ...attempt,
    timestamp: attempt.timestamp ?? Date.now(),
    isCorrect: evaluation.correct,
    revealsUsed: attempt.revealsUsed ?? 0,
    lastHintLevel: attempt.lastHintLevel,
  };
  recordedAttempt.score = scoreAttempt(recordedAttempt);

  const updatedAttempts = [...session.attempts, recordedAttempt];
  const updatedMastery: Mastery = updateMastery(session.mastery, recordedAttempt);

  const updatedSession: SessionState = {
    ...session,
    attempts: updatedAttempts,
    mastery: updatedMastery,
  };

  const nextRef = selectNextCheckpoint(track, updatedSession);
  const sessionWithCursor: SessionState = {
    ...updatedSession,
    currentLessonId: nextRef?.lessonId ?? updatedSession.currentLessonId,
    currentCheckpointId: nextRef?.checkpointId,
    completedAt: nextRef ? updatedSession.completedAt : (updatedSession.completedAt ?? Date.now()),
  };

  return {
    session: sessionWithCursor,
    feedback: {
      correct: evaluation.correct,
      rationale: evaluation.rationale,
      next: nextRef,
    },
  };
}

export function getSummary(track: Track, session: SessionState): SessionSummary {
  void track;
  const totalScore = session.attempts.reduce((sum, attempt) => sum + (attempt.score ?? 0), 0);
  return {
    attempts: session.attempts,
    totalScore,
    mastery: session.mastery,
  };
}

export function resolveCheckpoint(track: Track, ref: CheckpointRef): Checkpoint | undefined {
  const lesson = findLesson(track, ref.lessonId);
  return lesson?.checkpoints.find((checkpoint) => checkpoint.id === ref.checkpointId);
}

function evaluateAttempt(checkpoint: Checkpoint | undefined, attempt: Attempt) {
  if (!checkpoint) {
    return {
      correct: attempt.isCorrect,
      rationale: 'Checkpoint content is unavailable.',
    };
  }

  switch (checkpoint.type) {
    case 'quiz-mcq': {
      const option = checkpoint.options.find((item) => item.id === attempt.selectedOptionId);
      const correct = option?.isCorrect ?? false;
      const rationale = correct
        ? (option?.whyRight ?? option?.explanation ?? 'No explanation provided.')
        : (option?.whyWrong ?? option?.explanation ?? 'No explanation provided.');
      return { correct, rationale };
    }
    case 'fill-blank': {
      const expected = checkpoint.answer.trim();
      const response = (attempt.responseText ?? '').trim();
      const correct = response.localeCompare(expected, undefined, { sensitivity: 'accent' }) === 0;
      return { correct, rationale: checkpoint.explanation };
    }
    case 'code-cell':
    case 'note':
    default:
      return { correct: attempt.isCorrect, rationale: checkpoint.explanation };
  }
}

function flattenLessons(track: Track): Lesson[] {
  return track.modules.flatMap((module) => module.lessons);
}

function flattenCheckpoints(track: Track): CheckpointRef[] {
  const refs: CheckpointRef[] = [];
  for (const module of track.modules) {
    for (const lesson of module.lessons) {
      for (const checkpoint of lesson.checkpoints) {
        refs.push({ lessonId: lesson.id, checkpointId: checkpoint.id });
      }
    }
  }
  return refs;
}

function findLesson(track: Track, lessonId?: string): Lesson | undefined {
  if (!lessonId) return undefined;
  return flattenLessons(track).find((lesson) => lesson.id === lessonId);
}

function buildLessonPercentMap(track: Track): Record<string, number> {
  const entries = flattenLessons(track).map(
    (lesson) => [lesson.id, DEFAULT_OVERALL_MASTERY] as const,
  );
  return Object.fromEntries(entries);
}

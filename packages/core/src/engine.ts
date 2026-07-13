import { updateMastery } from './mastery';
import { isModuleComplete } from './roadmap';
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

// Only a *correct* attempt marks a checkpoint as done — a wrong attempt
// must not be skipped over, otherwise the learner gets silently advanced
// past a question they never actually got right. This is the single
// definition of "attempted" for checkpoint-progression purposes; every
// function in this module that needs it calls this helper instead of
// re-deriving its own set, so the definition can't drift out of sync with
// itself the way it once did between this file and the frontend store.
function correctlyAttemptedIds(attempts: Attempt[]): Set<string> {
  return new Set(
    attempts.filter((attempt) => attempt.isCorrect).map((attempt) => attempt.checkpointId),
  );
}

/**
 * Find the next checkpoint to work on: the current lesson's next
 * unattempted checkpoint, or the first unattempted checkpoint of the next
 * lesson going forward. Deliberately never looks at lessons before the
 * current one — otherwise a learner who skipped an earlier lesson via
 * onboarding placement would get yanked backward into it the moment they
 * finish a checkpoint, since it remains "unattempted" forever. Skipped
 * lessons stay reachable manually via Tracks, just not auto-advanced into.
 *
 * Crossing into a new module is gated on the preceding module clearing the
 * mastery completion threshold — otherwise a learner could breeze through
 * one quiz per lesson and get auto-advanced into unrelated new material
 * with no real depth. Lesson-to-lesson advancement *within* the same
 * module is unaffected; this only holds at module boundaries.
 */
export function selectNextCheckpoint(
  track: Track,
  session: SessionState,
): CheckpointRef | undefined {
  const attempted = correctlyAttemptedIds(session.attempts);
  const orderedLessons = flattenLessons(track);
  const currentIndex = session.currentLessonId
    ? orderedLessons.findIndex((lesson) => lesson.id === session.currentLessonId)
    : -1;
  const searchFrom = currentIndex === -1 ? 0 : currentIndex;

  let boundaryModuleId = orderedLessons[searchFrom]?.moduleId;

  for (let i = searchFrom; i < orderedLessons.length; i += 1) {
    const lesson = orderedLessons[i];
    if (boundaryModuleId && lesson.moduleId !== boundaryModuleId) {
      const precedingModule = track.modules.find((candidate) => candidate.id === boundaryModuleId);
      if (precedingModule && !isModuleComplete(precedingModule, session.mastery)) {
        return undefined;
      }
      boundaryModuleId = lesson.moduleId;
    }

    const checkpoint = lesson.checkpoints.find((candidate) => !attempted.has(candidate.id));
    if (checkpoint) {
      return { lessonId: lesson.id, checkpointId: checkpoint.id };
    }
  }
  return undefined;
}

/**
 * Find the first not-yet-correctly-attempted checkpoint within one specific
 * lesson. Unlike selectNextCheckpoint, this never looks beyond the given
 * lesson and ignores module-completion gating — it answers "where should
 * this particular lesson resume," not "what's next across the whole
 * curriculum." Use this when a learner explicitly opens a lesson (a Tracks
 * card, a bookmarked URL); use selectNextCheckpoint when auto-advancing
 * after a correct answer.
 */
export function firstUnattemptedCheckpointInLesson(
  track: Track,
  session: SessionState,
  lessonId: string,
): CheckpointRef | undefined {
  const lesson = findLesson(track, lessonId);
  if (!lesson) return undefined;
  const attempted = correctlyAttemptedIds(session.attempts);
  const checkpoint = lesson.checkpoints.find((candidate) => !attempted.has(candidate.id));
  return checkpoint ? { lessonId, checkpointId: checkpoint.id } : undefined;
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

  // A wrong attempt must not move the cursor forward — the learner stays on
  // the same checkpoint until they get it right (or reveal the answer), so
  // the session they'd resume into (e.g. after a refresh) always matches
  // what they're actually looking at.
  if (!recordedAttempt.isCorrect) {
    return {
      session: {
        ...updatedSession,
        currentLessonId: attempt.lessonId,
        currentCheckpointId: attempt.checkpointId,
      },
      feedback: {
        correct: false,
        rationale: evaluation.rationale,
        next: undefined,
      },
    };
  }

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

/**
 * Count of distinct checkpoints with at least one *correct* attempt —
 * the right measure for "completed" progress. attempts.length overcounts:
 * a wrong answer and every subsequent "Try again" retry each add a new
 * Attempt record for the same checkpoint, which would otherwise inflate a
 * progress bar every time someone retries, not just when they finish
 * something new.
 */
export function countCompletedCheckpoints(attempts: Attempt[]): number {
  return correctlyAttemptedIds(attempts).size;
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
      // Neither type has a "wrong" state today (notes are just acknowledged;
      // code-cell doesn't validate execution output yet) — always correct,
      // rather than trusting attempt.isCorrect. That field isn't a reliable
      // signal here: the authenticated API route doesn't (and shouldn't have
      // to) know per-checkpoint-type semantics, so it can't be trusted to
      // send true for these two types the way the anonymous client does.
      return { correct: true, rationale: checkpoint.explanation };
  }
}

function flattenLessons(track: Track): Lesson[] {
  return track.modules.flatMap((module) => module.lessons);
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

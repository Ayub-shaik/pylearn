import {
  Attempt,
  CheckpointRef,
  CurriculumData,
  EngineContext,
  HintLevel,
  Lesson,
  Checkpoint,
  Mastery,
  Module,
  SessionState,
  SessionSummary,
  Track,
} from './types';

const DEFAULT_MASTERY: Mastery = {
  overallPercent: 0,
  lessonPercent: {},
  updatedAt: Date.now(),
};

/**
 * Load curriculum data and initialise the engine context.
 * @param track Top-level track definition.
 * @param modules Modules associated with the track.
 * @param lessons Full lesson objects grouped under the modules.
 * @returns Engine context that can be shared across sessions.
 * @todo TODO(impl): Replace placeholder aggregation with real loaders.
 */
export function loadCurriculum(track: Track, modules: Module[], lessons: Lesson[]): EngineContext {
  // TODO(impl): Parse JSON content and precompute lookups.
  const curriculum: CurriculumData = { track, modules, lessons };
  return {
    curriculum,
    mastery: { ...DEFAULT_MASTERY },
  };
}

/**
 * Start a new learner session against the provided engine context.
 * @param context Engine context returned by loadCurriculum.
 * @returns New session state ready to accept attempts.
 * @todo TODO(impl): Persist and hydrate prior mastery/attempt history.
 */
export function startSession(context: EngineContext): SessionState {
  // TODO(impl): Attach learner identity and restore persisted mastery.
  return {
    id: `session-${Date.now()}`,
    attempts: [],
    mastery: { ...context.mastery },
    startedAt: Date.now(),
  };
}

/**
 * Submit an attempt and produce an updated session state.
 * @param context Shared engine context (mutable state lives in session).
 * @param session Current session state.
 * @param attempt Attempt metadata to record.
 * @returns Updated session state including the recorded attempt.
 * @todo TODO(impl): Apply scoring, mastery updates, and branching logic.
 */
export function submitAnswer(
  context: EngineContext,
  session: SessionState,
  attempt: Attempt,
): SessionState {
  // TODO(impl): Integrate scoring and mastery once implemented.
  void context;
  return {
    ...session,
    attempts: [...session.attempts, attempt],
    mastery: { ...session.mastery },
  };
}

/**
 * Retrieve hint content for a checkpoint at the requested hint level.
 * @param ref Reference to the checkpoint within the curriculum.
 * @param level Hint level being requested (H0/H1/H2).
 * @param context Engine context hosting the curriculum content.
 * @returns Hint copy, or empty string if unavailable.
 * @todo TODO(impl): Add guardrails and analytics for hint usage.
 */
export function getHint(ref: CheckpointRef, level: HintLevel, context: EngineContext): string {
  // TODO(impl): Lookup checkpoint content safely and localise if required.
  void ref;
  void level;
  void context;
  return '';
}

/**
 * Produce a session summary for display to the learner.
 * @param session Session state with attempts collected so far.
 * @returns Summary object containing attempts, score, and mastery snapshot.
 * @todo TODO(impl): Include achievements, streaks, and qualitative feedback.
 */
export function getSummary(session: SessionState): SessionSummary {
  // TODO(impl): Calculate total score and narrative summary once scoring exists.
  return {
    attempts: session.attempts,
    totalScore: 0,
    mastery: { ...session.mastery },
  };
}

/**
 * Convenience helper to locate checkpoint metadata within the curriculum.
 * @param context Engine context used to traverse lessons.
 * @param ref Reference pointing to the desired checkpoint.
 * @returns Resolved checkpoint or undefined.
 * @todo TODO(impl): Optimise lookups with hashed indices.
 */
export function resolveCheckpoint(
  context: EngineContext,
  ref: CheckpointRef,
): Checkpoint | undefined {
  // TODO(impl): Build fast lookup maps during curriculum load.
  const lesson = context.curriculum.lessons.find((candidate) => candidate.id === ref.lessonId);
  return lesson?.checkpoints.find((checkpoint) => checkpoint.id === ref.checkpointId);
}

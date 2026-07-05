import type { CheckpointRef, SessionState, Track } from './types';

export interface AdaptiveContext {
  /** Track data used by the adaptive policy. */
  track: Track;
  /** Active session metadata already persisted */
  session: SessionState;
}

/**
 * Placeholder adaptive selector that currently defers to sequential ordering.
 * @todo TODO(impl): Incorporate mastery signals and attempt history.
 */
export function selectAdaptiveCheckpoint(context: AdaptiveContext): CheckpointRef {
  void context;
  return {
    lessonId: '',
    checkpointId: '',
  };
}

import { CheckpointRef, EngineContext, SessionState } from './types';

export interface AdaptiveContext {
  /** Shared engine context containing curriculum and mastery state */
  engine: EngineContext;
  /** Active session metadata already persisted */
  session: SessionState;
}

/**
 * Select the next checkpoint reference based on the adaptive strategy.
 * @param context Aggregated engine and session state.
 * @returns Reference to the next checkpoint to deliver.
 * @todo TODO(impl): Replace placeholder with adaptive selection strategy.
 */
export function selectNextCheckpoint(context: AdaptiveContext): CheckpointRef {
  // TODO(impl): Evaluate mastery and recent attempts to pick the next checkpoint.
  void context;
  return {
    lessonId: '',
    checkpointId: '',
  };
}

import type { ASREngine, ASREngineConfig, ASRResult } from '../../types';

/**
 * Whisper.cpp wrapper stub.
 * @todo TODO(impl): Bridge to native bindings with streaming support.
 */
export class WhisperCppASR implements ASREngine {
  readonly name = 'whisper.cpp';
  locale?: string;

  async load(_config: ASREngineConfig): Promise<void> {
    // TODO(impl): Load model into memory and prepare decoder graph.
    this.locale = _config.locale;
    void _config.modelPath;
  }

  async transcribe(_input: ArrayBuffer | Float32Array): Promise<ASRResult> {
    // TODO(impl): Run inference via whisper.cpp bindings.
    void _input;
    return {
      transcript: '',
      confidence: 0,
    };
  }

  async dispose(): Promise<void> {
    // TODO(impl): Release native resources and workers.
  }
}

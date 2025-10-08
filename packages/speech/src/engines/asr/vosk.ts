import type { ASREngine, ASREngineConfig, ASRResult } from '../../types';

/**
 * Vosk ASR stub implementation.
 * @todo TODO(impl): Connect to Vosk WASM/native runtime.
 */
export class VoskASR implements ASREngine {
  readonly name = 'vosk';
  locale?: string;

  async load(_config: ASREngineConfig): Promise<void> {
    // TODO(impl): Initialize recognizer with the specified model.
    this.locale = _config.locale;
    void _config.modelPath;
  }

  async transcribe(_input: ArrayBuffer | Float32Array): Promise<ASRResult> {
    // TODO(impl): Call Vosk recognizer and accumulate results.
    void _input;
    return {
      transcript: '',
      confidence: 0,
    };
  }

  async dispose(): Promise<void> {
    // TODO(impl): Free recognizer resources.
  }
}

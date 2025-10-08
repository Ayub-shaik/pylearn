import type { TTSEngine, TTSEngineConfig, VoiceSettings } from '../../types';

/**
 * Piper TTS stub implementation.
 * @todo TODO(impl): Hook into Piper runtime to stream synthesized audio.
 */
export class PiperTTS implements TTSEngine {
  readonly name = 'piper';
  locale?: string;

  async load(_config: TTSEngineConfig): Promise<void> {
    // TODO(impl): Load voice model and configuration files.
    this.locale = _config.voice;
    void _config.modelPath;
  }

  async synthesize(_text: string, _settings?: VoiceSettings): Promise<ArrayBuffer> {
    // TODO(impl): Route text through Piper and return PCM data.
    void _text;
    void _settings;
    return new ArrayBuffer(0);
  }

  async dispose(): Promise<void> {
    // TODO(impl): Release TTS engine resources.
  }
}

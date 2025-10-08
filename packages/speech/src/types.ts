export interface ASRResult {
  transcript: string;
  confidence: number;
  segments?: Array<{
    text: string;
    start: number;
    end: number;
    confidence?: number;
  }>;
}

export interface ASREngineConfig {
  modelPath: string;
  locale?: string;
}

export interface ASREngine {
  readonly name: string;
  readonly locale?: string;
  load(_config: ASREngineConfig): Promise<void>;
  transcribe(_input: ArrayBuffer | Float32Array): Promise<ASRResult>;
  dispose(): Promise<void>;
}

export interface VoiceSettings {
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  locale?: string;
}

export interface TTSEngineConfig {
  modelPath: string;
  voice?: string;
}

export interface TTSEngine {
  readonly name: string;
  readonly locale?: string;
  load(_config: TTSEngineConfig): Promise<void>;
  synthesize(_text: string, _settings?: VoiceSettings): Promise<ArrayBuffer>;
  dispose(): Promise<void>;
}

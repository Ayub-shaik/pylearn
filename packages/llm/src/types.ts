export type LLMProvider = 'browser' | 'ollama';

export type HintLevel = 'H0' | 'H1' | 'H2';

export interface HintRequest {
  /** Identifier for the lesson associated with the hint request */
  lessonId: string;
  /** Identifier for the checkpoint the learner is on */
  checkpointId: string;
  /** Desired hint tier to generate */
  hintLevel: HintLevel;
  /** Prompt constructed for the provider */
  prompt: string;
  /** Optional contextual snippets supplied to the model */
  context?: string[];
}

export interface OptionRationaleRequest {
  /** Identifier for the lesson containing the option */
  lessonId: string;
  /** Identifier for the checkpoint (quiz) */
  checkpointId: string;
  /** Option identifier needing an explanation */
  optionId: string;
  /** Raw text of the option presented to the learner */
  optionText: string;
  /** Whether the option is correct so the model can justify appropriately */
  isCorrect: boolean;
  /** Prompt constructed for the explanation request */
  prompt: string;
  /** Additional context snippets to ground the response */
  context?: string[];
}

export interface Rationale {
  optionId: string;
  explanation: string;
  confidence?: number;
}

export interface LLMResponse<TPayload = unknown> {
  provider: LLMProvider;
  model: string;
  latencyMs?: number;
  output: TPayload;
  raw?: unknown;
}

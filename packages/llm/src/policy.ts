import type { LLMProvider } from './types';

export interface ProviderEnvironment {
  webGpuAvailable?: boolean;
  ollamaReachable?: boolean;
}

/**
 * Select the provider to use for a request.
 * @todo TODO(impl): Incorporate environment signals and cached probe results.
 */
export function selectProvider(env: ProviderEnvironment, userSetting?: LLMProvider): LLMProvider {
  if (userSetting === 'browser') {
    return 'browser';
  }

  if (userSetting === 'ollama') {
    return env.ollamaReachable ? 'ollama' : 'browser';
  }

  if (env.ollamaReachable) {
    return 'ollama';
  }

  return 'browser';
}

export type ModelTask = 'explain' | 'code_hint';

interface ModelPolicy {
  provider: LLMProvider;
  model: string;
}

/**
 * Resolve the model/provider pair for a specific task.
 * @todo TODO(impl): Wire to real policy table and feature flags.
 */
export function modelPolicy(task: ModelTask): ModelPolicy {
  // TODO(impl): Pull from central policy definitions with dynamic overrides.
  if (task === 'code_hint') {
    return { provider: 'browser', model: 'qwen2.5-coder:7b' };
  }
  return { provider: 'browser', model: 'qwen2.5-instruct-1.5b' };
}

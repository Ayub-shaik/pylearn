import { config } from '../config';

export interface GenerateOptions {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

interface OllamaGenerateResponse {
  response?: string;
}

interface NvidiaChatResponse {
  choices?: { message?: { content?: string } }[];
}

export async function generateWithOllama(options: GenerateOptions): Promise<string | undefined> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.ollama.timeoutMs);

  try {
    const response = await fetch(`${config.ollama.baseUrl}/api/generate`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.ollama.model,
        prompt: options.prompt,
        stream: false,
        options: {
          num_predict: options.maxTokens ?? 150,
          temperature: options.temperature ?? 0.4,
        },
      }),
    });

    if (!response.ok) return undefined;
    const data = (await response.json()) as OllamaGenerateResponse;
    return data.response?.trim();
  } catch {
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateWithNvidiaNim(options: GenerateOptions): Promise<string | undefined> {
  if (!config.llmOverflow.enabled || !config.llmOverflow.nvidiaApiKey) return undefined;

  try {
    const response = await fetch(`${config.llmOverflow.nvidiaBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.llmOverflow.nvidiaApiKey}`,
      },
      body: JSON.stringify({
        model: config.llmOverflow.nvidiaModel,
        messages: [{ role: 'user', content: options.prompt }],
        max_tokens: options.maxTokens ?? 150,
        temperature: options.temperature ?? 0.4,
      }),
    });

    if (!response.ok) return undefined;
    const data = (await response.json()) as NvidiaChatResponse;
    return data.choices?.[0]?.message?.content?.trim();
  } catch {
    return undefined;
  }
}

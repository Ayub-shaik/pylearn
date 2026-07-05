import { and, desc, eq } from 'drizzle-orm';

import { config } from '../config';
import { db, schema } from '../db/client';

import { generateWithNvidiaNim, generateWithOllama } from './client';
import { canAttemptOllama, looksGrounded, withOllamaSlot } from './guardrails';

import { probeOllama } from '@pylearn/llm';

export interface GenerationRequest {
  checkpointId: string;
  task: string;
  prompt: string;
  groundingTerms: string[];
  fallback: string;
}

export type GenerationProvider = 'cache' | 'ollama' | 'nvidia-nim' | 'template';

export interface GenerationResult {
  content: string;
  provider: GenerationProvider;
}

/**
 * Tiered generation: cache -> local Ollama -> NVIDIA NIM overflow -> deterministic template.
 * Each tier only proceeds if the prior tier misses or fails; grounding is checked before
 * trusting any live-generated output.
 */
export async function generate(request: GenerationRequest): Promise<GenerationResult> {
  const cached = await getCached(request.checkpointId, request.task);
  if (cached) return { content: cached, provider: 'cache' };

  if (canAttemptOllama() && (await probeOllama(config.ollama.baseUrl, 300))) {
    const output = await withOllamaSlot(() => generateWithOllama({ prompt: request.prompt }));
    if (output && looksGrounded(output, request.groundingTerms)) {
      await cacheResult(request.checkpointId, request.task, output, 'ollama');
      return { content: output, provider: 'ollama' };
    }
  }

  const overflow = await generateWithNvidiaNim({ prompt: request.prompt });
  if (overflow && looksGrounded(overflow, request.groundingTerms)) {
    await cacheResult(request.checkpointId, request.task, overflow, 'nvidia-nim');
    return { content: overflow, provider: 'nvidia-nim' };
  }

  return { content: request.fallback, provider: 'template' };
}

async function getCached(checkpointId: string, task: string): Promise<string | undefined> {
  const rows = await db
    .select({ content: schema.llmGenerations.content })
    .from(schema.llmGenerations)
    .where(
      and(
        eq(schema.llmGenerations.checkpointId, checkpointId),
        eq(schema.llmGenerations.task, task),
      ),
    )
    .orderBy(desc(schema.llmGenerations.createdAt))
    .limit(1);
  return rows[0]?.content;
}

async function cacheResult(
  checkpointId: string,
  task: string,
  content: string,
  provider: string,
): Promise<void> {
  await db.insert(schema.llmGenerations).values({ checkpointId, task, content, provider });
}

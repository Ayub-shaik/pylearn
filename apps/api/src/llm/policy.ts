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
  /**
   * Whether this task's output is safe to cache/reuse across requests.
   * True for a fixed set of variants (e.g. hint levels). Must be false for
   * freeform input (e.g. chat messages) — caching by checkpointId+task alone
   * would return a stale answer to an unrelated question.
   */
  cacheable?: boolean;
}

export type GenerationProvider = 'cache' | 'ollama' | 'nvidia-nim' | 'template';

export interface GenerationResult {
  content: string;
  provider: GenerationProvider;
}

/**
 * Tiered generation: cache -> NVIDIA NIM (primary, when enabled) -> local
 * Ollama (fallback) -> deterministic template. NVIDIA NIM is primary rather
 * than an "overflow" because this host is a shared personal dev machine —
 * Ollama's response times and memory footprint here are poor enough that
 * we've chosen not to depend on it day to day; it stays wired in purely as
 * a fallback for when NVIDIA is unavailable/rate-limited or the overflow
 * key isn't configured. Each tier only proceeds if the prior tier misses or
 * fails; grounding is checked before trusting any live-generated output.
 */
export async function generate(request: GenerationRequest): Promise<GenerationResult> {
  const cacheable = request.cacheable ?? true;

  if (cacheable) {
    const cached = await getCached(request.checkpointId, request.task);
    if (cached) return { content: cached, provider: 'cache' };
  }

  if (config.llmOverflow.enabled) {
    const nvidiaOutput = await generateWithNvidiaNim({ prompt: request.prompt });
    if (nvidiaOutput && looksGrounded(nvidiaOutput, request.groundingTerms)) {
      if (cacheable) {
        await cacheResult(request.checkpointId, request.task, nvidiaOutput, 'nvidia-nim');
      }
      return { content: nvidiaOutput, provider: 'nvidia-nim' };
    }
  }

  if (canAttemptOllama() && (await probeOllama(config.ollama.baseUrl, 300))) {
    const output = await withOllamaSlot(() => generateWithOllama({ prompt: request.prompt }));
    if (output && looksGrounded(output, request.groundingTerms)) {
      if (cacheable) await cacheResult(request.checkpointId, request.task, output, 'ollama');
      return { content: output, provider: 'ollama' };
    }
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

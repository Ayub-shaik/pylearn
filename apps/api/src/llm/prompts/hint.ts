import type { Checkpoint, HintLevel } from '@pylearn/core';

export interface HintPromptResult {
  prompt: string;
  groundingTerms: string[];
  authoredFallback: string;
}

export function buildHintPrompt(checkpoint: Checkpoint, level: HintLevel): HintPromptResult {
  const authored = checkpoint.hints?.[level] ?? '';

  const prompt = [
    'You are a friendly Python tutor helping a beginner.',
    'Rephrase the authored hint below in a slightly more encouraging, concrete way.',
    'Do not introduce facts beyond what is given. Keep it under 40 words.',
    '',
    `Checkpoint: ${checkpoint.title}`,
    `Content: ${checkpoint.content}`,
    `Authored hint (${level}): ${authored}`,
  ].join('\n');

  return {
    prompt,
    groundingTerms: [checkpoint.title, authored].filter((term): term is string => Boolean(term)),
    authoredFallback: authored,
  };
}

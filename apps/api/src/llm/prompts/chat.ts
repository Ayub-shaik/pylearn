import type { Checkpoint } from '@pylearn/core';

export interface ChatPromptResult {
  prompt: string;
  groundingTerms: string[];
  templateFallback: string;
}

const TEMPLATE_FALLBACK =
  'Try rephrasing your question, or use the hint button above for a step-by-step nudge.';

/**
 * Build a grounded chat prompt for a learner's freeform question about the
 * current checkpoint. Unlike hints, chat answers can't be pre-authored, so
 * the fallback when generation is unavailable is a static redirect rather
 * than a canned answer.
 */
export function buildChatPrompt(checkpoint: Checkpoint, message: string): ChatPromptResult {
  const explanation = checkpoint.explanation;

  const prompt = [
    'You are a friendly Python tutor helping a beginner with the checkpoint below.',
    "Answer the learner's question using ONLY the information given here — do not introduce",
    'facts, APIs, or syntax that are not implied by this checkpoint. If the question is off-topic',
    'or unrelated to this checkpoint, gently redirect the learner back to the checkpoint content.',
    'Keep the answer under 60 words.',
    '',
    `Checkpoint: ${checkpoint.title}`,
    `Content: ${checkpoint.content}`,
    explanation ? `Explanation: ${explanation}` : '',
    '',
    `Learner's question: ${message}`,
  ]
    .filter(Boolean)
    .join('\n');

  return {
    prompt,
    groundingTerms: [checkpoint.title, checkpoint.content, explanation].filter(
      (term): term is string => Boolean(term),
    ),
    templateFallback: TEMPLATE_FALLBACK,
  };
}

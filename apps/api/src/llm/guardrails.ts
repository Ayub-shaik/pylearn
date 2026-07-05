const MAX_CONCURRENT_OLLAMA = 1;
let activeOllamaRequests = 0;

export function canAttemptOllama(): boolean {
  return activeOllamaRequests < MAX_CONCURRENT_OLLAMA;
}

export async function withOllamaSlot<T>(fn: () => Promise<T>): Promise<T> {
  activeOllamaRequests += 1;
  try {
    return await fn();
  } finally {
    activeOllamaRequests -= 1;
  }
}

const STOPWORDS = new Set([
  'that',
  'this',
  'with',
  'from',
  'have',
  'your',
  'what',
  'when',
  'they',
  'their',
  'about',
  'into',
  'python',
]);

/**
 * Loose topical-relevance check: a genuine paraphrase of the grounding
 * material will rarely repeat a whole sentence verbatim, so this checks for
 * any individual significant word overlap rather than requiring the full
 * term as a substring. It's meant to catch wildly off-topic generations,
 * not to verify the response is a close paraphrase.
 */
export function looksGrounded(output: string, groundingTerms: string[]): boolean {
  const lower = output.toLowerCase();
  const words = groundingTerms
    .flatMap((term) => term.toLowerCase().split(/[^a-z0-9]+/))
    .filter((word) => word.length > 3 && !STOPWORDS.has(word));

  if (words.length === 0) return true;
  return words.some((word) => lower.includes(word));
}

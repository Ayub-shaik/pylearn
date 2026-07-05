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

export function looksGrounded(output: string, groundingTerms: string[]): boolean {
  const lower = output.toLowerCase();
  return groundingTerms.some((term) => term.length > 2 && lower.includes(term.toLowerCase()));
}

/**
 * Probe a local Ollama instance to determine availability.
 * @param baseUrl Base URL for the Ollama service.
 * @param timeoutMs Milliseconds before the probe fails.
 * @returns Promise resolving to true when the endpoint appears responsive.
 * @todo TODO(impl): Issue HTTP probe to /api/tags and respect timeout.
 */
export async function probeOllama(
  baseUrl = 'http://localhost:11434',
  timeoutMs = 200,
): Promise<boolean> {
  // TODO(impl): Replace stub with real fetch and timeout handling.
  void baseUrl;
  void timeoutMs;
  return false;
}

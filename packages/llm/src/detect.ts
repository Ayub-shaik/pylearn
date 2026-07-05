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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(normaliseBase(baseUrl), {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    return response.ok;
  } catch (error) {
    void error;
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

function normaliseBase(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/$/, '');
  return `${trimmed}/api/tags`;
}

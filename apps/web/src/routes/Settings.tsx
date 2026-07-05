import { useEffect, useState } from 'react';

import { probeOllama } from '@pylearn/llm';

const OLLAMA_PREF_KEY = 'pylearn:settings:prefer-ollama';

export function Settings() {
  const [preferOllama, setPreferOllama] = useState(false);
  const [ollamaDetected, setOllamaDetected] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(OLLAMA_PREF_KEY);
    setPreferOllama(stored === 'true');
  }, []);

  useEffect(() => {
    let cancelled = false;
    setChecking(true);
    void probeOllama()
      .then((detected: boolean) => {
        if (!cancelled) {
          setOllamaDetected(detected);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOllamaDetected(false);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setChecking(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggle = () => {
    const next = !preferOllama;
    setPreferOllama(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(OLLAMA_PREF_KEY, String(next));
    }
  };

  const status = (() => {
    if (checking) return 'Checking for Ollama…';
    if (ollamaDetected === null) return 'Status unknown';
    return ollamaDetected ? 'Detected' : 'Not detected';
  })();

  return (
    <div className="space-y-6">
      <div className="card mx-auto max-w-3xl space-y-4 p-6">
        <header>
          <h2 className="text-2xl font-semibold text-white">Settings</h2>
          <p className="text-sm text-slate-300">
            Configure provider preferences and local integrations.
          </p>
        </header>
        <section aria-labelledby="ollama-pref" className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 id="ollama-pref" className="text-lg font-semibold text-white">
                Local Ollama Preference
              </h3>
              <p className="text-sm text-slate-400">Status: {status}</p>
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={preferOllama}
                onChange={handleToggle}
                disabled={!ollamaDetected && !preferOllama}
                className="h-4 w-4 accent-primary"
              />
              Prefer local Ollama
            </label>
          </div>
          {!ollamaDetected ? (
            <p className="text-xs text-slate-400">
              We will fall back to the in-browser provider when Ollama is unavailable.
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}

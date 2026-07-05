const PYODIDE_CDN_URL = 'https://cdn.jsdelivr.net/pyodide/v0.26.3/full/pyodide.js';

type LoadPyodideFn = (_options: { indexURL: string }) => Promise<any>;
export type PyodideInstance = Awaited<ReturnType<LoadPyodideFn>>;

let pyodidePromise: Promise<PyodideInstance> | undefined;

/**
 * Lazy-load a shared Pyodide instance from the official CDN.
 * Subsequent calls reuse the same instance.
 */
export async function getPyodide(): Promise<PyodideInstance> {
  if (!pyodidePromise) {
    pyodidePromise = load();
  }
  return pyodidePromise;
}

async function load(): Promise<PyodideInstance> {
  if (typeof window === 'undefined') {
    throw new Error('Pyodide is only available in a browser environment.');
  }

  await ensurePyodideScript();
  const loadFn = globalLoadPyodide();
  return await loadFn({ indexURL: getIndexUrl() });
}

async function ensurePyodideScript(): Promise<void> {
  if (typeof document === 'undefined') {
    throw new Error('Pyodide script cannot be loaded outside the browser.');
  }

  if (document.querySelector(`script[src="${PYODIDE_CDN_URL}"]`)) {
    return;
  }
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = PYODIDE_CDN_URL;
    script.async = true;
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () => reject(new Error('Failed to load Pyodide script')));
    document.head.appendChild(script);
  });
}

function getIndexUrl(): string {
  const url = new URL(PYODIDE_CDN_URL);
  url.pathname = url.pathname.replace(/pyodide\.js$/, '');
  return url.toString();
}

function globalLoadPyodide(): (_options: { indexURL: string }) => Promise<any> {
  if (typeof window === 'undefined' || typeof window.loadPyodide !== 'function') {
    throw new Error('Pyodide loader function not found after script load.');
  }
  return window.loadPyodide;
}

declare global {
  // eslint-disable-next-line no-unused-vars -- global interface augmentation, not a local binding
  interface Window {
    loadPyodide?: (_options: { indexURL: string }) => Promise<any>;
  }
}

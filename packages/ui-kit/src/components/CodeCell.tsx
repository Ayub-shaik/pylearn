import type { MutableRefObject, ReactElement, TextareaHTMLAttributes } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_TIMEOUT_MS = 2000;
const FORBIDDEN_PATTERNS = [
  /import\s+os/,
  /import\s+sys/,
  /import\s+subprocess/,
  /from\s+os\s+import/,
  /from\s+sys\s+import/,
  /from\s+subprocess\s+import/,
];

type ExecutionJSON = { stdout?: unknown; stderr?: unknown };

export interface CodeCellResult {
  output: string;
  error?: string;
}

export interface CodeCellProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'children' | 'onChange'> {
  checkpointId: string;
  prompt: string;
  language: string;
  initialCode?: string;
  expectedOutput?: string;
  disabled?: boolean;
  onEvaluate?: (_payload: { checkpointId: string; result: CodeCellResult; source: string }) => void;
  onCodeChange?: (_payload: { checkpointId: string; source: string }) => void;
}

/**
 * Minimal Python code runner backed by Pyodide for code-cell checkpoints.
 * @todo TODO(impl): Replace with richer editor and expose diagnostics.
 */
export function CodeCell({
  checkpointId,
  prompt,
  language,
  initialCode,
  expectedOutput,
  disabled,
  onEvaluate,
  onCodeChange,
  onBlur,
  'aria-label': ariaLabel,
  ...rest
}: CodeCellProps): ReactElement {
  const [source, setSource] = useState(initialCode ?? '');
  const [result, setResult] = useState<CodeCellResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const timeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    setSource(initialCode ?? '');
  }, [initialCode]);

  useEffect(() => () => clearPendingTimeout(timeoutRef), []);

  const isPython = useMemo(() => language.toLowerCase().startsWith('py'), [language]);

  const runCode = useCallback(async () => {
    if (disabled) return;

    if (!isPython) {
      const payload: CodeCellResult = {
        output: '',
        error: 'Only Python execution is supported right now.',
      };
      setResult(payload);
      onEvaluate?.({ checkpointId, result: payload, source });
      return;
    }

    if (FORBIDDEN_PATTERNS.some((pattern) => pattern.test(source))) {
      const payload: CodeCellResult = {
        output: '',
        error: 'Import blocked for security reasons.',
      };
      setResult(payload);
      onEvaluate?.({ checkpointId, result: payload, source });
      return;
    }

    setIsRunning(true);
    try {
      const { getPyodide } = await import('@web/pyodide');
      const pyodide = await getPyodide();

      const evaluationPromise = (async () => {
        const raw = await pyodide.runPythonAsync(wrapForCapture(source));
        return parseExecutionResult(raw);
      })();

      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutRef.current = window.setTimeout(() => {
          reject(new Error(`Execution timed out after ${DEFAULT_TIMEOUT_MS / 1000}s.`));
        }, DEFAULT_TIMEOUT_MS);
      });

      const execution = (await Promise.race([evaluationPromise, timeoutPromise])) as CodeCellResult;

      setResult(execution);
      onEvaluate?.({ checkpointId, result: execution, source });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown execution error.';
      const payload: CodeCellResult = { output: '', error: message };
      setResult(payload);
      onEvaluate?.({ checkpointId, result: payload, source });
    } finally {
      clearPendingTimeout(timeoutRef);
      setIsRunning(false);
    }
  }, [checkpointId, disabled, isPython, onEvaluate, source]);

  const showExpected = expectedOutput && expectedOutput.trim().length > 0;

  return (
    <div
      role="group"
      data-component="CodeCell"
      data-checkpoint-id={checkpointId}
      data-language={language}
      aria-label={ariaLabel ?? `Code exercise: ${prompt}`}
      className="ide-window space-y-0"
    >
      <div className="ide-window-header">
        <span className="ide-dot bg-red-500/70" aria-hidden="true" />
        <span className="ide-dot bg-amber-500/70" aria-hidden="true" />
        <span className="ide-dot bg-emerald-500/70" aria-hidden="true" />
        <span className="ide-tab ide-tab-active ml-2">solution.{isPython ? 'py' : language}</span>
      </div>
      <div className="space-y-3 p-3">
        <textarea
          {...rest}
          value={source}
          disabled={disabled || isRunning}
          onChange={(event) => {
            setSource(event.target.value);
            onCodeChange?.({ checkpointId, source: event.target.value });
          }}
          onBlur={onBlur}
          className="w-full min-h-[8rem] rounded-md border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-100 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={runCode}
            disabled={disabled || isRunning}
            className="btn btn-secondary"
          >
            {isRunning ? 'Running…' : '▶ Run'}
          </button>
          {showExpected ? (
            <small className="font-mono text-slate-400">Expected output: {expectedOutput}</small>
          ) : null}
        </div>
        <OutputArea result={result} />
      </div>
    </div>
  );
}

function OutputArea({ result }: { result: CodeCellResult | null }) {
  if (!result) return null;
  const { output, error } = result;
  const hasError = Boolean(error);
  return (
    <pre
      role="log"
      className={`rounded-md border px-4 py-3 text-sm ${
        hasError
          ? 'border-red-500/30 bg-red-900/40 text-red-200'
          : 'border-slate-800 bg-slate-900/60 text-slate-200'
      }`}
    >
      {hasError ? `Error: ${error}` : output || '(no output)'}
    </pre>
  );
}

function wrapForCapture(code: string): string {
  const escaped = JSON.stringify(code);
  return `import sys, json\nfrom io import StringIO\n_stdout = StringIO()\n_stderr = StringIO()\n_sys_stdout, sys.stdout = sys.stdout, _stdout\n_sys_stderr, sys.stderr = sys.stderr, _stderr\ntry:\n    exec(${escaped}, {})\nfinally:\n    sys.stdout = _sys_stdout\n    sys.stderr = _sys_stderr\njson.dumps({'stdout': _stdout.getvalue(), 'stderr': _stderr.getvalue()})`;
}

function parseExecutionResult(raw: unknown): CodeCellResult {
  if (!raw) return { output: '', error: undefined };

  if (typeof raw === 'string') {
    const parsed = safeParseJSON(raw);
    const stdout = typeof parsed.stdout === 'string' ? parsed.stdout : '';
    const stderr = typeof parsed.stderr === 'string' ? parsed.stderr : '';
    return { output: stdout, error: stderr ? stderr : undefined };
  }

  if (typeof raw === 'object') {
    const proxy = raw as {
      toJs?: (_options?: any) => unknown;
      destroy?: () => void;
      stdout?: string;
      stderr?: string;
    };
    if (typeof proxy.toJs === 'function') {
      const jsValue = proxy.toJs({
        dict_hook: (entries: [unknown, unknown][]) => Object.fromEntries(entries),
      });
      proxy.destroy?.();
      return parseExecutionResult(jsValue);
    }
    const stdout = typeof proxy.stdout === 'string' ? proxy.stdout : '';
    const stderr = typeof proxy.stderr === 'string' ? proxy.stderr : '';
    return { output: stdout, error: stderr ? stderr : undefined };
  }

  return { output: String(raw), error: undefined };
}

function safeParseJSON(raw: string): ExecutionJSON {
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? (parsed as ExecutionJSON) : {};
  } catch {
    return { stdout: raw };
  }
}

function clearPendingTimeout(ref: MutableRefObject<number | undefined>) {
  if (ref.current !== undefined) {
    clearTimeout(ref.current);
    ref.current = undefined;
  }
}

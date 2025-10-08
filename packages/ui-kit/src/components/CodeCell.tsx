import type { ReactElement, HTMLAttributes } from 'react';

export interface CodeCellProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  checkpointId: string;
  prompt: string;
  language: string;
  starterCode: string;
  currentCode?: string;
  expectedOutput?: string;
  readOnly?: boolean;
  onRunCode?: (_payload: { checkpointId: string; source: string }) => void;
  onCodeChange?: (_payload: { checkpointId: string; source: string }) => void;
}

/**
 * Present a coding exercise shell with callbacks for the host environment.
 * @todo TODO(impl): Replace placeholder markup with embedded editor and runner.
 */
export function CodeCell({
  checkpointId,
  prompt,
  language,
  starterCode,
  currentCode,
  expectedOutput,
  readOnly,
  onRunCode,
  onCodeChange,
  onClick,
  'aria-label': ariaLabel,
  ...rest
}: CodeCellProps): ReactElement {
  const source = currentCode ?? starterCode;

  return (
    <div
      {...rest}
      role="group"
      data-component="CodeCell"
      data-checkpoint-id={checkpointId}
      data-language={language}
      data-readonly={readOnly ?? false}
      aria-label={ariaLabel ?? `Code exercise: ${prompt}`}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          onRunCode?.({ checkpointId, source });
          onCodeChange?.({ checkpointId, source });
        }
      }}
    >
      {prompt} — {language}
      {expectedOutput ? ` ⇒ ${expectedOutput}` : ''}
    </div>
  );
}

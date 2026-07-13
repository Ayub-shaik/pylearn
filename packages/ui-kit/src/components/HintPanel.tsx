import type { ReactElement } from 'react';

type HintStage = 'H0' | 'H1' | 'H2' | 'REVEAL';

export interface HintPanelProps {
  h0?: string;
  h1?: string;
  h2?: string;
  revealedAnswerText?: string;
  level: HintStage | null;
  onNextLevel: () => void;
  disabled?: boolean;
}

const BUTTON_LABELS: Record<HintStage, string> = {
  H0: 'Show hint',
  H1: 'Show another hint',
  H2: 'Reveal answer',
  REVEAL: 'Reveal answer',
};

export function HintPanel({
  h0,
  h1,
  h2,
  revealedAnswerText,
  level,
  onNextLevel,
  disabled,
}: HintPanelProps): ReactElement {
  const nextLabel = getNextLabel(level);
  const displayText = getDisplayText(level, { h0, h1, h2, revealed: revealedAnswerText });
  const showButton = level !== 'REVEAL' && !disabled;

  return (
    <section
      aria-live="polite"
      aria-label="Hint panel"
      className="mt-4 rounded-md border border-accent/20 bg-slate-900/60 p-3"
    >
      <header className="flex items-center justify-between gap-3">
        <strong className="terminal-label text-accent-light"># Need a hint?</strong>
        {showButton ? (
          <button
            type="button"
            onClick={onNextLevel}
            disabled={disabled}
            className="btn btn-secondary py-1 text-xs"
          >
            {nextLabel}
          </button>
        ) : null}
      </header>
      {displayText ? <p className="mt-2 text-sm text-slate-300">{displayText}</p> : null}
    </section>
  );
}

function getNextLabel(level: HintStage | null): string {
  if (!level) return BUTTON_LABELS.H0;
  switch (level) {
    case 'H0':
      return BUTTON_LABELS.H1;
    case 'H1':
      return BUTTON_LABELS.H2;
    case 'H2':
      return BUTTON_LABELS.REVEAL;
    case 'REVEAL':
    default:
      return BUTTON_LABELS.REVEAL;
  }
}

function getDisplayText(
  level: HintStage | null,
  texts: { h0?: string; h1?: string; h2?: string; revealed?: string },
): string | undefined {
  switch (level) {
    case 'H0':
      return texts.h0;
    case 'H1':
      return texts.h1 ?? texts.h0;
    case 'H2':
      return texts.h2 ?? texts.h1 ?? texts.h0;
    case 'REVEAL':
      return texts.revealed ?? texts.h2 ?? texts.h1 ?? texts.h0;
    default:
      return undefined;
  }
}

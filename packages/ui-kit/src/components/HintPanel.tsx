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
      style={{
        marginTop: '1rem',
        padding: '0.75rem',
        border: '1px solid var(--pylearn-border, #d0d7de)',
        borderRadius: 6,
        background: 'var(--pylearn-hint-bg, #f1f5f9)',
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <strong>Need a hint?</strong>
        {showButton ? (
          <button type="button" onClick={onNextLevel} disabled={disabled}>
            {nextLabel}
          </button>
        ) : null}
      </header>
      {displayText ? <p style={{ marginTop: '0.5rem' }}>{displayText}</p> : null}
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

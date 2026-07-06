import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';

import { useAppStore } from '../state/store';

const DISMISSED_KEY = 'pylearn:save-progress-nudge-dismissed';
const MIN_ATTEMPTS_BEFORE_NUDGE = 3;

export function SaveProgressNudge(): ReactElement | null {
  const { authStatus, attempts, signIn } = useAppStore();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setDismissed(window.localStorage.getItem(DISMISSED_KEY) === '1');
  }, []);

  const eligible = authStatus === 'anonymous' && attempts.length >= MIN_ATTEMPTS_BEFORE_NUDGE;

  if (!eligible || dismissed) return null;

  const dismiss = () => {
    window.localStorage.setItem(DISMISSED_KEY, '1');
    setDismissed(true);
  };

  return (
    <div
      role="dialog"
      aria-label="Save your progress"
      className="fixed bottom-4 right-4 z-40 w-[calc(100%-2rem)] max-w-sm rounded-lg border border-slate-700 bg-slate-900 p-4 shadow-xl sm:right-6 sm:bottom-6"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-2 top-2 rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M6 6l12 12M18 6L6 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <p className="pr-5 text-sm font-medium text-white">Nice progress! 🎉</p>
      <p className="mt-1 pr-5 text-xs text-slate-400">
        You're making real headway. Save it to your account so it follows you to any device — takes
        a few seconds, and you keep everything you've already done.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="btn btn-primary flex-1 py-1.5 text-xs"
          onClick={() => {
            dismiss();
            signIn();
          }}
        >
          Create account quickly
        </button>
        <button type="button" className="btn btn-secondary py-1.5 text-xs" onClick={dismiss}>
          Later
        </button>
      </div>
    </div>
  );
}

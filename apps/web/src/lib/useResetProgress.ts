import { useState } from 'react';

import { useAppStore } from '../state/store';

import { resetProgress } from './api';
import { clearSessionState } from './db';
import { clearLocalOnboarding } from './onboarding';

export function useResetProgress() {
  const { authStatus, track } = useAppStore();
  const [confirming, setConfirming] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmReset = async (): Promise<void> => {
    setResetting(true);
    setError(null);
    try {
      if (authStatus === 'authenticated') {
        await resetProgress();
      } else {
        clearLocalOnboarding();
        if (track) {
          await clearSessionState(track.id);
        }
      }
      window.location.href = '/';
    } catch {
      setError("Couldn't reset progress — check your connection and try again.");
    } finally {
      setResetting(false);
    }
  };

  return {
    confirming,
    resetting,
    error,
    requestConfirm: () => setConfirming(true),
    cancelConfirm: () => {
      setConfirming(false);
      setError(null);
    },
    confirmReset,
  };
}

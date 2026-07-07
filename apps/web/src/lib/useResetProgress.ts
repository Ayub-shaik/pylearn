import { useState } from 'react';

import { useAppStore } from '../state/store';

import { resetProgress } from './api';
import { clearSessionState } from './db';
import { clearLocalOnboarding } from './onboarding';

export function useResetProgress() {
  const { authStatus, track } = useAppStore();
  const [confirming, setConfirming] = useState(false);
  const [resetting, setResetting] = useState(false);

  const confirmReset = async (): Promise<void> => {
    setResetting(true);
    try {
      if (authStatus === 'authenticated') {
        await resetProgress();
      } else {
        clearLocalOnboarding();
        if (track) {
          await clearSessionState(track.id);
        }
      }
    } finally {
      window.location.href = '/';
    }
  };

  return {
    confirming,
    resetting,
    requestConfirm: () => setConfirming(true),
    cancelConfirm: () => setConfirming(false),
    confirmReset,
  };
}

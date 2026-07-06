import { useEffect, useState } from 'react';

import { getAuthConfig } from '../lib/api';
import { useAppStore } from '../state/store';

export function Login() {
  const { authStatus, user, signIn, signOut } = useAppStore();
  const [googleEnabled, setGoogleEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getAuthConfig()
      .then((config) => {
        if (!cancelled) {
          setGoogleEnabled(config.googleEnabled);
        }
      })
      .catch(() => {
        if (!cancelled) setGoogleEnabled(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="card space-y-4 p-6">
        <header>
          <h2 className="text-2xl font-semibold text-white">Account</h2>
          <p className="text-sm text-slate-300">
            Sign in to save your progress and pick up where you left off on any device.
          </p>
        </header>

        {authStatus === 'authenticated' && user ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-200">
              Signed in as <span className="font-medium text-white">{user.email}</span>
            </p>
            <button type="button" className="btn-secondary" onClick={() => void signOut()}>
              Sign out
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-400">
              Signing in means your streak, mastery, and lesson progress follow you to your phone,
              laptop, or any other browser. Skip it and PyLearn still works fully — progress just
              stays on this device.
            </p>
            {googleEnabled === false ? (
              <p className="text-sm text-amber-300">
                Google sign-in isn&apos;t configured on this server yet. You can still use PyLearn
                anonymously — progress will be saved to this browser only.
              </p>
            ) : null}
            <button
              type="button"
              className="btn-primary"
              onClick={signIn}
              disabled={googleEnabled === false}
            >
              Sign in with Google
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';

import { getAuthConfig, guestLogin } from '../lib/api';
import { useAppStore } from '../state/store';

export function Login() {
  const { authStatus, user, signIn, signOut } = useAppStore();
  const [googleEnabled, setGoogleEnabled] = useState<boolean | null>(null);
  const [guestLoginEnabled, setGuestLoginEnabled] = useState(false);
  const [guestUsername, setGuestUsername] = useState('');
  const [guestPassword, setGuestPassword] = useState('');
  const [guestError, setGuestError] = useState<string | null>(null);
  const [guestSubmitting, setGuestSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getAuthConfig()
      .then((config) => {
        if (!cancelled) {
          setGoogleEnabled(config.googleEnabled);
          setGuestLoginEnabled(config.guestLoginEnabled);
        }
      })
      .catch(() => {
        if (!cancelled) setGoogleEnabled(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleGuestLogin = async () => {
    setGuestError(null);
    setGuestSubmitting(true);
    try {
      await guestLogin(guestUsername, guestPassword);
      window.location.href = '/';
    } catch {
      setGuestError('Invalid guest credentials.');
    } finally {
      setGuestSubmitting(false);
    }
  };

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

            {guestLoginEnabled ? (
              <div className="space-y-2 border-t border-slate-800 pt-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Dev guest login (debug only)
                </p>
                <input
                  type="text"
                  placeholder="Username"
                  value={guestUsername}
                  onChange={(event) => setGuestUsername(event.target.value)}
                  className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-primary focus:outline-none"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={guestPassword}
                  onChange={(event) => setGuestPassword(event.target.value)}
                  className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-primary focus:outline-none"
                />
                {guestError ? <p className="text-xs text-red-300">{guestError}</p> : null}
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={guestSubmitting}
                  onClick={() => void handleGuestLogin()}
                >
                  {guestSubmitting ? 'Signing in…' : 'Sign in as guest'}
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

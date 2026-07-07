import { useResetProgress } from '../lib/useResetProgress';
import { useAppStore } from '../state/store';

export function Settings() {
  const { authStatus } = useAppStore();
  const { confirming, resetting, requestConfirm, cancelConfirm, confirmReset } = useResetProgress();

  return (
    <div className="space-y-6">
      <div className="card mx-auto max-w-3xl space-y-4 p-6">
        <header>
          <h2 className="text-2xl font-semibold text-white">Settings</h2>
          <p className="text-sm text-slate-300">
            PyLearn&apos;s AI tutor runs on our server using a small self-hosted model — there is
            nothing to configure on your device.
          </p>
        </header>
        <section aria-labelledby="account-pref" className="space-y-2">
          <h3 id="account-pref" className="text-lg font-semibold text-white">
            Account &amp; sync
          </h3>
          <p className="text-sm text-slate-400">
            Manage sign-in and cross-device progress sync from the{' '}
            <a href="/login" className="text-primary-light underline">
              Account
            </a>{' '}
            page.
          </p>
        </section>

        <section
          aria-labelledby="reset-progress"
          className="space-y-2 border-t border-slate-800 pt-4"
        >
          <h3 id="reset-progress" className="text-lg font-semibold text-white">
            Reset progress
          </h3>
          <p className="text-sm text-slate-400">
            Clears every attempt, mastery score, and onboarding answer, then starts you over from
            scratch — as if you were a brand new learner. This can&apos;t be undone.
          </p>
          {confirming ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-red-300">
                Reset everything? This can&apos;t be undone.
              </span>
              <button
                type="button"
                className="btn btn-primary bg-red-600 hover:bg-red-500"
                disabled={resetting}
                onClick={() => void confirmReset()}
              >
                {resetting ? 'Resetting…' : 'Yes, reset everything'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={resetting}
                onClick={cancelConfirm}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button type="button" className="btn btn-secondary" onClick={requestConfirm}>
              Reset progress
            </button>
          )}
        </section>

        {authStatus !== 'authenticated' ? (
          <section
            aria-labelledby="test-session"
            className="space-y-2 border-t border-slate-800 pt-4"
          >
            <h3 id="test-session" className="text-lg font-semibold text-white">
              Testing: always-fresh URL
            </h3>
            <p className="text-sm text-slate-400">
              Bookmark this URL — loading or hard-refreshing it wipes local progress first, every
              time, so you always land as a brand new visitor:
            </p>
            <code className="block break-all rounded-md bg-slate-950 px-3 py-2 text-xs text-primary-light">
              {typeof window !== 'undefined' ? `${window.location.origin}/?fresh=1` : '/?fresh=1'}
            </code>
          </section>
        ) : null}
      </div>
    </div>
  );
}

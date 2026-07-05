export function Settings() {
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
      </div>
    </div>
  );
}

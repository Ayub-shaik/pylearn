import { useState } from 'react';
import type { ReactElement } from 'react';
import { Link, NavLink, Route, Routes } from 'react-router-dom';

import { SaveProgressNudge } from './components/SaveProgressNudge';
import { About } from './routes/About';
import { Home } from './routes/Home';
import { Lesson } from './routes/Lesson';
import { Login } from './routes/Login';
import { Onboarding } from './routes/Onboarding';
import { Review } from './routes/Review';
import { Settings } from './routes/Settings';
import { Tracks } from './routes/Tracks';
import { useAppStore } from './state/store';

const navigation = [
  { to: '/', label: 'Home' },
  { to: '/tracks', label: 'Tracks' },
  { to: '/review', label: 'Review' },
  { to: '/settings', label: 'Settings' },
  { to: '/about', label: 'About' },
];

const navLinkClass = ({ isActive }: { isActive: boolean }): string =>
  `block rounded-md px-3 py-2 font-mono text-sm font-medium transition-colors duration-150 ${
    isActive
      ? 'bg-accent/10 text-accent-light'
      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
  }`;

export function App(): ReactElement {
  const { authStatus, user } = useAppStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const accountLabel =
    authStatus === 'authenticated' ? (user?.displayName ?? 'Account') : 'Sign in';

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <header className="border-b border-accent/10 bg-slate-900/80 backdrop-blur">
        <div className="flex w-full items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3" onClick={() => setMenuOpen(false)}>
            <span
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center rounded-md border border-accent/30 bg-slate-950 font-mono text-accent-light"
            >
              &gt;_
            </span>
            <span className="leading-tight">
              <span className="block font-mono text-lg font-semibold tracking-tight text-white">
                PyLearn
              </span>
              <span className="terminal-label block leading-none">learn python by doing</span>
            </span>
          </Link>

          <nav aria-label="Primary" className="hidden sm:block">
            <ul className="flex items-center gap-2 text-sm font-medium text-slate-300">
              {[...navigation, { to: '/login', label: accountLabel }].map((link) => (
                <li key={link.to}>
                  <NavLink to={link.to} className={navLinkClass}>
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <button
            type="button"
            className="rounded-md p-2 text-slate-300 hover:bg-slate-800 hover:text-white sm:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              {menuOpen ? (
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </div>

        {menuOpen ? (
          <nav aria-label="Primary mobile" className="border-t border-slate-800 sm:hidden">
            <ul className="w-full space-y-1 px-6 py-3 text-sm font-medium">
              {[...navigation, { to: '/login', label: accountLabel }].map((link) => (
                <li key={link.to}>
                  <NavLink to={link.to} className={navLinkClass} onClick={() => setMenuOpen(false)}>
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </header>

      <main className="w-full flex-1 px-6 py-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tracks" element={<Tracks />} />
          <Route path="/lesson/:lessonId" element={<Lesson />} />
          <Route path="/review" element={<Review />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>

      <footer className="border-t border-slate-800 bg-slate-900/60">
        <div className="flex w-full flex-col gap-3 px-6 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            PyLearn — hints and chat are generated by a small self-hosted model, never a paid
            third-party AI API.
          </p>
          <div className="flex gap-4">
            <Link to="/about" className="hover:text-slate-300">
              About
            </Link>
            <Link to="/login" className="hover:text-slate-300">
              Account
            </Link>
          </div>
        </div>
      </footer>

      <SaveProgressNudge />
    </div>
  );
}

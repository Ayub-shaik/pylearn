import type { ReactElement } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';

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

export function App(): ReactElement {
  const { authStatus, user } = useAppStore();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-semibold tracking-tight text-white">PyLearn</h1>
          <nav aria-label="Primary">
            <ul className="flex items-center gap-4 text-sm font-medium text-slate-300">
              {navigation.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    className={({ isActive }) =>
                      `rounded-md px-3 py-2 transition-colors duration-150 ${
                        isActive
                          ? 'bg-primary/20 text-white'
                          : 'hover:bg-slate-800 hover:text-white'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
              <li>
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    `rounded-md px-3 py-2 transition-colors duration-150 ${
                      isActive ? 'bg-primary/20 text-white' : 'hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  {authStatus === 'authenticated' ? (user?.displayName ?? 'Account') : 'Sign in'}
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
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
    </div>
  );
}

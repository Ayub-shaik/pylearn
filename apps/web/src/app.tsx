import type { ReactElement } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';

import { About } from './routes/About';
import { Home } from './routes/Home';
import { Lesson } from './routes/Lesson';
import { Review } from './routes/Review';
import { Settings } from './routes/Settings';
import { Tracks } from './routes/Tracks';

const navigation = [
  { to: '/', label: 'Home' },
  { to: '/tracks', label: 'Tracks' },
  { to: '/review', label: 'Review' },
  { to: '/settings', label: 'Settings' },
  { to: '/about', label: 'About' },
];

export function App(): ReactElement {
  return (
    <div data-app-shell>
      <header>
        <h1>PyLearn</h1>
        <nav aria-label="Primary">
          <ul>
            {navigation.map((link) => (
              <li key={link.to}>
                <NavLink to={link.to}>{link.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tracks" element={<Tracks />} />
        <Route path="/lesson/:lessonId" element={<Lesson />} />
        <Route path="/review" element={<Review />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </div>
  );
}

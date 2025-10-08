import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

export function Home(): ReactElement {
  return (
    <main>
      <h2>Welcome to PyLearn</h2>
      <p>TODO: Surface personalized entry points and recent activity.</p>
      <p>
        <Link to="/tracks">Browse Tracks</Link>
      </p>
    </main>
  );
}

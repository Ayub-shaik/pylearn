import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

export function Review(): ReactElement {
  return (
    <main>
      <h2>Review Queue</h2>
      <p>TODO: Surface spaced repetition and mastery reminders.</p>
      <p>
        <Link to="/settings">Adjust Settings</Link>
      </p>
    </main>
  );
}

import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

export function Tracks(): ReactElement {
  return (
    <main>
      <h2>Tracks</h2>
      <p>TODO: List available learning tracks and enrollment state.</p>
      <p>
        <Link to="/lesson/lesson.python.basics.variables">Jump to Sample Lesson</Link>
      </p>
    </main>
  );
}

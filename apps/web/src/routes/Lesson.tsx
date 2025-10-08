import type { ReactElement } from 'react';
import { Link, useParams } from 'react-router-dom';

export function Lesson(): ReactElement {
  const { lessonId } = useParams<{ lessonId: string }>();

  return (
    <main>
      <h2>Lesson Overview</h2>
      <p>TODO: Render lesson content and interactive checkpoints.</p>
      <p>Active lesson: {lessonId ?? 'unknown'}</p>
      <p>
        <Link to="/review">View Review Queue</Link>
      </p>
    </main>
  );
}

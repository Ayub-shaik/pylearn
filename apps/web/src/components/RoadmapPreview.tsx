import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { CURRICULUM } from '../lib/curriculumOutline';
import type { TopicStatus } from '../lib/curriculumOutline';

const STATUS_ICON: Record<TopicStatus, string> = {
  built: '✔',
  planned: '🚀',
  elective: '⭐',
};

const STATUS_LABEL: Record<TopicStatus, string> = {
  built: 'Available now',
  planned: 'Coming soon',
  elective: 'Elective',
};

export function RoadmapPreview(): ReactElement {
  return (
    <div className="card mx-auto max-w-3xl space-y-4 p-6">
      <header className="space-y-1">
        <h3 className="text-lg font-semibold text-white">🐍 The full Python roadmap</h3>
        <p className="text-sm text-slate-400">
          Where PyLearn is headed — Foundations through Advanced Python, plus goal-specific
          electives. Most topics below aren&apos;t built yet; what exists today is marked ✔ and
          ready to try.
        </p>
      </header>

      <div className="space-y-4">
        {CURRICULUM.map((tier) => (
          <div key={tier.title}>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-primary-light">
              {tier.title}
            </h4>
            <ul className="mt-1 grid gap-1 sm:grid-cols-2">
              {tier.topics.map((topic) => (
                <li
                  key={topic.title}
                  className="flex items-center gap-2 rounded px-2 py-1 text-sm text-slate-300"
                  title={STATUS_LABEL[topic.status]}
                >
                  <span aria-hidden="true">{STATUS_ICON[topic.status]}</span>
                  <span className={topic.status === 'built' ? 'text-white' : ''}>
                    {topic.title}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <Link to="/tracks" className="text-sm text-primary-light underline">
        Start with what&apos;s available now →
      </Link>
    </div>
  );
}

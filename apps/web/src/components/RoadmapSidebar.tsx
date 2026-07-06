import type { ReactElement } from 'react';

import type { RoadmapModuleView, RoadmapView } from '@pylearn/core';
import { ProgressRing } from '@pylearn/ui-kit';

export interface RoadmapSidebarProps {
  view: RoadmapView;
  selectedModuleId?: string;
  activeLessonId?: string;
  onSelectModule: (_moduleId: string) => void;
  onSelectLesson: (_lessonId: string) => void;
}

const MODULE_ICON: Record<RoadmapModuleView['status'], string> = {
  completed: '✔',
  current: '▶',
  locked: '🔒',
  available: '📘',
};

const LESSON_ICON: Record<RoadmapModuleView['lessons'][number]['status'], string> = {
  completed: '✔',
  current: '▶',
  locked: '🔒',
  available: '•',
};

export function RoadmapSidebar({
  view,
  selectedModuleId,
  activeLessonId,
  onSelectModule,
  onSelectLesson,
}: RoadmapSidebarProps): ReactElement {
  return (
    <nav aria-label="Course roadmap" className="card space-y-4 p-4">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
        <ProgressRing value={view.overallProgressPercent} max={100} size={44} />
        <div>
          <p className="text-sm font-semibold text-white">{view.track.title}</p>
          <p className="text-xs text-slate-400">{view.overallProgressPercent}% complete</p>
        </div>
      </div>

      <ul className="space-y-3">
        {view.modules.map((moduleView) => {
          const locked = moduleView.status === 'locked';
          const isSelected = moduleView.module.id === selectedModuleId;
          return (
            <li key={moduleView.module.id}>
              <button
                type="button"
                disabled={locked}
                onClick={() => onSelectModule(moduleView.module.id)}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium transition-colors duration-150 ${
                  isSelected ? 'bg-primary/20 text-white' : 'text-slate-200 hover:bg-slate-800'
                } ${locked ? 'cursor-not-allowed opacity-50' : ''}`}
                aria-current={isSelected ? 'true' : undefined}
              >
                <span aria-hidden="true">{MODULE_ICON[moduleView.status]}</span>
                <span className="flex-1 truncate">{moduleView.module.title}</span>
                <span className="text-xs font-normal text-slate-400">
                  {moduleView.progressPercent}%
                </span>
              </button>

              <ul className="ml-6 mt-1 space-y-0.5 border-l border-slate-800 pl-3">
                {moduleView.lessons.map((lessonView) => {
                  const lessonLocked = lessonView.status === 'locked';
                  const isActive = lessonView.lesson.id === activeLessonId;
                  return (
                    <li key={lessonView.lesson.id}>
                      <button
                        type="button"
                        disabled={lessonLocked}
                        onClick={() => onSelectLesson(lessonView.lesson.id)}
                        className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs transition-colors duration-150 ${
                          isActive
                            ? 'bg-primary/10 text-primary-light'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        } ${lessonLocked ? 'cursor-not-allowed opacity-50' : ''}`}
                      >
                        <span aria-hidden="true">{LESSON_ICON[lessonView.status]}</span>
                        <span className="flex-1 truncate">{lessonView.lesson.title}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

import type { ReactElement, ReactNode } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';

export interface AppState {
  readonly activeTrackId?: string;
  readonly activeLessonId?: string;
}

export interface AppActions {
  setActiveTrack: (_trackId?: string) => void;
  setActiveLesson: (_lessonId?: string) => void;
}

export interface AppStore extends AppState, AppActions {}

const AppStoreContext = createContext<AppStore | undefined>(undefined);

const initialState: AppState = {
  activeTrackId: undefined,
  activeLessonId: undefined,
};

/**
 * Provide a minimal application store until the real state engine lands.
 * @todo TODO(impl): Replace with data-driven store (e.g., Zustand/Redux).
 */
export function AppStoreProvider({ children }: { children: ReactNode }): ReactElement {
  const [state, setState] = useState(initialState);

  const value = useMemo<AppStore>(
    () => ({
      ...state,
      setActiveTrack: (_trackId) => setState((prev) => ({ ...prev, activeTrackId: _trackId })),
      setActiveLesson: (_lessonId) => setState((prev) => ({ ...prev, activeLessonId: _lessonId })),
    }),
    [state],
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore(): AppStore {
  const context = useContext(AppStoreContext);
  if (!context) {
    throw new Error('useAppStore must be used within AppStoreProvider');
  }
  return context;
}

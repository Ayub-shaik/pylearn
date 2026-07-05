import { del, get, set } from 'idb-keyval';

import type { SessionState } from '@pylearn/core';

const SESSION_PREFIX = 'pylearn:session:';

interface PersistedSession {
  session: SessionState;
  savedAt: number;
}

export async function loadSessionState(trackId: string): Promise<SessionState | undefined> {
  try {
    const persisted = (await get<PersistedSession>(sessionKey(trackId))) ?? undefined;
    return persisted?.session;
  } catch (error) {
    console.warn('Failed to load session state from IndexedDB', error);
    return undefined;
  }
}

export async function saveSessionState(session: SessionState): Promise<void> {
  try {
    const payload: PersistedSession = {
      session,
      savedAt: Date.now(),
    };
    await set(sessionKey(session.trackId), payload);
  } catch (error) {
    console.warn('Failed to persist session state', error);
  }
}

export async function clearSessionState(trackId: string): Promise<void> {
  try {
    await del(sessionKey(trackId));
  } catch (error) {
    console.warn('Failed to clear session state', error);
  }
}

function sessionKey(trackId: string): string {
  return `${SESSION_PREFIX}${trackId}`;
}

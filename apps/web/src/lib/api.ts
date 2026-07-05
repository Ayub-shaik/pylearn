import type { Attempt, HintLevel, SessionState, SubmissionFeedback } from '@pylearn/core';

const API_BASE = '/api';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface AuthMeResponse {
  authenticated: boolean;
  user?: AuthUser;
}

export interface AttemptResponse {
  feedback: SubmissionFeedback;
  session: SessionState;
}

export interface HintResponse {
  content: string;
  provider: 'cache' | 'ollama' | 'nvidia-nim' | 'template';
}

// eslint-disable-next-line no-undef -- RequestInit is a DOM lib type, not a JS global
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!response.ok) {
    throw new Error(`API request to ${path} failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function getAuthConfig(): Promise<{ googleEnabled: boolean }> {
  return request('/auth/config');
}

export function getMe(): Promise<AuthMeResponse> {
  return request('/auth/me');
}

export function logout(): Promise<{ ok: boolean }> {
  return request('/auth/logout', { method: 'POST' });
}

export function googleSignInUrl(): string {
  return `${API_BASE}/auth/google/start`;
}

export function getSession(trackId: string): Promise<{ session: SessionState; summary: unknown }> {
  return request(`/sessions/${trackId}`);
}

export interface SubmitAttemptPayload {
  trackId: string;
  lessonId: string;
  checkpointId: string;
  selectedOptionId?: string;
  responseText?: string;
  revealsUsed?: number;
  lastHintLevel?: Attempt['lastHintLevel'];
}

export function submitAttemptRemote(payload: SubmitAttemptPayload): Promise<AttemptResponse> {
  return request('/attempts', { method: 'POST', body: JSON.stringify(payload) });
}

export interface RequestHintPayload {
  trackId: string;
  lessonId: string;
  checkpointId: string;
  level: HintLevel;
}

export function requestHint(payload: RequestHintPayload): Promise<HintResponse> {
  return request('/llm/hint', { method: 'POST', body: JSON.stringify(payload) });
}

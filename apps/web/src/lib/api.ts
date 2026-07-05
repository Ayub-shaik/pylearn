import type { Attempt, HintLevel, SessionState, SubmissionFeedback } from '@pylearn/core';

const API_BASE = '/api';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  startingLevel: string | null;
  learningGoal: string | null;
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
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`API request to ${path} failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function getAuthConfig(): Promise<{ googleEnabled: boolean; guestLoginEnabled: boolean }> {
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

export function guestLogin(username: string, password: string): Promise<{ ok: boolean }> {
  return request('/auth/guest', { method: 'POST', body: JSON.stringify({ username, password }) });
}

export function saveOnboarding(
  startingLevel: string,
  learningGoal: string,
): Promise<{ ok: boolean }> {
  return request('/profile/onboarding', {
    method: 'PUT',
    body: JSON.stringify({ startingLevel, learningGoal }),
  });
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

export interface RequestChatPayload {
  trackId: string;
  lessonId: string;
  checkpointId: string;
  message: string;
}

export function requestChat(payload: RequestChatPayload): Promise<HintResponse> {
  return request('/llm/chat', { method: 'POST', body: JSON.stringify(payload) });
}

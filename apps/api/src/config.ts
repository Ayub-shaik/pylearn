import path from 'node:path';
import { fileURLToPath } from 'node:url';

import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../..');

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required env var ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 8081),
  contentDir: path.resolve(REPO_ROOT, 'packages/data/content'),
  databaseUrl: required('DATABASE_URL', 'postgres://pylearn:pylearn@localhost:5432/pylearn'),
  sessionSecret: required('SESSION_SECRET', 'dev-insecure-session-secret-change-me'),
  publicOrigin: process.env.PUBLIC_ORIGIN ?? 'http://localhost:5180',

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    redirectUri:
      process.env.GOOGLE_REDIRECT_URI ??
      `${process.env.PUBLIC_ORIGIN ?? 'http://localhost:5180'}/api/auth/google/callback`,
  },
  get googleConfigured(): boolean {
    return Boolean(this.google.clientId && this.google.clientSecret);
  },

  devGuestLogin: {
    enabled: process.env.DEV_GUEST_LOGIN_ENABLED === 'true',
    username: process.env.DEV_GUEST_USERNAME ?? '',
    password: process.env.DEV_GUEST_PASSWORD ?? '',
  },

  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL ?? 'http://host.docker.internal:11434',
    model: process.env.LLM_MODEL ?? 'llama3.2:3b',
    timeoutMs: Number(process.env.OLLAMA_TIMEOUT_MS ?? 8000),
  },

  llmOverflow: {
    enabled: process.env.LLM_OVERFLOW_ENABLED === 'true',
    nvidiaApiKey: process.env.NVIDIA_NIM_API_KEY ?? '',
    nvidiaBaseUrl: process.env.NVIDIA_NIM_BASE_URL ?? 'https://integrate.api.nvidia.com/v1',
    nvidiaModel: process.env.NVIDIA_NIM_MODEL ?? 'meta/llama-3.1-8b-instruct',
  },
};

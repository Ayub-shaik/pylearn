import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

// Mirrors the path aliases already defined in tsconfig.json `paths` and
// apps/web/vite.config.ts `resolve.alias`, so tests import workspace
// packages exactly the way application code does.
export default defineConfig({
  resolve: {
    alias: {
      '@pylearn/core': path.resolve(rootDir, 'packages/core/src'),
      '@pylearn/data': path.resolve(rootDir, 'packages/data'),
      '@pylearn/ui-kit': path.resolve(rootDir, 'packages/ui-kit/src'),
      '@pylearn/llm': path.resolve(rootDir, 'packages/llm/src'),
    },
  },
  test: {
    environment: 'node',
    include: ['apps/**/*.test.{ts,tsx}', 'packages/**/*.test.{ts,tsx}'],
  },
});

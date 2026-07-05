import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// TODO(impl): Expand Vite config once build targets are defined.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    fs: {
      allow: [path.resolve(__dirname, '..', '..')],
    },
  },
  resolve: {
    alias: {
      '@pylearn/core': path.resolve(__dirname, '../../packages/core/src'),
      '@pylearn/data': path.resolve(__dirname, '../../packages/data'),
      '@pylearn/ui-kit': path.resolve(__dirname, '../../packages/ui-kit/src'),
      '@pylearn/llm': path.resolve(__dirname, '../../packages/llm/src'),
      '@web/pyodide': path.resolve(__dirname, './src/lib/pyodide/loader.ts'),
    },
  },
});

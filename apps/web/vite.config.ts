import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// TODO(impl): Expand Vite config once build targets are defined.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});

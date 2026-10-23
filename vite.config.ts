import tailwindcss from '@tailwindcss/vite';
import path from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * Serve at `/` by default (Docker/nginx). Only use a sub-path when
 * VITE_BASE_URL is set explicitly (e.g. GitHub Pages: `ocpp-simulate`).
 */
export function getBasePath(env: NodeJS.ProcessEnv = process.env) {
  const explicit = env.VITE_BASE_URL?.trim();
  if (env.NODE_ENV !== 'production' || !explicit || explicit === '/') {
    return '/';
  }

  const repoPath = explicit.includes('/') ? explicit.split('/').filter(Boolean).pop() : explicit;
  return repoPath ? `/${repoPath}/` : '/';
}

export default defineConfig({
  base: getBasePath(),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});

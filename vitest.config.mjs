import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'frontend'),
    },
  },
  test: {
    include: [
      'AI/**/*.test.ts',
      'backend/src/**/*.test.ts',
      'frontend/tests/**/*.test.ts',
    ],
    exclude: [
      '**/node_modules/**',
      '**/coverage/**',
      '**/.next/**',
      'backend/dist/**',
    ],
    pool: 'threads',
    watchExclude: [
      '**/.next/**',
      'backend/dist/**',
      '**/coverage/**',
    ],
  },
});

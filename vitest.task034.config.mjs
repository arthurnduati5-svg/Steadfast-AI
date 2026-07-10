import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  resolve: {
    alias: {
      '@/lib/utils': path.resolve(__dirname, 'AI/lib/utils.ts'),
      '@': path.resolve(__dirname, 'frontend'),
    },
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
  },
  test: {
    globals: true,
    include: [
      'backend/src/tests/task-034-*.test.ts',
      'backend/src/tests/task034-*.test.ts',
    ],
    exclude: [
      '**/node_modules/**',
      '**/coverage/**',
      '**/.next/**',
      'backend/dist/**',
    ],
    pool: 'forks',
    testTimeout: 30000,
    hookTimeout: 30000,
    setupFiles: ['backend/src/tests/vitest-setup.ts'],
    watchExclude: [
      '**/.next/**',
      'backend/dist/**',
      '**/coverage/**',
    ],
    deps: {
      interopDefault: true,
    },
  },
});

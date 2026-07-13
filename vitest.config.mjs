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
      'AI/**/*.test.ts',
      'backend/src/**/*.test.ts',
      'frontend/tests/**/*.test.ts',
    ],
    exclude: [
      '**/node_modules/**',
      '**/coverage/**',
      '**/.next/**',
      'backend/dist/**',
      'backend/src/tests/task-026-*',
      'backend/src/tests/task026-*',
      // 'backend/src/tests/task-027-*',
      // 'backend/src/tests/task027-*',
      'backend/src/tests/task-028-*',
      'backend/src/tests/task028-*',
      // 'backend/src/tests/task-029-*',
      // 'backend/src/tests/task029-*',
      'backend/src/tests/task-030-*',
      'backend/src/tests/task030-*',
      'backend/src/tests/task-031-*',
      'backend/src/tests/task031-*',
      // 'backend/src/tests/task-032-*',
      // 'backend/src/tests/task032-*',
      // 'backend/src/tests/task-033-*',
      // 'backend/src/tests/task033-*',
      // 'backend/src/tests/task-034-*',
      // 'backend/src/tests/task034-*',
      // 'backend/src/tests/task-035-*',
      // 'backend/src/tests/task035-*',
      // 'backend/src/tests/task-036-*',
      // 'backend/src/tests/task036-*',
      'backend/src/tests/task-037-*',
      'backend/src/tests/task037-*',
      'backend/src/tests/task-038-*',
      'backend/src/tests/task038-*',
      'backend/src/tests/task-039-*',
      'backend/src/tests/task039-*',
      // 'backend/src/tests/task-040-*',
      // 'backend/src/tests/task040-*',
      'backend/src/tests/video-*',
      'backend/src/tests/video*',
      'backend/src/tests/teacher-intervention-*',
      'backend/src/tests/artifact-aware-practice-*',
      'backend/src/tests/artifact-reasoning-*',
      'backend/src/tests/artifact-understanding-*',
      'backend/src/tests/artifact-reasoning-v2-*',
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

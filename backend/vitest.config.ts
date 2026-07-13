import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  test: {
    root: path.resolve(__dirname),
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    exclude: [

      'src/tests/task-026-*',
      'src/tests/task026-*',
      // 'src/tests/task-027-*',
      // 'src/tests/task027-*',
      'src/tests/task-028-*',
      'src/tests/task028-*',

      'src/tests/task-030-*',
      'src/tests/task030-*',
      'src/tests/task-031-*',
      'src/tests/task031-*',
      // 'src/tests/task-032-*',
      // 'src/tests/task032-*',
      'src/tests/task-033-*',
      'src/tests/task033-*',
      // 'src/tests/task-034-*',
      // 'src/tests/task034-*',
      // 'src/tests/task-035-*',
      // 'src/tests/task035-*',
      // 'src/tests/task-036-*',
      // 'src/tests/task036-*',
      'src/tests/task-037-*',
      'src/tests/task037-*',
      'src/tests/task-038-*',
      'src/tests/task038-*',
      'src/tests/task-039-*',
      'src/tests/task039-*',
      // 'src/tests/task-040-*',
      // 'src/tests/task040-*',
      'src/tests/video-*',
      'src/tests/video*',
      'src/tests/teacher-intervention-*',
      'src/tests/artifact-aware-practice-*',
      'src/tests/artifact-reasoning-*',
      'src/tests/artifact-understanding-*',
      'src/tests/artifact-reasoning-v2-*',
    ],
    setupFiles: ['src/tests/vitest-setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000
  }
});


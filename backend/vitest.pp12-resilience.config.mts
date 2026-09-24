import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'src/tests/practice-pad-pp12-postgres-migrations-concurrency.test.ts',
      'src/tests/practice-pad-pp12-projection-recovery.test.ts',
      'src/tests/practice-pad-pp12-backup-restore.test.ts',
    ],
    setupFiles: [],
    fileParallelism: false,
    testTimeout: 120000,
    hookTimeout: 120000,
  },
});

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/tests/practice-pad-p0-real-persistence.test.ts'],
    setupFiles: [],
    fileParallelism: false,
    testTimeout: 60000,
    hookTimeout: 60000,
  },
});

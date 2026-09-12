import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/tests/r8g2-recovery-action-readiness-prisma.test.ts'],
    setupFiles: [],
    fileParallelism: false,
    testTimeout: 60000,
    hookTimeout: 60000,
  },
});

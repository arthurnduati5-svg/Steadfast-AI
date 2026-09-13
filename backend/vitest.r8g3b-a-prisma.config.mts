import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'src/tests/r8g3b-a-package20-draft-durability-prisma.test.ts',
    ],
    setupFiles: [],
    fileParallelism: false,
    testTimeout: 60000,
    hookTimeout: 60000,
  },
});

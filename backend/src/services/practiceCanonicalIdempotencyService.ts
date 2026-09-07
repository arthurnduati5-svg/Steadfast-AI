// ─────────────────────────────────────────────────────────────
// R6: durable idempotency receipt helper for practice canonical chain.
// Test seam lives here so production code can reset cleanly.
// ─────────────────────────────────────────────────────────────

import prisma from '../lib/prisma';

export const practiceCanonicalIdempotency = {
  async resetForTest(): Promise<void> {
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM "PracticeCanonicalIdempotency"`);
    } catch {
      // table may not exist in pure in-memory test runs
    }
  },
};

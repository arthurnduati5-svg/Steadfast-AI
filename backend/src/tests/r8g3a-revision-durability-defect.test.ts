import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// R8-G.3A Living Revision — DEFECT_PROCESS_LOCAL_CANONICAL lock + CONTRADICTION record.
// The phase3 living-revision repository is process-local by construction
// (Map/Set heap stores, Math.random IDs, no Prisma import) while the
// mounted route accepts canonical mutations (create/pin/complete/snooze/
// archive). No suitable existing Prisma model backs these node/edge/due
// shapes, so durability repair is architecture work (CONTRADICTION), not
// a silent in-memory success. These assertions lock the defect so no
// future change can silently claim durability.
const SRC = path.resolve(__dirname, '..');

describe('R8-G.3A living-revision defect lock', () => {
  it('revision repository has no durable backend import', () => {
    const repo = fs.readFileSync(
      path.join(SRC, 'services/phase3LivingRevisionRepository.ts'),
      'utf-8',
    );
    expect(repo).not.toMatch(/from ['"]\.\.\/lib\/prisma['"]/);
    expect(repo).not.toContain('PrismaClient');
    expect(repo).toContain('new Map');
  });

  it('revision route accepts canonical mutations on the volatile store', () => {
    const route = fs.readFileSync(
      path.join(SRC, 'routes/phase3LivingRevisionRoutes.ts'),
      'utf-8',
    );
    expect(route).toContain('/learner/nodes');
    expect(route).toContain('createRevisionNode');
    const index = fs.readFileSync(path.join(SRC, 'index.ts'), 'utf-8');
    expect(index).toContain('phase3LivingRevisionRoutes');
    expect(index).toContain('/api/phase3/living-revision');
  });
});

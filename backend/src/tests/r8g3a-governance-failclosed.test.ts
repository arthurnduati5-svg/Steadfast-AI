import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// R8-G.3A Governance — fail-closed preservation proof + durability defect lock.
// Safety direction is preserved (unknown/pending sources are never treated
// as approved), while durable composition of the task022 singletons is
// NOT mechanically completable (sync Map APIs consumed across the
// codebase; Prisma repos exist but unwired) — recorded CONTRADICTION.
import { ApprovedSourceRegistryService } from '../services/task022ApprovedSourceRegistryService';

const SRC = path.resolve(__dirname, '..');

function pendingSource(id: string): any {
  return {
    id,
    curriculumFamily: 'test-family' as any,
    approvalStatus: 'pending_review',
    title: 'Pending source',
    subject: 'math',
    topic: 'fractions',
  };
}

describe('R8-G.3A governance fail-closed behavior', () => {
  it('pending/unknown sources are never treated as approved', () => {
    const registry = new ApprovedSourceRegistryService();
    registry.registerSource(pendingSource('src-pending-1'));
    expect(registry.isSourceApproved('src-pending-1')).toBe(false);
    expect(registry.isSourceApproved('src-unknown-xyz')).toBe(false);
    expect(registry.getApprovedSources().find((s: any) => s.id === 'src-pending-1')).toBeUndefined();
  });

  it('durable Prisma repositories exist for all four governance record families', () => {
    const dir = path.join(SRC, 'services/contentGovernance/repositories');
    for (const file of [
      'prismaApprovedSourceRepository.ts',
      'prismaContentGapRepository.ts',
      'prismaContentGovernanceAuditRepository.ts',
    ]) {
      expect(fs.existsSync(path.join(dir, file)), `${file} must exist`).toBe(true);
    }
    const moderation = fs.readFileSync(
      path.join(SRC, 'domains/assessment/marking/repositories/prismaMarkingRepositories.ts'),
      'utf-8',
    );
    expect(moderation).toContain('moderationDecisionRecord');
  });

  it('task022 registry/audit/gap singletons remain process-local (defect lock)', () => {
    for (const rel of [
      'services/task022ApprovedSourceRegistryService.ts',
      'services/task022ContentGovernanceAuditService.ts',
      'services/task022ContentGapDetectionService.ts',
    ]) {
      const content = fs.readFileSync(path.join(SRC, rel), 'utf-8');
      expect(content, `${rel} must not fake durability`).toMatch(/new Map|private records/);
      expect(content).not.toContain('../lib/prisma');
    }
  });
});

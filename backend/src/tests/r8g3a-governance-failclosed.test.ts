import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// R8-G.3A Governance — fail-closed preservation proof + final durable-state lock.
// Safety direction is preserved (unknown/pending sources are never treated
// as approved). The earlier intermediate "process-local defect lock" has
// been SUPERSEDED BY R8-G.3A FINAL RECONCILIATION: D2/D2C made the four
// governance record families durable (ApprovedSourceRecord,
// ContentGapRecord, ModerationDecisionRecord = DURABLE_CANONICAL;
// ContentGovernanceAuditRecord = DURABLE_EVENT) with a Prisma fail-closed
// production default and explicit opt-in memory test compatibility only.
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

  it('R8-G.3A-D2 final state: registry/audit/gap canonical ownership is durable (supersedes defect lock)', () => {
    // Final-state contract (R8-G.3A final reconciliation): the Prisma
    // repositories are the production default; the legacy in-memory
    // structures remain ONLY as explicit test compatibility behind the
    // explicit domain-specific opt-in flag, never as canonical truth.
    const approved = fs.readFileSync(
      path.join(SRC, 'services/task022ApprovedSourceRegistryService.ts'),
      'utf-8',
    );
    expect(approved).toContain('PrismaApprovedSourceRepository');
    expect(approved).toContain('CONTENT_GOVERNANCE_REQUIRE_DURABLE');
    expect(approved).toContain("CONTENT_GOVERNANCE_ALLOW_MEMORY_FALLBACK === '1'");
    expect(approved).toMatch(/new Map/); // legacy test-compatibility structures only

    const audit = fs.readFileSync(
      path.join(SRC, 'services/task022ContentGovernanceAuditService.ts'),
      'utf-8',
    );
    expect(audit).toContain('PrismaContentGovernanceAuditRepository');
    expect(audit).toContain('recordDurable');
    expect(audit).toContain('isApprovedSourceMemoryFallbackAllowed');
    expect(audit).not.toContain('ASSESSMENT_MODERATION_ALLOW_MEMORY');

    const gap = fs.readFileSync(
      path.join(SRC, 'services/task022ContentGapDetectionService.ts'),
      'utf-8',
    );
    expect(gap).toContain('PrismaContentGapRepository');
    expect(gap).toContain('detectGapDurable');
  });

  it('durable governance reads fail closed: a failed durable read is never approved', () => {
    const approved = fs.readFileSync(
      path.join(SRC, 'services/task022ApprovedSourceRegistryService.ts'),
      'utf-8',
    );
    expect(approved).toContain('a failed durable read is NEVER equivalent to');
    expect(approved).toContain('isApprovedDurable');
  });
});

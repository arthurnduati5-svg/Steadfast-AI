import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// R8-G.3A-D2 Focused Proof — production composition lock (static).
// Fails if the mounted content-governance routes or the moderation service
// composition are rewired back to process-local (memory) canonical ownership.

const SRC = path.resolve(__dirname, '..');

function readFile(rel: string): string {
  return fs.readFileSync(path.join(SRC, rel), 'utf-8');
}

describe('R8-G.3A-D2 governance composition lock', () => {
  // ── Approved Source ──────────────────────────────────────────────────────
  it('approved-source service exposes durable production methods', () => {
    const svc = readFile('services/task022ApprovedSourceRegistryService.ts');
    for (const fn of [
      'registerSourceDurable',
      'getSourceDurable',
      'getAllSourcesDurable',
      'getApprovedSourcesDurable',
      'isApprovedDurable',
      'setSourceStatusDurable',
      'approveSourceDurable',
      'rejectSourceDurable',
      'deprecateSourceDurable',
    ]) {
      expect(svc).toContain(fn);
    }
    expect(svc).toContain('PrismaApprovedSourceRepository');
    expect(svc).toContain('CONTENT_GOVERNANCE_REQUIRE_DURABLE');
    expect(svc).toContain('CONTENT_GOVERNANCE_ALLOW_MEMORY_FALLBACK');
  });

  it('mounted content-governance routes do not use memory methods as canonical ownership', () => {
    // Route with the register endpoint must use durable registration.
    const task022Route = readFile('routes/task022CurriculumContentGovernanceRoutes.ts');
    expect(task022Route).toContain('registerSourceDurable');

    for (const route of ['routes/contentGovernance.ts', 'routes/task022CurriculumContentGovernanceRoutes.ts']) {
      const text = readFile(route);
      // Canonical source read/mutation must use the durable async API.
      expect(text).toContain('getSourceDurable');
      expect(text).toContain('approveSourceDurable');
      // Legacy sync memory methods must not be called from production routes.
      expect(text).not.toMatch(/approvedSourceRegistryService\.(registerSource|getSource|getAllSources|setSourceStatus)\s*\(/);
      expect(text).not.toMatch(/sourceApprovalWorkflowService\.(proposeSource|approveSource|rejectSource|blockSource)\s*\(/);
    }
  });

  // ── Content Gap ──────────────────────────────────────────────────────────
  it('gap routes resolve through the durable gap owner', () => {
    for (const route of ['routes/contentGovernance.ts', 'routes/task022CurriculumContentGovernanceRoutes.ts']) {
      const text = readFile(route);
      expect(text).toContain('detectGapDurable');
      expect(text).not.toMatch(/contentGapDetectionService\.detectGap\s*\(/);
      expect(text).not.toMatch(/contentGapDetectionService\.getAllGaps\s*\(/);
    }
    const svc = readFile('services/task022ContentGapDetectionService.ts');
    expect(svc).toContain('PrismaContentGapRepository');
    expect(svc).toContain('detectGapDurable');
  });

  // ── Governance Audit ─────────────────────────────────────────────────────
  it('required audits are durable and awaited in production routes', () => {
    for (const route of ['routes/contentGovernance.ts', 'routes/task022CurriculumContentGovernanceRoutes.ts']) {
      const text = readFile(route);
      // No fire-and-forget required audit: durable helpers must be awaited.
      const lines = text.split('\n');
      for (const line of lines) {
        if (/record(SourceAction|ContentGrounding|DeenReferral|GapDetected|TeacherOnlyFiltered|CurriculumResolved)Durable|recordDurable\(/.test(line)) {
          expect(line.trim().startsWith('await ') || line.includes('= await ') || line.includes('return await ') || /await\s+contentGovernanceAuditService/.test(line)).toBe(true);
        }
      }
      expect(text).not.toMatch(/\brecordSourceAction\s*\(/);
      expect(text).not.toMatch(/\brecordContentGrounding\s*\(/);
      expect(text).not.toMatch(/\brecordDeenReferral\s*\(/);
      expect(text).not.toMatch(/\brecordGapDetected\s*\(/);
    }
    const svc = readFile('services/task022ContentGovernanceAuditService.ts');
    expect(svc).toContain('PrismaContentGovernanceAuditRepository');
    expect(svc).toContain('recordDurable');
  });

  it('grounding decisions use durable approval truth (fail closed)', () => {
    for (const route of ['routes/contentGovernance.ts', 'routes/task022CurriculumContentGovernanceRoutes.ts']) {
      const text = readFile(route);
      expect(text).toContain('checkDurable');
      expect(text).not.toMatch(/contentGroundingService\.check\s*\(/);
    }
    const svc = readFile('services/task022ContentGroundingService.ts');
    expect(svc).toContain('getApprovedSourcesDurable');
    expect(svc).toContain('checkDurable');
  });

  // ── Moderation ───────────────────────────────────────────────────────────
  it('moderation production composition is Prisma, memory only via explicit opt-in flag', () => {
    const svc = readFile('domains/assessment/marking/services/moderationService.ts');
    expect(svc).toContain('PrismaModerationDecisionRepository');
    expect(svc).toContain('ASSESSMENT_MODERATION_ALLOW_MEMORY');
    // Default constructor path resolves through the Prisma default factory.
    expect(svc).toContain('createDefaultModerationRepo');
  });

  it('memory fallback requires explicit domain-specific opt-in (never NODE_ENV-based)', () => {
    const svc = readFile('services/task022ApprovedSourceRegistryService.ts');
    expect(svc).not.toMatch(/NODE_ENV\s*!==?\s*['"]production['"]/);
    expect(svc).toContain("process.env.CONTENT_GOVERNANCE_ALLOW_MEMORY_FALLBACK === '1'");
    expect(svc).toMatch(/CONTENT_GOVERNANCE_REQUIRE_DURABLE === '1'/);
  });
});

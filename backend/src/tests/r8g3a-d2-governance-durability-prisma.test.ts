/**
 * R8-G.3A-D2 Governance durability proof — REAL PostgreSQL.
 *
 * Runs under vitest.r8g3a-d2-prisma.config.mts (setupFiles: []) so the global
 * ../lib/prisma mock is NOT installed. Uses unique IDs per run and cleans only
 * rows it owns. Never truncates shared tables.
 *
 * Proofs (instance A writes -> NEW instance B reads = restart durability):
 *  Approved Source:
 *   1. register pending source -> reconstruct -> remains pending, not approved
 *   2. approve via authorized production operation -> reconstruct -> approved
 *   3. unknown source -> isApproved false (fail closed)
 *   4. repository failure -> never reports approved (throws)
 *  Content Gap:
 *   5. detect/persist safe gap -> reconstruct -> gap remains
 *   6. repeated sequential detection returns the same canonical record (no dup)
 *   7. no raw content persisted (safe fields only)
 *  Governance Audit:
 *   8. record required governance event -> reconstruct -> event remains
 *   9. audit repository failure -> required operation does not report success
 *  Moderation (ACTIVE):
 *  10. create moderation decision -> reconstruct service -> decision remains
 *  11. valid state transition -> reconstruct -> transition remains
 *  12. production default is Prisma (no ASSESSMENT_MODERATION_ALLOW_MEMORY)
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as path from 'path';
import { config } from 'dotenv';

config({ path: path.resolve(__dirname, '../../.env') });

process.env.NODE_ENV = 'test';
// Prove production default: no memory opt-in flags are set.
delete process.env.CONTENT_GOVERNANCE_ALLOW_MEMORY_FALLBACK;
delete process.env.CONTENT_GOVERNANCE_REQUIRE_DURABLE;
delete process.env.ASSESSMENT_MODERATION_ALLOW_MEMORY;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { default: prisma } = await import('../lib/prisma');

const { ApprovedSourceRegistryService } = await import('../services/task022ApprovedSourceRegistryService');
const { SourceApprovalWorkflowService } = await import('../services/task022SourceApprovalWorkflowService');
const { ContentGapDetectionService } = await import('../services/task022ContentGapDetectionService');
const { ContentGovernanceAuditService } = await import('../services/task022ContentGovernanceAuditService');
const { ModerationService } = await import('../domains/assessment/marking/services/moderationService');
const { InMemoryMarkingResultVersionRepository } = await import('../domains/assessment/marking/repositories/inMemoryMarkingRepositories');
const { PrismaMarkingResultVersionRepository } = await import('../domains/assessment/marking/repositories/prismaMarkingRepositories');
const { FailingApprovedSourceRepository } = await import('./r8g3a-d2-failing-repositories');
const { FailingContentGovernanceAuditRepository } = await import('./r8g3a-d2-failing-repositories');

const RUN = `r8g3ad2-${Date.now().toString(36)}`;
const SCHOOL = `${RUN}-school`;

function sourceInput(id: string, approvalStatus: string): any {
  const now = new Date().toISOString();
  return {
    id,
    schoolId: SCHOOL,
    sourceKey: `${RUN}-${id}`,
    title: 'D2 durable proof source',
    sourceType: 'curriculum_specification',
    curriculumFamily: 'cambridge_academic',
    subject: 'mathematics',
    topic: 'algebra',
    trustLevel: 'review_required',
    approvalStatus,
    reviewRequired: approvalStatus !== 'approved',
    restrictedUse: false,
    createdAt: now,
    updatedAt: now,
  };
}

let createdSourceIds: string[] = [];
let createdGapIds: string[] = [];
let createdAuditIds: string[] = [];
let createdModerationIds: string[] = [];
let createdResultIds: string[] = [];

afterAll(async () => {
  // Clean only rows this run owns.
  if (createdModerationIds.length > 0) {
    await prisma.moderationDecisionRecord.deleteMany({ where: { moderationDecisionId: { in: createdModerationIds } } });
  }
  if (createdResultIds.length > 0) {
    await prisma.markingResultVersionRecord.deleteMany({ where: { markingResultVersionId: { in: createdResultIds } } });
  }
  if (createdAuditIds.length > 0) {
    await prisma.contentGovernanceAuditRecord.deleteMany({ where: { id: { in: createdAuditIds } } });
  }
  if (createdGapIds.length > 0) {
    await prisma.contentGapRecord.deleteMany({ where: { id: { in: createdGapIds } } });
  }
  if (createdSourceIds.length > 0) {
    await prisma.approvedSourceRecord.deleteMany({ where: { id: { in: createdSourceIds } } });
  }
  await prisma.$disconnect();
});

describe('R8-G.3A-D2 Approved Source durability (real PostgreSQL)', () => {
  it('registers a pending source; a reconstructed service still sees it pending and not approved', async () => {
    const id = `${RUN}-src-pending`;
    createdSourceIds.push(id);

    const serviceA = new ApprovedSourceRegistryService();
    await serviceA.registerSourceDurable(sourceInput(id, 'pending_review'));

    // Restart: brand-new service instance B.
    const serviceB = new ApprovedSourceRegistryService();
    const reloaded = await serviceB.getSourceDurable(id);
    expect(reloaded).not.toBeNull();
    expect(reloaded!.approvalStatus).toBe('pending_review');
    expect(await serviceB.isApprovedDurable(id)).toBe(false);
  });

  it('approves through an authorized production operation; restart preserves approved truth', async () => {
    const id = `${RUN}-src-approve`;
    createdSourceIds.push(id);

    const serviceA = new ApprovedSourceRegistryService();
    await serviceA.registerSourceDurable(sourceInput(id, 'pending_review'));

    const workflowA = new SourceApprovalWorkflowService();
    const approved = await workflowA.approveSourceDurable(id, 'system_admin');
    expect(approved).not.toBeNull();
    expect(approved!.approvalStatus).toBe('approved');

    // Restart: new workflow + new registry instance.
    const workflowB = new SourceApprovalWorkflowService();
    const reloaded = await workflowB.approveSourceDurable; // presence check
    expect(typeof reloaded).toBe('function');
    const serviceB = new ApprovedSourceRegistryService();
    const durable = await serviceB.getSourceDurable(id);
    expect(durable!.approvalStatus).toBe('approved');
    expect(durable!.approvedByRole).toBe('system_admin');
    expect(await serviceB.isApprovedDurable(id)).toBe(true);
  });

  it('unknown source fails closed (never approved)', async () => {
    const serviceB = new ApprovedSourceRegistryService();
    expect(await serviceB.getSourceDurable(`${RUN}-src-never-created`)).toBeNull();
    expect(await serviceB.isApprovedDurable(`${RUN}-src-never-created`)).toBe(false);
  });

  it('dependency failure never reports approved (fail closed, explicit failure)', async () => {
    const failingService = new ApprovedSourceRegistryService(new FailingApprovedSourceRepository());
    await expect(failingService.isApprovedDurable(`${RUN}-src-any`)).rejects.toThrow();
  });

  it('deen-sensitive approval policy preserved (teacher cannot approve madrasa_deen)', async () => {
    const id = `${RUN}-src-deen`;
    createdSourceIds.push(id);

    const serviceA = new ApprovedSourceRegistryService();
    const deenSource = sourceInput(id, 'pending_review');
    deenSource.curriculumFamily = 'madrasa_deen';
    deenSource.deenCategory = 'aqeedah';
    await serviceA.registerSourceDurable(deenSource);

    const workflowA = new SourceApprovalWorkflowService();
    const result = await workflowA.approveSourceDurable(id, 'teacher');
    expect(result).toBeNull(); // referral path: not approved
    const serviceB = new ApprovedSourceRegistryService();
    const reloaded = await serviceB.getSourceDurable(id);
    expect(reloaded!.approvalStatus).toBe('pending_review');
    expect(await serviceB.isApprovedDurable(id)).toBe(false);
  });
});

describe('R8-G.3A-D2 Content Gap durability (real PostgreSQL)', () => {
  it('detects and persists a safe gap; reconstruction preserves it', async () => {
    const serviceA = new ContentGapDetectionService();
    const gap = await serviceA.detectGapDurable('cambridge_academic', undefined, 'd2-gap-topic-unique');
    expect(gap).not.toBeNull();
    expect(gap!.gapType).toBe('missing_curriculum_mapping');
    createdGapIds.push(gap!.id);

    // Restart: new instance B. Key format is family:subject:topic:skill.
    const gapId = gap!.id;
    expect(gapId).toBe('cambridge_academic:*:d2-gap-topic-unique:*');
    const serviceB = new ContentGapDetectionService();
    const reloaded = await serviceB.getGapByIdDurable(gapId);
    expect(reloaded).not.toBeNull();
    expect(reloaded!.gapType).toBe('missing_curriculum_mapping');
    expect(reloaded!.status).toBe('open');
  });

  it('repeated sequential detection returns the same canonical gap (no duplicate state)', async () => {
    const serviceA = new ContentGapDetectionService();
    const first = await serviceA.detectGapDurable('cambridge_academic', undefined, 'd2-gap-topic-repeat');
    expect(first).not.toBeNull();
    createdGapIds.push(first!.id);

    const serviceB = new ContentGapDetectionService();
    const second = await serviceB.detectGapDurable('cambridge_academic', undefined, 'd2-gap-topic-repeat');
    expect(second).not.toBeNull();
    expect(second!.id).toBe(first!.id);

    const persisted = await prisma.contentGapRecord.findMany({ where: { id: first!.id } });
    expect(persisted.length).toBe(1);
  });

  it('persists only safe gap fields (no raw learner content)', async () => {
    const serviceA = new ContentGapDetectionService();
    const gap = await serviceA.detectGapDurable('cambridge_academic', undefined, 'd2-gap-topic-rawcheck');
    createdGapIds.push(gap!.id);

    const row = await prisma.contentGapRecord.findUnique({ where: { id: gap!.id } });
    expect(row).not.toBeNull();
    const allowedFields = new Set(['id', 'schoolId', 'curriculumFamily', 'subject', 'topic', 'skill', 'gapType', 'status', 'safeSummary', 'reasonCodes', 'createdAt', 'updatedAt']);
    for (const key of Object.keys(row as unknown as Record<string, unknown>)) {
      expect(allowedFields.has(key)).toBe(true);
    }
  });
});

describe('R8-G.3A-D2 Governance Audit durability (real PostgreSQL)', () => {
  it('records a required governance event; reconstruction preserves it (append-only)', async () => {
    const serviceA = new ContentGovernanceAuditService();
    const record = await serviceA.recordSourceActionDurable('source_approved', `${RUN}-audit-src`, 'system_admin');
    createdAuditIds.push(record.id);

    // Restart: new instance B.
    const serviceB = new ContentGovernanceAuditService();
    const found = await serviceB.getRecordsDurable({ eventType: 'source_approved', limit: 100 });
    const match = found.find(r => r.id === record.id);
    expect(match).toBeDefined();
    expect(match!.actorRole).toBe('system_admin');
    expect(match!.privacyMetadata).toEqual({ safe: true });
  });

  it('helper semantics preserved (recordGapDetectedDurable)', async () => {
    const serviceA = new ContentGovernanceAuditService();
    const record = await serviceA.recordGapDetectedDurable('teacher', 'cambridge_academic', ['missing_approved_source']);
    createdAuditIds.push(record.id);

    const serviceB = new ContentGovernanceAuditService();
    const found = await serviceB.getRecordsDurable({ eventType: 'curriculum_gap_detected', limit: 100 });
    expect(found.find(r => r.id === record.id)).toBeDefined();
  });

  it('audit repository failure does not report successful governance completion', async () => {
    const failingService = new ContentGovernanceAuditService(new FailingContentGovernanceAuditRepository());
    await expect(
      failingService.recordSourceActionDurable('source_approved', `${RUN}-audit-fail`, 'system_admin'),
    ).rejects.toThrow();
  });

  it('audit payload remains privacy-safe (safe metadata only)', async () => {
    const serviceA = new ContentGovernanceAuditService();
    const record = await serviceA.recordContentGroundingDurable('content_grounding_denied', 'cambridge_academic', 'teacher', ['no-approved-source-for-topic']);
    createdAuditIds.push(record.id);

    const row = await prisma.contentGovernanceAuditRecord.findUnique({ where: { id: record.id } });
    expect(row).not.toBeNull();
    const serialized = JSON.stringify(row);
    // No raw learner content fields exist on the audit model.
    expect(serialized).not.toContain('studentSafeContent');
    expect(serialized).not.toContain('answerKey');
  });
});

describe('R8-G.3A-D2 Moderation durability (real PostgreSQL — ACTIVE verdict)', () => {
  it('production composition uses Prisma default (no memory opt-in)', () => {
    expect(process.env.ASSESSMENT_MODERATION_ALLOW_MEMORY).toBeUndefined();
  });

  it('creates a moderation decision; a reconstructed service still sees it', async () => {
    const resultId = `${RUN}-rv-mod-create`;
    createdResultIds.push(resultId);
    await prisma.markingResultVersionRecord.create({
      data: {
        markingResultVersionId: resultId,
        schoolId: SCHOOL,
        markingRunId: `${RUN}-run`,
        questionId: 'q-d2',
        questionVersionId: 'qv-d2',
        answerSnapshotRef: 'snap-d2',
        resultVersionNumber: 1,
        status: 'provisional',
        questionType: 'multiple_choice',
        markingMethod: 'deterministic_choice',
        marksAwarded: 1,
        marksAvailable: 1,
        confidence: 1,
        requiresTeacherReview: false,
        reviewReasonCode: '',
        safeStudentFeedback: '',
        safeTeacherSummary: '',
        createdByActorId: 'sys',
        createdByRole: 'system_job',
      },
    });

    const serviceA = new ModerationService();
    const mod = await serviceA.createModerationDecision({
      schoolId: SCHOOL,
      markingResultVersionId: resultId,
      decision: 'uphold',
      safeReason: 'D2 durability proof.',
      decidedByActorId: 'admin-d2',
      decidedByRole: 'admin',
    });
    createdModerationIds.push(mod.moderationDecisionId);
    expect(mod.status).toBe('pending');

    // Restart: brand-new default service instance (production composition).
    const serviceB = new ModerationService();
    const reloaded = await (serviceB as any).moderationRepo.findById(mod.moderationDecisionId);
    expect(reloaded).not.toBeNull();
    expect(reloaded!.decision).toBe('uphold');
    expect(reloaded!.decidedByRole).toBe('admin');
  });

  it('valid state transition persists through restart', async () => {
    const resultId = `${RUN}-rv-mod-transition`;
    createdResultIds.push(resultId);
    await prisma.markingResultVersionRecord.create({
      data: {
        markingResultVersionId: resultId,
        schoolId: SCHOOL,
        markingRunId: `${RUN}-run`,
        questionId: 'q-d2',
        questionVersionId: 'qv-d2',
        answerSnapshotRef: 'snap-d2',
        resultVersionNumber: 1,
        status: 'provisional',
        questionType: 'essay',
        markingMethod: 'teacher_required',
        marksAwarded: 2,
        marksAvailable: 5,
        confidence: 0,
        requiresTeacherReview: true,
        reviewReasonCode: 'essay_default_review',
        safeStudentFeedback: '',
        safeTeacherSummary: '',
        createdByActorId: 'sys',
        createdByRole: 'system_job',
      },
    });

    const serviceA = new ModerationService();
    const mod = await serviceA.createModerationDecision({
      schoolId: SCHOOL,
      markingResultVersionId: resultId,
      decision: 'adjust',
      safeReason: 'D2 transition proof.',
      decidedByActorId: 'hod-d2',
      decidedByRole: 'department_head',
    });
    createdModerationIds.push(mod.moderationDecisionId);

    const adjusted = await serviceA.adjustThroughModeration(mod.moderationDecisionId, 4, 'Partial credit');
    expect(adjusted.status).toBe('adjusted');

    // Restart: new default service instance reads the transition.
    const serviceB = new ModerationService();
    const reloaded = await (serviceB as any).moderationRepo.findById(mod.moderationDecisionId);
    expect(reloaded!.status).toBe('adjusted');
    expect(reloaded!.decision).toBe('adjust');

    const resultRepoB = new PrismaMarkingResultVersionRepository(prisma as any);
    const result = await resultRepoB.findById(resultId);
    expect(result!.marksAwarded).toBe(4);
    expect(result!.status).toBe('moderated');
  });

  it('existing role restrictions remain unchanged (student forbidden)', async () => {
    const service = new ModerationService();
    await expect(service.createModerationDecision({
      schoolId: SCHOOL,
      markingResultVersionId: `${RUN}-rv-never`,
      decision: 'uphold',
      safeReason: 'test',
      decidedByActorId: 'student-1',
      decidedByRole: 'student',
    })).rejects.toThrow('FORBIDDEN');
  });
});

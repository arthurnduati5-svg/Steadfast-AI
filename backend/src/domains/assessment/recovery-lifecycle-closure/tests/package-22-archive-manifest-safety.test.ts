import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryRecoveryLifecycleClosureRepositories } from '../repositories/inMemoryRecoveryLifecycleClosureRepositories';
import { RecoveryArchiveManifestService } from '../services/recoveryArchiveManifestService';
import { RecoveryLifecycleClosureSafetyService } from '../services/recoveryLifecycleClosureSafetyService';
import { RecoveryLifecycleClosureAuditBridge } from '../services/recoveryLifecycleClosureAuditBridge';
import { RecoveryLifecycleClosureIdempotencyService } from '../services/recoveryLifecycleClosureIdempotencyService';
import { RecoveryLifecycleClosurePolicyEnforcer } from '../policies/recoveryLifecycleClosurePolicyDefinitions';
import { RecoveryLifecycleClosureCommandContext } from '../contracts/recoveryLifecycleClosureContracts';

describe('Package 22 - Archive Manifest Safety', () => {
  let repos: InMemoryRecoveryLifecycleClosureRepositories;
  let service: RecoveryArchiveManifestService;
  let ctx: RecoveryLifecycleClosureCommandContext;
  const schoolId = 'school-1';

  beforeEach(() => {
    repos = new InMemoryRecoveryLifecycleClosureRepositories();
    const policyEnforcer = new RecoveryLifecycleClosurePolicyEnforcer();
    const safety = new RecoveryLifecycleClosureSafetyService(policyEnforcer);
    const audit = new RecoveryLifecycleClosureAuditBridge(repos);
    const idempotency = new RecoveryLifecycleClosureIdempotencyService(repos);
    service = new RecoveryArchiveManifestService(repos, policyEnforcer, safety, audit, idempotency);
    ctx = { schoolId, actorId: 'actor-1', actorRole: 'teacher', correlationId: 'corr-1', idempotencyKey: 'ik-1' };
  });

  it('creates archive manifest in draft status', async () => {
    const result = await service.createArchiveManifest(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeManifestSummary: 'Archive manifest test',
    });
    expect(result.success).toBe(true);
    expect(result.data?.manifestStatus).toBe('draft');
  });

  it('blocks student role from creating', async () => {
    const studentCtx = { ...ctx, actorRole: 'student' };
    const result = await service.createArchiveManifest(studentCtx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeManifestSummary: 'Test',
    });
    expect(result.success).toBe(false);
    expect(result.status).toBe('DENIED');
  });

  it('manifest is metadata-only (no PDF/HTML binary)', async () => {
    const result = await service.createArchiveManifest(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeManifestSummary: 'Metadata only',
      manifestContentsJson: { records: ['a', 'b'] },
      recordCountsJson: { total: 2 },
    });
    expect(result.success).toBe(true);
    expect(result.data?.manifestContentsJson).toBeDefined();
    expect(result.data?.recordCountsJson).toBeDefined();
    expect((result.data as any)?.pdfBinary).toBeUndefined();
    expect((result.data as any)?.pdfBuffer).toBeUndefined();
    expect((result.data as any)?.pdfBase64).toBeUndefined();
    expect((result.data as any)?.htmlExport).toBeUndefined();
  });

  it('does not export PDF or HTML', async () => {
    const result = await service.createArchiveManifest(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeManifestSummary: 'No export',
    });
    expect(result.success).toBe(true);
    expect(result.data?.manifestStatus).not.toMatch(/exported/);
    expect(result.data?.manifestStatus).not.toMatch(/pdf/);
    expect(result.data?.manifestStatus).not.toMatch(/html/);
  });

  it('can be marked archive-ready', async () => {
    const created = await service.createArchiveManifest(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeManifestSummary: 'Test archive ready',
    });
    expect(created.data?.manifestStatus).toBe('draft');

    const reviewReady = await service.markArchiveManifestReviewReady(ctx, created.data!.archiveManifestId);
    expect(reviewReady.data?.manifestStatus).toBe('review_ready');

    const archiveReady = await service.markArchiveManifestArchiveReady(ctx, created.data!.archiveManifestId);
    expect(archiveReady.data?.manifestStatus).toBe('archive_ready');
  });

  it('transitions to approved_for_future_use', async () => {
    const created = await service.createArchiveManifest(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeManifestSummary: 'Approve test',
    });
    const approved = await service.approveArchiveManifestForFutureUse(ctx, created.data!.archiveManifestId);
    expect(approved.data?.manifestStatus).toBe('approved_for_future_use');
  });

  it('can suppress, block, and void manifest', async () => {
    const created = await service.createArchiveManifest(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeManifestSummary: 'Test',
    });
    const id = created.data!.archiveManifestId;

    const suppressed = await service.suppressArchiveManifest(ctx, id);
    expect(suppressed.data?.manifestStatus).toBe('suppressed');
  });

  it('can list by school, student, plan, status', async () => {
    await service.createArchiveManifest(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeManifestSummary: 'Test list',
    });
    const schoolList = await service.listArchiveManifestsForSchool(schoolId);
    expect(schoolList.data?.length).toBeGreaterThanOrEqual(1);
    const studentList = await service.listArchiveManifestsForStudent(schoolId, 'student-1');
    expect(studentList.data?.length).toBeGreaterThanOrEqual(1);
    const planList = await service.listArchiveManifestsForPlan(schoolId, 'plan-1');
    expect(planList.data?.length).toBeGreaterThanOrEqual(1);
    const statusList = await service.listArchiveManifestsByStatus(schoolId, 'draft');
    expect(statusList.data?.length).toBeGreaterThanOrEqual(1);
  });

  it('get returns the correct manifest', async () => {
    const created = await service.createArchiveManifest(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeManifestSummary: 'Test get',
    });
    const found = await service.getArchiveManifest(schoolId, created.data!.archiveManifestId);
    expect(found.success).toBe(true);
    expect(found.data?.safeManifestSummary).toBe('Test get');
  });
});

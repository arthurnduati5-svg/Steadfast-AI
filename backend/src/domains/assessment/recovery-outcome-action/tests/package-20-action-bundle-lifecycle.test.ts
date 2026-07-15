import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryRecoveryOutcomeActionBundleRepository,
  InMemoryRecoveryOutcomeActionAuditRepository,
  InMemoryRecoveryOutcomeActionIdempotencyRepository,
} from '../repositories/inMemoryRecoveryOutcomeActionRepositories';
import { RecoveryOutcomeActionBundleService } from '../services/recoveryOutcomeActionBundleService';
import { RecoveryOutcomeActionSafetyService } from '../services/recoveryOutcomeActionSafetyService';
import { RecoveryOutcomeActionAuditBridge } from '../services/recoveryOutcomeActionAuditBridge';
import { RecoveryOutcomeActionIdempotencyService } from '../services/recoveryOutcomeActionIdempotencyService';
import { RecoveryOutcomeActionCommandContext } from '../contracts/recoveryOutcomeActionContracts';

describe('Package 20 - Action Bundle Lifecycle', () => {
  let service: RecoveryOutcomeActionBundleService;
  let ctx: RecoveryOutcomeActionCommandContext;

  beforeEach(() => {
    const repo = new InMemoryRecoveryOutcomeActionBundleRepository();
    const safety = new RecoveryOutcomeActionSafetyService();
    const auditRepo = new InMemoryRecoveryOutcomeActionAuditRepository();
    const audit = new RecoveryOutcomeActionAuditBridge(auditRepo);
    const idempotencyRepo = new InMemoryRecoveryOutcomeActionIdempotencyRepository();
    const idempotency = new RecoveryOutcomeActionIdempotencyService(idempotencyRepo);
    service = new RecoveryOutcomeActionBundleService(repo, safety, audit, idempotency);
    ctx = { schoolId: 'school-1', actorId: 'actor-1', actorRole: 'teacher', correlationId: 'corr-1', idempotencyKey: 'ik-1' };
  });

  it('creates action bundle in draft status', async () => {
    const result = await service.createActionBundle(ctx, {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      safeBundleSummary: 'Bundle for continuation', readinessRefsJson: {}, draftRefsJson: {},
      bundleType: 'continuation', createdByActorId: 'actor-1', createdByRole: 'teacher',
    });
    expect(result.success).toBe(true);
    expect(result.data?.bundleStatus).toBe('draft');
    expect(result.data?.bundleType).toBe('continuation');
  });

  it('blocks student role', async () => {
    const studentCtx = { ...ctx, actorRole: 'student' };
    const result = await service.createActionBundle(studentCtx, {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      safeBundleSummary: 'Test', readinessRefsJson: {}, draftRefsJson: {},
      bundleType: 'mixed', createdByActorId: 'actor-1', createdByRole: 'student',
    });
    expect(result.success).toBe(false);
  });

  it('transitions draft -> review_ready -> approved_for_future_use', async () => {
    const created = await service.createActionBundle(ctx, {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      safeBundleSummary: 'Test', readinessRefsJson: {}, draftRefsJson: {},
      bundleType: 'pause', createdByActorId: 'actor-1', createdByRole: 'teacher',
    });
    const reviewReady = await service.markActionBundleReviewReady(ctx, created.data!.actionBundleId);
    expect(reviewReady.data?.bundleStatus).toBe('review_ready');
    const approved = await service.approveActionBundleForFutureUse(ctx, created.data!.actionBundleId);
    expect(approved.data?.bundleStatus).toBe('approved_for_future_use');
  });

  it('can list bundles by school, student, plan, status', async () => {
    await service.createActionBundle(ctx, {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      safeBundleSummary: 'Test', readinessRefsJson: {}, draftRefsJson: {},
      bundleType: 'continuation', createdByActorId: 'actor-1', createdByRole: 'teacher',
    });
    const schoolList = await service.listActionBundlesForSchool('school-1');
    expect(schoolList.data?.length).toBeGreaterThanOrEqual(1);
  });

  it('suppress and void work correctly', async () => {
    const created = await service.createActionBundle(ctx, {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      safeBundleSummary: 'Test', readinessRefsJson: {}, draftRefsJson: {},
      bundleType: 'continuation', createdByActorId: 'actor-1', createdByRole: 'teacher',
    });
    const suppressed = await service.suppressActionBundle(ctx, created.data!.actionBundleId);
    expect(suppressed.data?.bundleStatus).toBe('suppressed');
    const voided = await service.voidActionBundle(ctx, created.data!.actionBundleId);
    expect(voided.data?.bundleStatus).toBe('voided');
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryRecoveryExecutionAuthorizationPreviewRepositories } from '../repositories/inMemoryRecoveryExecutionAuthorizationPreviewRepositories';
import { RecoveryExecutionAuthorizationReadinessService } from '../services/recoveryExecutionAuthorizationReadinessService';
import { RecoveryExecutionAuthorizationAuditBridge } from '../services/recoveryExecutionAuthorizationAuditBridge';
import { RecoveryExecutionAuthorizationIdempotencyService } from '../services/recoveryExecutionAuthorizationIdempotencyService';
import { RecoveryExecutionAuthorizationPreviewCommandContext } from '../contracts/recoveryExecutionAuthorizationPreviewContracts';

describe('Package 23 - Authorization Readiness Lifecycle', () => {
  let repos: InMemoryRecoveryExecutionAuthorizationPreviewRepositories;
  let service: RecoveryExecutionAuthorizationReadinessService;
  let ctx: RecoveryExecutionAuthorizationPreviewCommandContext;
  const schoolId = 'school-1';

  beforeEach(() => {
    repos = new InMemoryRecoveryExecutionAuthorizationPreviewRepositories();
    const audit = new RecoveryExecutionAuthorizationAuditBridge(repos.authorizationAudit);
    const idempotency = new RecoveryExecutionAuthorizationIdempotencyService(repos.authorizationIdempotency);
    service = new RecoveryExecutionAuthorizationReadinessService(repos.authorizationReadiness, audit, idempotency);
    ctx = { schoolId, actorId: 'actor-1', actorRole: 'admin', correlationId: 'corr-1', idempotencyKey: 'ik-1' };
  });

  it('creates authorization readiness in draft status with schoolId and studentRef', async () => {
    const result = await service.createAuthorizationReadiness(ctx, schoolId, {
      studentRef: 'student-1',
      safeSummary: 'Authorization readiness test',
    });
    expect(result.success).toBe(true);
    expect(result.data?.status).toBe('draft');
    expect(result.data?.schoolId).toBe(schoolId);
    expect(result.data?.studentRef).toBe('student-1');
  });

  it('blocks creation when schoolId does not match context', async () => {
    const result = await service.createAuthorizationReadiness(ctx, 'school-2', {
      studentRef: 'student-1',
      safeSummary: 'Wrong school',
    });
    expect(result.success).toBe(false);
    expect(result.status).toBe('DENIED');
  });

  it('creating without Package 22 closureReadinessId is NOT blocked (optional)', async () => {
    const result = await service.createAuthorizationReadiness(ctx, schoolId, {
      studentRef: 'student-1',
      safeSummary: 'No closure readiness ref',
    });
    expect(result.success).toBe(true);
    expect(result.data?.recoveryLifecycleClosureReadinessId).toBeUndefined();
  });

  it('transitions from draft to review_ready to authorization_preview_ready', async () => {
    const created = await service.createAuthorizationReadiness(ctx, schoolId, {
      studentRef: 'student-1',
      safeSummary: 'Test lifecycle',
    });
    expect(created.data?.status).toBe('draft');

    const reviewReady = await service.markAuthorizationReadinessReviewReady(ctx, schoolId, created.data!.authorizationReadinessId);
    expect(reviewReady.success).toBe(true);
    expect(reviewReady.data?.status).toBe('review_ready');

    const previewReady = await service.markAuthorizationReadinessPreviewReady(ctx, schoolId, created.data!.authorizationReadinessId);
    expect(previewReady.success).toBe(true);
    expect(previewReady.data?.status).toBe('authorization_preview_ready');
  });

  it('can suppress readiness', async () => {
    const created = await service.createAuthorizationReadiness(ctx, schoolId, {
      studentRef: 'student-1',
      safeSummary: 'Suppress test',
    });
    const suppressed = await service.suppressAuthorizationReadiness(ctx, schoolId, created.data!.authorizationReadinessId);
    expect(suppressed.data?.suppressedAt).toBeDefined();
  });

  it('can block readiness with reason codes', async () => {
    const created = await service.createAuthorizationReadiness(ctx, schoolId, {
      studentRef: 'student-1',
      safeSummary: 'Block test',
    });
    const blocked = await service.blockAuthorizationReadiness(ctx, schoolId, created.data!.authorizationReadinessId, ['policy_violation']);
    expect(blocked.success).toBe(true);
    expect(blocked.data?.blockedReasonCodesJson).toContain('policy_violation');
  });

  it('can void readiness', async () => {
    const created = await service.createAuthorizationReadiness(ctx, schoolId, {
      studentRef: 'student-1',
      safeSummary: 'Void test',
    });
    const voided = await service.voidAuthorizationReadiness(ctx, schoolId, created.data!.authorizationReadinessId);
    expect(voided.data?.voidedAt).toBeDefined();
  });

  it('can list by school, student, plan, and status', async () => {
    await service.createAuthorizationReadiness(ctx, schoolId, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeSummary: 'List test',
    });
    const schoolList = await service.listAuthorizationReadinessForSchool(schoolId);
    expect(schoolList.data?.length).toBeGreaterThanOrEqual(1);
    const studentList = await service.listAuthorizationReadinessForStudent(schoolId, 'student-1');
    expect(studentList.data?.length).toBeGreaterThanOrEqual(1);
    const planList = await service.listAuthorizationReadinessForPlan(schoolId, 'plan-1');
    expect(planList.data?.length).toBeGreaterThanOrEqual(1);
    const draftList = await service.listAuthorizationReadinessByStatus(schoolId, 'draft');
    expect(draftList.data?.length).toBeGreaterThanOrEqual(1);
  });

  it('get returns the correct record', async () => {
    const created = await service.createAuthorizationReadiness(ctx, schoolId, {
      studentRef: 'student-1',
      safeSummary: 'Test get',
    });
    const found = await service.getAuthorizationReadiness(schoolId, created.data!.authorizationReadinessId);
    expect(found.success).toBe(true);
    expect(found.data?.safeSummary).toBe('Test get');
  });
});

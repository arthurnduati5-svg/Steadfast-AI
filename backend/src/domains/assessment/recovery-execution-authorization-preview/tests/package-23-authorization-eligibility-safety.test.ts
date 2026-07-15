import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryRecoveryExecutionAuthorizationPreviewRepositories } from '../repositories/inMemoryRecoveryExecutionAuthorizationPreviewRepositories';
import { RecoveryExecutionAuthorizationEligibilityService } from '../services/recoveryExecutionAuthorizationEligibilityService';
import { RecoveryExecutionAuthorizationAuditBridge } from '../services/recoveryExecutionAuthorizationAuditBridge';
import { RecoveryExecutionAuthorizationIdempotencyService } from '../services/recoveryExecutionAuthorizationIdempotencyService';
import { RecoveryExecutionAuthorizationPreviewCommandContext } from '../contracts/recoveryExecutionAuthorizationPreviewContracts';

describe('Package 23 - Authorization Eligibility Safety', () => {
  let repos: InMemoryRecoveryExecutionAuthorizationPreviewRepositories;
  let service: RecoveryExecutionAuthorizationEligibilityService;
  let ctx: RecoveryExecutionAuthorizationPreviewCommandContext;
  const schoolId = 'school-1';

  beforeEach(() => {
    repos = new InMemoryRecoveryExecutionAuthorizationPreviewRepositories();
    const audit = new RecoveryExecutionAuthorizationAuditBridge(repos.authorizationAudit);
    const idempotency = new RecoveryExecutionAuthorizationIdempotencyService(repos.authorizationIdempotency);
    service = new RecoveryExecutionAuthorizationEligibilityService(repos.authorizationEligibilityCheck, audit, idempotency);
    ctx = { schoolId, actorId: 'actor-1', actorRole: 'admin', correlationId: 'corr-1', idempotencyKey: 'ik-1' };
  });

  it('creates eligibility check with decision field recording eligibility outcome', async () => {
    const result = await service.createAuthorizationEligibilityCheck(ctx, schoolId, {
      studentRef: 'student-1',
      decision: 'eligible',
      safeEligibilitySummary: 'Eligibility test',
    });
    expect(result.success).toBe(true);
    expect(result.data?.decision).toBe('eligible');
  });

  it('creates eligibility check with ineligible decision', async () => {
    const result = await service.createAuthorizationEligibilityCheck(ctx, schoolId, {
      studentRef: 'student-1',
      decision: 'ineligible',
      safeEligibilitySummary: 'Ineligible test',
    });
    expect(result.success).toBe(true);
    expect(result.data?.decision).toBe('ineligible');
  });

  it('can mark review_ready', async () => {
    const created = await service.createAuthorizationEligibilityCheck(ctx, schoolId, {
      studentRef: 'student-1',
      decision: 'eligible',
      safeEligibilitySummary: 'Review test',
    });
    const reviewReady = await service.markAuthorizationEligibilityReviewReady(ctx, schoolId, created.data!.authorizationEligibilityCheckId);
    expect(reviewReady.success).toBe(true);
    expect(reviewReady.data?.reviewReadyAt).toBeDefined();
  });

  it('can block eligibility check', async () => {
    const created = await service.createAuthorizationEligibilityCheck(ctx, schoolId, {
      studentRef: 'student-1',
      decision: 'eligible',
      safeEligibilitySummary: 'Block test',
    });
    const blocked = await service.blockAuthorizationEligibilityCheck(ctx, schoolId, created.data!.authorizationEligibilityCheckId, ['conflict']);
    expect(blocked.success).toBe(true);
    expect(blocked.data?.blockedReasonCodesJson).toContain('conflict');
  });

  it('can void eligibility check', async () => {
    const created = await service.createAuthorizationEligibilityCheck(ctx, schoolId, {
      studentRef: 'student-1',
      decision: 'eligible',
      safeEligibilitySummary: 'Void test',
    });
    const voided = await service.voidAuthorizationEligibilityCheck(ctx, schoolId, created.data!.authorizationEligibilityCheckId);
    expect(voided.data?.voidedAt).toBeDefined();
  });

  it('can list by decision', async () => {
    await service.createAuthorizationEligibilityCheck(ctx, schoolId, {
      studentRef: 'student-1',
      decision: 'eligible',
      safeEligibilitySummary: 'List test',
    });
    const decisionList = await service.listAuthorizationEligibilityChecksByDecision(schoolId, 'eligible');
    expect(decisionList.data?.length).toBeGreaterThanOrEqual(1);
  });

  it('get returns the correct eligibility check', async () => {
    const created = await service.createAuthorizationEligibilityCheck(ctx, schoolId, {
      studentRef: 'student-1',
      decision: 'eligible',
      safeEligibilitySummary: 'Test get',
    });
    const found = await service.getAuthorizationEligibilityCheck(schoolId, created.data!.authorizationEligibilityCheckId);
    expect(found.success).toBe(true);
    expect(found.data?.safeEligibilitySummary).toBe('Test get');
  });

  it('can list by plan', async () => {
    await service.createAuthorizationEligibilityCheck(ctx, schoolId, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      decision: 'eligible',
      safeEligibilitySummary: 'Plan list test',
    });
    const planList = await service.listAuthorizationEligibilityChecksForPlan(schoolId, 'plan-1');
    expect(planList.data?.length).toBeGreaterThanOrEqual(1);
  });
});

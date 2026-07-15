import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryRecoveryExecutionAuthorizationPreviewRepositories } from '../repositories/inMemoryRecoveryExecutionAuthorizationPreviewRepositories';
import { RecoveryExecutionAuthorizationDryRunService } from '../services/recoveryExecutionAuthorizationDryRunService';
import { RecoveryExecutionAuthorizationAuditBridge } from '../services/recoveryExecutionAuthorizationAuditBridge';
import { RecoveryExecutionAuthorizationIdempotencyService } from '../services/recoveryExecutionAuthorizationIdempotencyService';
import { RecoveryExecutionAuthorizationPreviewCommandContext } from '../contracts/recoveryExecutionAuthorizationPreviewContracts';

describe('Package 23 - Authorization Dry Run Safety', () => {
  let repos: InMemoryRecoveryExecutionAuthorizationPreviewRepositories;
  let service: RecoveryExecutionAuthorizationDryRunService;
  let ctx: RecoveryExecutionAuthorizationPreviewCommandContext;
  const schoolId = 'school-1';

  beforeEach(() => {
    repos = new InMemoryRecoveryExecutionAuthorizationPreviewRepositories();
    const audit = new RecoveryExecutionAuthorizationAuditBridge(repos.authorizationAudit);
    const idempotency = new RecoveryExecutionAuthorizationIdempotencyService(repos.authorizationIdempotency);
    service = new RecoveryExecutionAuthorizationDryRunService(repos.authorizationDryRun, audit, idempotency);
    ctx = { schoolId, actorId: 'actor-1', actorRole: 'admin', correlationId: 'corr-1', idempotencyKey: 'ik-1' };
  });

  it('authorization dry-runs create mock decisions only', async () => {
    const result = await service.createAuthorizationDryRun(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      safeDryRunSummary: 'Mock only test',
      mockApprovalsJson: { mock: true },
      mockDenialsJson: { mock: false },
    });
    expect(result.success).toBe(true);
    expect(result.data?.dryRunDecision).toBe('pending');
    expect(result.data?.dryRunDecision).not.toMatch(/live/);
  });

  it('can mark mock_authorized', async () => {
    const created = await service.createAuthorizationDryRun(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      safeDryRunSummary: 'Mock authorized test',
    });
    const authorized = await service.markAuthorizationDryRunMockAuthorized(ctx, schoolId, created.data!.authorizationDryRunId);
    expect(authorized.success).toBe(true);
    expect(authorized.data?.dryRunDecision).toBe('mock_authorized');
    expect(authorized.data?.mockAuthorizedAt).toBeDefined();
  });

  it('can mark mock_denied', async () => {
    const created = await service.createAuthorizationDryRun(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      safeDryRunSummary: 'Mock denied test',
    });
    const denied = await service.markAuthorizationDryRunMockDenied(ctx, schoolId, created.data!.authorizationDryRunId);
    expect(denied.success).toBe(true);
    expect(denied.data?.dryRunDecision).toBe('mock_denied');
    expect(denied.data?.mockDeniedAt).toBeDefined();
  });

  it('can list by decision', async () => {
    await service.createAuthorizationDryRun(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      safeDryRunSummary: 'List by decision test',
    });
    const pendingList = await service.listAuthorizationDryRunsByDecision(schoolId, 'pending');
    expect(pendingList.data?.length).toBeGreaterThanOrEqual(1);
  });

  it('can void', async () => {
    const created = await service.createAuthorizationDryRun(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      safeDryRunSummary: 'Void test',
    });
    const voided = await service.voidAuthorizationDryRun(ctx, schoolId, created.data!.authorizationDryRunId);
    expect(voided.data?.voidedAt).toBeDefined();
  });

  it('can list by plan', async () => {
    await service.createAuthorizationDryRun(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      safeDryRunSummary: 'Plan list test',
    });
    const planList = await service.listAuthorizationDryRunsForPlan(schoolId, 'plan-1');
    expect(planList.data?.length).toBeGreaterThanOrEqual(1);
  });

  it('get returns the correct dry run', async () => {
    const created = await service.createAuthorizationDryRun(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      safeDryRunSummary: 'Test get',
    });
    const found = await service.getAuthorizationDryRun(schoolId, created.data!.authorizationDryRunId);
    expect(found.success).toBe(true);
    expect(found.data?.safeDryRunSummary).toBe('Test get');
  });
});

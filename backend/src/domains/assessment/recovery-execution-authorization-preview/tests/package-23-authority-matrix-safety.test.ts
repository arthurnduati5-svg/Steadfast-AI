import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryRecoveryExecutionAuthorizationPreviewRepositories } from '../repositories/inMemoryRecoveryExecutionAuthorizationPreviewRepositories';
import { RecoveryExecutionAuthorityMatrixService } from '../services/recoveryExecutionAuthorityMatrixService';
import { RecoveryExecutionAuthorizationAuditBridge } from '../services/recoveryExecutionAuthorizationAuditBridge';
import { RecoveryExecutionAuthorizationIdempotencyService } from '../services/recoveryExecutionAuthorizationIdempotencyService';
import { RecoveryExecutionAuthorizationPreviewCommandContext } from '../contracts/recoveryExecutionAuthorizationPreviewContracts';

describe('Package 23 - Authority Matrix Safety', () => {
  let repos: InMemoryRecoveryExecutionAuthorizationPreviewRepositories;
  let service: RecoveryExecutionAuthorityMatrixService;
  let ctx: RecoveryExecutionAuthorizationPreviewCommandContext;
  const schoolId = 'school-1';

  beforeEach(() => {
    repos = new InMemoryRecoveryExecutionAuthorizationPreviewRepositories();
    const audit = new RecoveryExecutionAuthorizationAuditBridge(repos.authorizationAudit);
    const idempotency = new RecoveryExecutionAuthorizationIdempotencyService(repos.authorizationIdempotency);
    service = new RecoveryExecutionAuthorityMatrixService(repos.authorityMatrixSnapshot, audit, idempotency);
    ctx = { schoolId, actorId: 'actor-1', actorRole: 'admin', correlationId: 'corr-1', idempotencyKey: 'ik-1' };
  });

  it('authority matrix snapshot is a snapshot only and does NOT grant live permissions', async () => {
    const result = await service.createAuthorityMatrixSnapshot(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      safeMatrixSummary: 'Snapshot test',
      authorityMatrixJson: { roles: { admin: ['read', 'write'] } },
    });
    expect(result.success).toBe(true);
    expect(result.data?.snapshotStatus).not.toMatch(/live/);
    expect(result.data?.snapshotStatus).not.toMatch(/active/);
  });

  it('can mark review_ready to approval_chain_ready', async () => {
    const created = await service.createAuthorityMatrixSnapshot(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      safeMatrixSummary: 'Lifecycle test',
    });
    expect(created.data?.snapshotStatus).toBe('draft');

    const reviewReady = await service.markAuthorityMatrixReviewReady(ctx, schoolId, created.data!.authorityMatrixSnapshotId);
    expect(reviewReady.data?.snapshotStatus).toBe('review_ready');

    const chainReady = await service.markAuthorityMatrixApprovalChainReady(ctx, schoolId, created.data!.authorityMatrixSnapshotId);
    expect(chainReady.success).toBe(true);
    expect(chainReady.data?.snapshotStatus).toBe('approval_chain_ready');
  });

  it('can suppress, block, void', async () => {
    const created = await service.createAuthorityMatrixSnapshot(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      safeMatrixSummary: 'Suppress test',
    });
    const suppressed = await service.suppressAuthorityMatrix(ctx, schoolId, created.data!.authorityMatrixSnapshotId);
    expect(suppressed.data?.suppressedAt).toBeDefined();
  });

  it('can block matrix', async () => {
    const created = await service.createAuthorityMatrixSnapshot(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      safeMatrixSummary: 'Block test',
    });
    const blocked = await service.blockAuthorityMatrix(ctx, schoolId, created.data!.authorityMatrixSnapshotId, ['invalid']);
    expect(blocked.success).toBe(true);
    expect(blocked.data?.blockedReasonCodesJson).toContain('invalid');
  });

  it('can void matrix', async () => {
    const created = await service.createAuthorityMatrixSnapshot(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      safeMatrixSummary: 'Void test',
    });
    const voided = await service.voidAuthorityMatrix(ctx, schoolId, created.data!.authorityMatrixSnapshotId);
    expect(voided.data?.voidedAt).toBeDefined();
  });

  it('can list by school, plan, and status', async () => {
    await service.createAuthorityMatrixSnapshot(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      safeMatrixSummary: 'List test',
    });
    const schoolList = await service.listAuthorityMatrixSnapshotsForSchool(schoolId);
    expect(schoolList.data?.length).toBeGreaterThanOrEqual(1);
    const planList = await service.listAuthorityMatrixSnapshotsForPlan(schoolId, 'plan-1');
    expect(planList.data?.length).toBeGreaterThanOrEqual(1);
    const statusList = await service.listAuthorityMatrixSnapshotsByStatus(schoolId, 'draft');
    expect(statusList.data?.length).toBeGreaterThanOrEqual(1);
  });

  it('get returns the correct snapshot', async () => {
    const created = await service.createAuthorityMatrixSnapshot(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      safeMatrixSummary: 'Test get',
    });
    const found = await service.getAuthorityMatrixSnapshot(schoolId, created.data!.authorityMatrixSnapshotId);
    expect(found.success).toBe(true);
    expect(found.data?.safeMatrixSummary).toBe('Test get');
  });
});

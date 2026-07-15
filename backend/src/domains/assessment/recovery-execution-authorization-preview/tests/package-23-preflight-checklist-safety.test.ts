import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryRecoveryExecutionAuthorizationPreviewRepositories } from '../repositories/inMemoryRecoveryExecutionAuthorizationPreviewRepositories';
import { RecoveryExecutionPreflightChecklistService } from '../services/recoveryExecutionPreflightChecklistService';
import { RecoveryExecutionAuthorizationAuditBridge } from '../services/recoveryExecutionAuthorizationAuditBridge';
import { RecoveryExecutionAuthorizationIdempotencyService } from '../services/recoveryExecutionAuthorizationIdempotencyService';
import { RecoveryExecutionAuthorizationPreviewCommandContext } from '../contracts/recoveryExecutionAuthorizationPreviewContracts';

describe('Package 23 - Preflight Checklist Safety', () => {
  let repos: InMemoryRecoveryExecutionAuthorizationPreviewRepositories;
  let service: RecoveryExecutionPreflightChecklistService;
  let ctx: RecoveryExecutionAuthorizationPreviewCommandContext;
  const schoolId = 'school-1';

  beforeEach(() => {
    repos = new InMemoryRecoveryExecutionAuthorizationPreviewRepositories();
    const audit = new RecoveryExecutionAuthorizationAuditBridge(repos.authorizationAudit);
    const idempotency = new RecoveryExecutionAuthorizationIdempotencyService(repos.authorizationIdempotency);
    service = new RecoveryExecutionPreflightChecklistService(repos.preflightChecklist, audit, idempotency);
    ctx = { schoolId, actorId: 'actor-1', actorRole: 'admin', correlationId: 'corr-1', idempotencyKey: 'ik-1' };
  });

  it('preflight checklists are preview-only', async () => {
    const result = await service.createPreflightChecklist(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      safeChecklistSummary: 'Preview-only test',
    });
    expect(result.success).toBe(true);
    expect(result.data?.checklistStatus).not.toMatch(/live/);
    expect(result.data?.checklistStatus).not.toMatch(/executed/);
  });

  it('creates with checklist items', async () => {
    const result = await service.createPreflightChecklist(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      safeChecklistSummary: 'Items test',
      checklistItemsJson: { items: ['check_auth', 'check_consent'] },
      passedItemsJson: { passed: ['check_auth'] },
      failedItemsJson: { failed: [] },
    });
    expect(result.success).toBe(true);
    expect(result.data?.checklistItemsJson).toBeDefined();
    expect(result.data?.passedItemsJson).toBeDefined();
    expect(result.data?.failedItemsJson).toBeDefined();
  });

  it('can mark review_ready to authorization_preview_ready', async () => {
    const created = await service.createPreflightChecklist(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      safeChecklistSummary: 'Lifecycle test',
    });
    expect(created.data?.checklistStatus).toBe('draft');

    const reviewReady = await service.markPreflightChecklistReviewReady(ctx, schoolId, created.data!.preflightChecklistId);
    expect(reviewReady.data?.checklistStatus).toBe('review_ready');

    const previewReady = await service.markPreflightChecklistPreviewReady(ctx, schoolId, created.data!.preflightChecklistId);
    expect(previewReady.success).toBe(true);
    expect(previewReady.data?.checklistStatus).toBe('authorization_preview_ready');
  });

  it('can refresh', async () => {
    const created = await service.createPreflightChecklist(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      safeChecklistSummary: 'Refresh test',
    });
    const refreshed = await service.refreshPreflightChecklist(ctx, schoolId, created.data!.preflightChecklistId);
    expect(refreshed.success).toBe(true);
  });

  it('can block checklist', async () => {
    const created = await service.createPreflightChecklist(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      safeChecklistSummary: 'Block test',
    });
    const blocked = await service.blockPreflightChecklist(ctx, schoolId, created.data!.preflightChecklistId, ['failed_items']);
    expect(blocked.success).toBe(true);
    expect(blocked.data?.blockedReasonCodesJson).toContain('failed_items');
  });

  it('can void checklist', async () => {
    const created = await service.createPreflightChecklist(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      safeChecklistSummary: 'Void test',
    });
    const voided = await service.voidPreflightChecklist(ctx, schoolId, created.data!.preflightChecklistId);
    expect(voided.data?.voidedAt).toBeDefined();
  });

  it('can list by plan and status', async () => {
    await service.createPreflightChecklist(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      safeChecklistSummary: 'List test',
    });
    const planList = await service.listPreflightChecklistsForPlan(schoolId, 'plan-1');
    expect(planList.data?.length).toBeGreaterThanOrEqual(1);
    const statusList = await service.listPreflightChecklistsByStatus(schoolId, 'draft');
    expect(statusList.data?.length).toBeGreaterThanOrEqual(1);
  });

  it('get returns the correct checklist', async () => {
    const created = await service.createPreflightChecklist(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      safeChecklistSummary: 'Test get',
    });
    const found = await service.getPreflightChecklist(schoolId, created.data!.preflightChecklistId);
    expect(found.success).toBe(true);
    expect(found.data?.safeChecklistSummary).toBe('Test get');
  });
});

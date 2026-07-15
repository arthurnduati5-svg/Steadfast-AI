import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryRecoveryExecutionAuthorizationPreviewRepositories } from '../repositories/inMemoryRecoveryExecutionAuthorizationPreviewRepositories';
import { RecoveryExecutionApprovalChainService } from '../services/recoveryExecutionApprovalChainService';
import { RecoveryExecutionAuthorizationAuditBridge } from '../services/recoveryExecutionAuthorizationAuditBridge';
import { RecoveryExecutionAuthorizationIdempotencyService } from '../services/recoveryExecutionAuthorizationIdempotencyService';
import { RecoveryExecutionAuthorizationPreviewCommandContext } from '../contracts/recoveryExecutionAuthorizationPreviewContracts';

describe('Package 23 - Approval Chain Safety', () => {
  let repos: InMemoryRecoveryExecutionAuthorizationPreviewRepositories;
  let service: RecoveryExecutionApprovalChainService;
  let ctx: RecoveryExecutionAuthorizationPreviewCommandContext;
  const schoolId = 'school-1';

  beforeEach(() => {
    repos = new InMemoryRecoveryExecutionAuthorizationPreviewRepositories();
    const audit = new RecoveryExecutionAuthorizationAuditBridge(repos.authorizationAudit);
    const idempotency = new RecoveryExecutionAuthorizationIdempotencyService(repos.authorizationIdempotency);
    service = new RecoveryExecutionApprovalChainService(repos.approvalChainDraft, audit, idempotency);
    ctx = { schoolId, actorId: 'actor-1', actorRole: 'admin', correlationId: 'corr-1', idempotencyKey: 'ik-1' };
  });

  it('approval chain draft does NOT approve live execution', async () => {
    const result = await service.createApprovalChainDraft(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      safeChainSummary: 'No live approval',
    });
    expect(result.success).toBe(true);
    expect(result.data?.chainStatus).not.toMatch(/approved_live/);
    expect(result.data?.chainStatus).not.toMatch(/executed_live/);
  });

  it('can mark review_ready to approval_chain_ready', async () => {
    const created = await service.createApprovalChainDraft(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      safeChainSummary: 'Lifecycle test',
    });
    expect(created.data?.chainStatus).toBe('draft');

    const reviewReady = await service.markApprovalChainReviewReady(ctx, schoolId, created.data!.approvalChainDraftId);
    expect(reviewReady.success).toBe(true);
    expect(reviewReady.data?.chainStatus).toBe('review_ready');

    const chainReady = await service.markApprovalChainReady(ctx, schoolId, created.data!.approvalChainDraftId);
    expect(chainReady.success).toBe(true);
    expect(chainReady.data?.chainStatus).toBe('approval_chain_ready');
  });

  it('can filter by approverRef', async () => {
    await service.createApprovalChainDraft(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      safeChainSummary: 'Approver filter test',
      approverRefsJson: { approverRef: 'approver-1' },
    });
    const approverList = await service.listApprovalChainDraftsByApprover(schoolId, 'approver-1');
    expect(approverList.success).toBe(true);
  });

  it('can suppress, block, void', async () => {
    const created = await service.createApprovalChainDraft(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      safeChainSummary: 'Suppress test',
    });
    const suppressed = await service.suppressApprovalChain(ctx, schoolId, created.data!.approvalChainDraftId);
    expect(suppressed.data?.suppressedAt).toBeDefined();
  });

  it('can block', async () => {
    const created = await service.createApprovalChainDraft(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      safeChainSummary: 'Block test',
    });
    const blocked = await service.blockApprovalChain(ctx, schoolId, created.data!.approvalChainDraftId, ['invalid_chain']);
    expect(blocked.success).toBe(true);
    expect(blocked.data?.blockedReasonCodesJson).toContain('invalid_chain');
  });

  it('can void', async () => {
    const created = await service.createApprovalChainDraft(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      safeChainSummary: 'Void test',
    });
    const voided = await service.voidApprovalChain(ctx, schoolId, created.data!.approvalChainDraftId);
    expect(voided.data?.voidedAt).toBeDefined();
  });

  it('can list by plan and status', async () => {
    await service.createApprovalChainDraft(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      safeChainSummary: 'List test',
    });
    const planList = await service.listApprovalChainDraftsForPlan(schoolId, 'plan-1');
    expect(planList.data?.length).toBeGreaterThanOrEqual(1);
    const statusList = await service.listApprovalChainDraftsByStatus(schoolId, 'draft');
    expect(statusList.data?.length).toBeGreaterThanOrEqual(1);
  });

  it('get returns the correct chain draft', async () => {
    const created = await service.createApprovalChainDraft(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      safeChainSummary: 'Test get',
    });
    const found = await service.getApprovalChainDraft(schoolId, created.data!.approvalChainDraftId);
    expect(found.success).toBe(true);
    expect(found.data?.safeChainSummary).toBe('Test get');
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryRecoveryExecutionAuthorizationPreviewRepositories } from '../repositories/inMemoryRecoveryExecutionAuthorizationPreviewRepositories';
import { RecoveryExecutionMockAuthorizationReceiptService } from '../services/recoveryExecutionMockAuthorizationReceiptService';
import { RecoveryExecutionAuthorizationAuditBridge } from '../services/recoveryExecutionAuthorizationAuditBridge';
import { RecoveryExecutionAuthorizationIdempotencyService } from '../services/recoveryExecutionAuthorizationIdempotencyService';
import { RecoveryExecutionAuthorizationPreviewCommandContext } from '../contracts/recoveryExecutionAuthorizationPreviewContracts';

describe('Package 23 - Mock Authorization Receipt Safety', () => {
  let repos: InMemoryRecoveryExecutionAuthorizationPreviewRepositories;
  let service: RecoveryExecutionMockAuthorizationReceiptService;
  let ctx: RecoveryExecutionAuthorizationPreviewCommandContext;
  const schoolId = 'school-1';

  beforeEach(() => {
    repos = new InMemoryRecoveryExecutionAuthorizationPreviewRepositories();
    const audit = new RecoveryExecutionAuthorizationAuditBridge(repos.authorizationAudit);
    const idempotency = new RecoveryExecutionAuthorizationIdempotencyService(repos.authorizationIdempotency);
    service = new RecoveryExecutionMockAuthorizationReceiptService(repos.mockAuthorizationReceipt, audit, idempotency);
    ctx = { schoolId, actorId: 'actor-1', actorRole: 'admin', correlationId: 'corr-1', idempotencyKey: 'ik-1' };
  });

  it('mock authorization receipts are mock-only and not sendable (no email/sms/push payloads)', async () => {
    const result = await service.createMockAuthorizationReceipt(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      receiptDecision: 'mock_authorized',
      safeReceiptSummary: 'Mock-only test',
    });
    expect(result.success).toBe(true);
    expect((result.data as any)?.emailPayload).toBeUndefined();
    expect((result.data as any)?.smsPayload).toBeUndefined();
    expect((result.data as any)?.pushPayload).toBeUndefined();
  });

  it('can create with receipt decision mock_authorized', async () => {
    const result = await service.createMockAuthorizationReceipt(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      receiptDecision: 'mock_authorized',
      safeReceiptSummary: 'Authorized mock',
    });
    expect(result.data?.receiptDecision).toBe('mock_authorized');
  });

  it('can create with receipt decision mock_denied', async () => {
    const result = await service.createMockAuthorizationReceipt(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      receiptDecision: 'mock_denied',
      safeReceiptSummary: 'Denied mock',
    });
    expect(result.data?.receiptDecision).toBe('mock_denied');
  });

  it('receipt decision stays mock_* and never live_*', async () => {
    const result = await service.createMockAuthorizationReceipt(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      receiptDecision: 'mock_authorized',
      safeReceiptSummary: 'Never live test',
    });
    expect(result.data?.receiptDecision).toMatch(/^mock_/);
    expect(result.data?.receiptDecision).not.toMatch(/^live_/);
  });

  it('can void', async () => {
    const created = await service.createMockAuthorizationReceipt(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      receiptDecision: 'mock_authorized',
      safeReceiptSummary: 'Void test',
    });
    const voided = await service.voidMockAuthorizationReceipt(ctx, schoolId, created.data!.mockAuthorizationReceiptId);
    expect(voided.data?.voidedAt).toBeDefined();
  });

  it('can list by decision', async () => {
    await service.createMockAuthorizationReceipt(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      receiptDecision: 'mock_authorized',
      safeReceiptSummary: 'List decision test',
    });
    const decisionList = await service.listMockAuthorizationReceiptsByDecision(schoolId, 'mock_authorized');
    expect(decisionList.data?.length).toBeGreaterThanOrEqual(1);
  });

  it('can list by plan', async () => {
    await service.createMockAuthorizationReceipt(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      receiptDecision: 'mock_authorized',
      safeReceiptSummary: 'Plan list test',
    });
    const planList = await service.listMockAuthorizationReceiptsForPlan(schoolId, 'plan-1');
    expect(planList.data?.length).toBeGreaterThanOrEqual(1);
  });

  it('get returns the correct receipt', async () => {
    const created = await service.createMockAuthorizationReceipt(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      receiptDecision: 'mock_authorized',
      safeReceiptSummary: 'Test get',
    });
    const found = await service.getMockAuthorizationReceipt(schoolId, created.data!.mockAuthorizationReceiptId);
    expect(found.success).toBe(true);
    expect(found.data?.safeReceiptSummary).toBe('Test get');
  });
});

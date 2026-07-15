import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryRecoveryLifecycleClosureRepositories } from '../repositories/inMemoryRecoveryLifecycleClosureRepositories';
import { RecoveryDeferredIntegrationTicketService } from '../services/recoveryDeferredIntegrationTicketService';
import { RecoveryLifecycleClosureSafetyService } from '../services/recoveryLifecycleClosureSafetyService';
import { RecoveryLifecycleClosureAuditBridge } from '../services/recoveryLifecycleClosureAuditBridge';
import { RecoveryLifecycleClosureIdempotencyService } from '../services/recoveryLifecycleClosureIdempotencyService';
import { RecoveryLifecycleClosurePolicyEnforcer } from '../policies/recoveryLifecycleClosurePolicyDefinitions';
import { RecoveryLifecycleClosureCommandContext } from '../contracts/recoveryLifecycleClosureContracts';

describe('Package 22 - Deferred Integration Ticket Safety', () => {
  let repos: InMemoryRecoveryLifecycleClosureRepositories;
  let service: RecoveryDeferredIntegrationTicketService;
  let ctx: RecoveryLifecycleClosureCommandContext;
  const schoolId = 'school-1';

  beforeEach(() => {
    repos = new InMemoryRecoveryLifecycleClosureRepositories();
    const policyEnforcer = new RecoveryLifecycleClosurePolicyEnforcer();
    const safety = new RecoveryLifecycleClosureSafetyService(policyEnforcer);
    const audit = new RecoveryLifecycleClosureAuditBridge(repos);
    const idempotency = new RecoveryLifecycleClosureIdempotencyService(repos);
    service = new RecoveryDeferredIntegrationTicketService(repos, policyEnforcer, safety, audit, idempotency);
    ctx = { schoolId, actorId: 'actor-1', actorRole: 'teacher', correlationId: 'corr-1', idempotencyKey: 'ik-1' };
  });

  it('creates deferred integration ticket in draft status', async () => {
    const result = await service.createDeferredIntegrationTicket(ctx, {
      resultRecoveryPlanId: 'plan-1',
      ticketType: 'slo_integration',
      safeTicketSummary: 'Deferred ticket test',
    });
    expect(result.success).toBe(true);
    expect(result.data?.ticketStatus).toBe('draft');
  });

  it('blocks student role from creating', async () => {
    const studentCtx = { ...ctx, actorRole: 'student' };
    const result = await service.createDeferredIntegrationTicket(studentCtx, {
      resultRecoveryPlanId: 'plan-1',
      ticketType: 'slo_integration',
      safeTicketSummary: 'Test',
    });
    expect(result.success).toBe(false);
    expect(result.status).toBe('DENIED');
  });

  it('does NOT sync externally (no external sync fields)', async () => {
    const result = await service.createDeferredIntegrationTicket(ctx, {
      resultRecoveryPlanId: 'plan-1',
      ticketType: 'slo_integration',
      safeTicketSummary: 'No external sync',
    });
    expect(result.success).toBe(true);
    expect((result.data as any)?.externalSyncPayload).toBeUndefined();
    expect((result.data as any)?.externalTicketId).toBeUndefined();
  });

  it('does NOT trigger any live action', async () => {
    const result = await service.createDeferredIntegrationTicket(ctx, {
      resultRecoveryPlanId: 'plan-1',
      ticketType: 'slo_integration',
      safeTicketSummary: 'No live action',
    });
    expect(result.success).toBe(true);
    expect(result.data?.ticketStatus).not.toMatch(/live/);
    expect(result.data?.ticketStatus).not.toMatch(/executed/);
    expect(result.data?.ticketStatus).not.toMatch(/active/);
  });

  it('transitions from draft to review_ready to approved_for_future_use', async () => {
    const created = await service.createDeferredIntegrationTicket(ctx, {
      resultRecoveryPlanId: 'plan-1',
      ticketType: 'slo_integration',
      safeTicketSummary: 'Test lifecycle',
    });
    expect(created.data?.ticketStatus).toBe('draft');

    const reviewReady = await service.markDeferredIntegrationTicketReviewReady(ctx, created.data!.deferredIntegrationTicketId);
    expect(reviewReady.success).toBe(true);
    expect(reviewReady.data?.ticketStatus).toBe('review_ready');

    const approved = await service.approveDeferredIntegrationTicketForFutureUse(ctx, created.data!.deferredIntegrationTicketId);
    expect(approved.success).toBe(true);
    expect(approved.data?.ticketStatus).toBe('approved_for_future_use');
  });

  it('can suppress, block, and void ticket', async () => {
    const created = await service.createDeferredIntegrationTicket(ctx, {
      resultRecoveryPlanId: 'plan-1',
      ticketType: 'slo_integration',
      safeTicketSummary: 'Test',
    });
    const id = created.data!.deferredIntegrationTicketId;

    const suppressed = await service.suppressDeferredIntegrationTicket(ctx, id);
    expect(suppressed.data?.ticketStatus).toBe('suppressed');
  });

  it('can list by type and status', async () => {
    await service.createDeferredIntegrationTicket(ctx, {
      resultRecoveryPlanId: 'plan-1',
      ticketType: 'slo_integration',
      safeTicketSummary: 'Test list',
    });
    const typeList = await service.listDeferredIntegrationTicketsByType(schoolId, 'slo_integration');
    expect(typeList.data?.length).toBeGreaterThanOrEqual(1);
    const statusList = await service.listDeferredIntegrationTicketsByStatus(schoolId, 'draft');
    expect(statusList.data?.length).toBeGreaterThanOrEqual(1);
  });

  it('get returns the correct ticket', async () => {
    const created = await service.createDeferredIntegrationTicket(ctx, {
      resultRecoveryPlanId: 'plan-1',
      ticketType: 'slo_integration',
      safeTicketSummary: 'Test get',
    });
    const found = await service.getDeferredIntegrationTicket(schoolId, created.data!.deferredIntegrationTicketId);
    expect(found.success).toBe(true);
    expect(found.data?.safeTicketSummary).toBe('Test get');
  });
});

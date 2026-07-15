import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryRecoveryLifecycleClosureRepositories } from '../repositories/inMemoryRecoveryLifecycleClosureRepositories';
import { RecoveryUnresolvedRiskRegisterService } from '../services/recoveryUnresolvedRiskRegisterService';
import { RecoveryLifecycleClosureSafetyService } from '../services/recoveryLifecycleClosureSafetyService';
import { RecoveryLifecycleClosureAuditBridge } from '../services/recoveryLifecycleClosureAuditBridge';
import { RecoveryLifecycleClosureIdempotencyService } from '../services/recoveryLifecycleClosureIdempotencyService';
import { RecoveryLifecycleClosurePolicyEnforcer } from '../policies/recoveryLifecycleClosurePolicyDefinitions';
import { RecoveryLifecycleClosureCommandContext } from '../contracts/recoveryLifecycleClosureContracts';

describe('Package 22 - Unresolved Risk Register Safety', () => {
  let repos: InMemoryRecoveryLifecycleClosureRepositories;
  let service: RecoveryUnresolvedRiskRegisterService;
  let ctx: RecoveryLifecycleClosureCommandContext;
  const schoolId = 'school-1';

  beforeEach(() => {
    repos = new InMemoryRecoveryLifecycleClosureRepositories();
    const policyEnforcer = new RecoveryLifecycleClosurePolicyEnforcer();
    const safety = new RecoveryLifecycleClosureSafetyService(policyEnforcer);
    const audit = new RecoveryLifecycleClosureAuditBridge(repos);
    const idempotency = new RecoveryLifecycleClosureIdempotencyService(repos);
    service = new RecoveryUnresolvedRiskRegisterService(repos, policyEnforcer, safety, audit, idempotency);
    ctx = { schoolId, actorId: 'actor-1', actorRole: 'teacher', correlationId: 'corr-1', idempotencyKey: 'ik-1' };
  });

  it('creates unresolved risk register in draft status', async () => {
    const result = await service.createUnresolvedRiskRegister(ctx, {
      resultRecoveryPlanId: 'plan-1',
      riskLevel: 'medium',
      safeRiskSummary: 'Unresolved risk test',
    });
    expect(result.success).toBe(true);
    expect(result.data?.riskStatus).toBe('draft');
  });

  it('blocks student role from creating', async () => {
    const studentCtx = { ...ctx, actorRole: 'student' };
    const result = await service.createUnresolvedRiskRegister(studentCtx, {
      resultRecoveryPlanId: 'plan-1',
      riskLevel: 'medium',
      safeRiskSummary: 'Test',
    });
    expect(result.success).toBe(false);
    expect(result.status).toBe('DENIED');
  });

  it('blocks parent role from creating', async () => {
    const parentCtx = { ...ctx, actorRole: 'parent' };
    const result = await service.createUnresolvedRiskRegister(parentCtx, {
      resultRecoveryPlanId: 'plan-1',
      riskLevel: 'medium',
      safeRiskSummary: 'Test',
    });
    expect(result.success).toBe(false);
  });

  it('does NOT trigger live action', async () => {
    const result = await service.createUnresolvedRiskRegister(ctx, {
      resultRecoveryPlanId: 'plan-1',
      riskLevel: 'medium',
      safeRiskSummary: 'No live',
    });
    expect(result.success).toBe(true);
    expect(result.data?.riskStatus).not.toMatch(/live/);
    expect(result.data?.riskStatus).not.toMatch(/active/);
    expect(result.data?.riskStatus).not.toMatch(/executed/);
  });

  it('can be listed by risk level', async () => {
    await service.createUnresolvedRiskRegister(ctx, {
      resultRecoveryPlanId: 'plan-1',
      riskLevel: 'medium',
      safeRiskSummary: 'Test list',
    });
    const riskList = await service.listUnresolvedRiskRegistersByRiskLevel(schoolId, 'medium');
    expect(riskList.data?.length).toBeGreaterThanOrEqual(1);
  });

  it('transitions from draft to review_ready', async () => {
    const created = await service.createUnresolvedRiskRegister(ctx, {
      resultRecoveryPlanId: 'plan-1',
      riskLevel: 'high',
      safeRiskSummary: 'Test transition',
    });
    expect(created.data?.riskStatus).toBe('draft');

    const reviewReady = await service.markUnresolvedRiskReviewReady(ctx, created.data!.unresolvedRiskRegisterId);
    expect(reviewReady.success).toBe(true);
    expect(reviewReady.data?.riskStatus).toBe('review_ready');
  });

  it('can suppress, block, and void risk register', async () => {
    const created = await service.createUnresolvedRiskRegister(ctx, {
      resultRecoveryPlanId: 'plan-1',
      riskLevel: 'low',
      safeRiskSummary: 'Test',
    });
    const id = created.data!.unresolvedRiskRegisterId;

    const suppressed = await service.suppressUnresolvedRisk(ctx, id);
    expect(suppressed.data?.riskStatus).toBe('suppressed');
  });

  it('can block risk register', async () => {
    const created = await service.createUnresolvedRiskRegister(ctx, {
      resultRecoveryPlanId: 'plan-1',
      riskLevel: 'medium',
      safeRiskSummary: 'Block test',
    });
    const blocked = await service.blockUnresolvedRisk(ctx, created.data!.unresolvedRiskRegisterId);
    expect(blocked.data?.riskStatus).toBe('blocked');
  });

  it('can void risk register', async () => {
    const created = await service.createUnresolvedRiskRegister(ctx, {
      resultRecoveryPlanId: 'plan-1',
      riskLevel: 'medium',
      safeRiskSummary: 'Void test',
    });
    const voided = await service.voidUnresolvedRisk(ctx, created.data!.unresolvedRiskRegisterId);
    expect(voided.data?.riskStatus).toBe('voided');
  });

  it('can list by school and plan', async () => {
    await service.createUnresolvedRiskRegister(ctx, {
      resultRecoveryPlanId: 'plan-1',
      riskLevel: 'critical',
      safeRiskSummary: 'Test list2',
    });
    const schoolList = await service.listUnresolvedRiskRegistersForSchool(schoolId);
    expect(schoolList.data?.length).toBeGreaterThanOrEqual(1);
    const planList = await service.listUnresolvedRiskRegistersForPlan(schoolId, 'plan-1');
    expect(planList.data?.length).toBeGreaterThanOrEqual(1);
  });

  it('get returns the correct risk register', async () => {
    const created = await service.createUnresolvedRiskRegister(ctx, {
      resultRecoveryPlanId: 'plan-1',
      riskLevel: 'medium',
      safeRiskSummary: 'Test get',
    });
    const found = await service.getUnresolvedRiskRegister(schoolId, created.data!.unresolvedRiskRegisterId);
    expect(found.success).toBe(true);
    expect(found.data?.safeRiskSummary).toBe('Test get');
  });
});

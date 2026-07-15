import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryRecoveryLifecycleClosureRepositories } from '../repositories/inMemoryRecoveryLifecycleClosureRepositories';
import { RecoveryLifecycleClosureReadinessService } from '../services/recoveryLifecycleClosureReadinessService';
import { RecoveryLifecycleClosureSafetyService } from '../services/recoveryLifecycleClosureSafetyService';
import { RecoveryLifecycleClosureAuditBridge } from '../services/recoveryLifecycleClosureAuditBridge';
import { RecoveryLifecycleClosureIdempotencyService } from '../services/recoveryLifecycleClosureIdempotencyService';
import { RecoveryLifecycleClosurePolicyEnforcer } from '../policies/recoveryLifecycleClosurePolicyDefinitions';
import { RecoveryLifecycleClosureCommandContext } from '../contracts/recoveryLifecycleClosureContracts';

describe('Package 22 - Closure Readiness Lifecycle', () => {
  let repos: InMemoryRecoveryLifecycleClosureRepositories;
  let service: RecoveryLifecycleClosureReadinessService;
  let ctx: RecoveryLifecycleClosureCommandContext;
  const schoolId = 'school-1';

  beforeEach(() => {
    repos = new InMemoryRecoveryLifecycleClosureRepositories();
    const policyEnforcer = new RecoveryLifecycleClosurePolicyEnforcer();
    const safety = new RecoveryLifecycleClosureSafetyService(policyEnforcer);
    const audit = new RecoveryLifecycleClosureAuditBridge(repos);
    const idempotency = new RecoveryLifecycleClosureIdempotencyService(repos);
    service = new RecoveryLifecycleClosureReadinessService(repos, policyEnforcer, safety, audit, idempotency);
    ctx = { schoolId, actorId: 'actor-1', actorRole: 'teacher', correlationId: 'corr-1', idempotencyKey: 'ik-1' };
  });

  it('creates closure readiness in draft status', async () => {
    const result = await service.createClosureReadiness(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      recoveryOutcomeExecutionSimulationReadinessId: 'sim-readiness-1',
      safeReadinessSummary: 'Closure readiness test',
    });
    expect(result.success).toBe(true);
    expect(result.data?.closureReadinessStatus).toBe('draft');
    expect(result.data?.schoolId).toBe(schoolId);
  });

  it('blocks creation when studentRef is missing from request', async () => {
    const result = await service.createClosureReadiness(ctx, {
      studentRef: '',
      resultRecoveryPlanId: 'plan-1',
      safeReadinessSummary: 'Missing studentRef',
    });
    expect(result.success).toBe(false);
  });

  it('blocks creation when empty safeReadinessSummary', async () => {
    const result = await service.createClosureReadiness(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeReadinessSummary: '',
    });
    expect(result.success).toBe(false);
    expect(result.status).toBe('BLOCKED');
  });

  it('blocks student role from creating', async () => {
    const studentCtx = { ...ctx, actorRole: 'student' };
    const result = await service.createClosureReadiness(studentCtx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      recoveryOutcomeExecutionSimulationReadinessId: 'sim-readiness-1',
      safeReadinessSummary: 'Test',
    });
    expect(result.success).toBe(false);
    expect(result.status).toBe('DENIED');
  });

  it('transitions from draft to review_ready to handoff_ready to approved_for_future_use', async () => {
    const created = await service.createClosureReadiness(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      recoveryOutcomeExecutionSimulationReadinessId: 'ar-1',
      safeReadinessSummary: 'Test lifecycle',
    });
    expect(created.data?.closureReadinessStatus).toBe('draft');

    const reviewReady = await service.markClosureReadinessReviewReady(ctx, created.data!.closureReadinessId);
    expect(reviewReady.success).toBe(true);
    expect(reviewReady.data?.closureReadinessStatus).toBe('review_ready');

    const handoffReady = await service.markClosureReadinessHandoffReady(ctx, created.data!.closureReadinessId);
    expect(handoffReady.success).toBe(true);
    expect(handoffReady.data?.closureReadinessStatus).toBe('handoff_ready');

    const approved = await service.approveClosureReadinessForFutureUse(ctx, created.data!.closureReadinessId);
    expect(approved.success).toBe(true);
    expect(approved.data?.closureReadinessStatus).toBe('approved_for_future_use');
  });

  it('can suppress, block, and void readiness', async () => {
    const created = await service.createClosureReadiness(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      recoveryOutcomeExecutionSimulationReadinessId: 'ar-1',
      safeReadinessSummary: 'Test',
    });
    const id = created.data!.closureReadinessId;

    const suppressed = await service.suppressClosureReadiness(ctx, id);
    expect(suppressed.data?.closureReadinessStatus).toBe('suppressed');
  });

  it('can block readiness', async () => {
    const created = await service.createClosureReadiness(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      recoveryOutcomeExecutionSimulationReadinessId: 'ar-1',
      safeReadinessSummary: 'Test',
    });
    const blocked = await service.blockClosureReadiness(ctx, created.data!.closureReadinessId);
    expect(blocked.data?.closureReadinessStatus).toBe('blocked');
  });

  it('can void readiness', async () => {
    const created = await service.createClosureReadiness(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      recoveryOutcomeExecutionSimulationReadinessId: 'ar-1',
      safeReadinessSummary: 'Test',
    });
    const voided = await service.voidClosureReadiness(ctx, created.data!.closureReadinessId);
    expect(voided.data?.closureReadinessStatus).toBe('voided');
  });

  it('can list by school, student, plan, and status', async () => {
    await service.createClosureReadiness(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      recoveryOutcomeExecutionSimulationReadinessId: 'ar-1',
      safeReadinessSummary: 'Test',
    });
    const schoolList = await service.listClosureReadinessForSchool(schoolId);
    expect(schoolList.data?.length).toBeGreaterThanOrEqual(1);
    const studentList = await service.listClosureReadinessForStudent(schoolId, 'student-1');
    expect(studentList.data?.length).toBeGreaterThanOrEqual(1);
    const planList = await service.listClosureReadinessForPlan(schoolId, 'plan-1');
    expect(planList.data?.length).toBeGreaterThanOrEqual(1);
    const draftList = await service.listClosureReadinessByStatus(schoolId, 'draft');
    expect(draftList.data?.length).toBeGreaterThanOrEqual(1);
  });

  it('get returns the correct record', async () => {
    const created = await service.createClosureReadiness(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      recoveryOutcomeExecutionSimulationReadinessId: 'ar-1',
      safeReadinessSummary: 'Test get',
    });
    const found = await service.getClosureReadiness(schoolId, created.data!.closureReadinessId);
    expect(found.success).toBe(true);
    expect(found.data?.safeReadinessSummary).toBe('Test get');
  });
});

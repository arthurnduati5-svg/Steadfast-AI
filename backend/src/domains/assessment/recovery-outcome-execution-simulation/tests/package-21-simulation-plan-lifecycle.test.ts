import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemorySimulationPlanRepository,
  InMemorySimulationAuditRepository,
  InMemorySimulationIdempotencyRepository,
} from '../repositories/inMemoryRecoveryOutcomeExecutionSimulationRepositories';
import { RecoveryOutcomeExecutionSimulationPlanService } from '../services/recoveryOutcomeExecutionSimulationPlanService';
import { RecoveryOutcomeExecutionSimulationSafetyService } from '../services/recoveryOutcomeExecutionSimulationSafetyService';
import { RecoveryOutcomeExecutionSimulationAuditBridge } from '../services/recoveryOutcomeExecutionSimulationAuditBridge';
import { RecoveryOutcomeExecutionSimulationIdempotencyService } from '../services/recoveryOutcomeExecutionSimulationIdempotencyService';
import { RecoveryOutcomeExecutionSimulationCommandContext } from '../contracts/recoveryOutcomeExecutionSimulationContracts';

describe('Package 21 - Simulation Plan Lifecycle', () => {
  let service: RecoveryOutcomeExecutionSimulationPlanService;
  let ctx: RecoveryOutcomeExecutionSimulationCommandContext;
  const schoolId = 'school-1';

  beforeEach(() => {
    const repo = new InMemorySimulationPlanRepository();
    const safety = new RecoveryOutcomeExecutionSimulationSafetyService();
    const auditRepo = new InMemorySimulationAuditRepository();
    const audit = new RecoveryOutcomeExecutionSimulationAuditBridge(auditRepo);
    const idempotencyRepo = new InMemorySimulationIdempotencyRepository();
    const idempotency = new RecoveryOutcomeExecutionSimulationIdempotencyService(idempotencyRepo);
    service = new RecoveryOutcomeExecutionSimulationPlanService(repo, safety, audit, idempotency);
    ctx = { schoolId, actorId: 'actor-1', actorRole: 'teacher', correlationId: 'corr-1', idempotencyKey: 'ik-1' };
  });

  it('creates simulation plan in draft status', async () => {
    const result = await service.createSimulationPlan(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safePlanSummary: 'Sim plan test',
    });
    expect(result.success).toBe(true);
    expect(result.data?.planStatus).toBe('draft');
  });

  it('blocks student role from creating', async () => {
    const studentCtx = { ...ctx, actorRole: 'student' };
    const result = await service.createSimulationPlan(studentCtx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safePlanSummary: 'Test',
    });
    expect(result.success).toBe(false);
  });

  it('transitions from draft to simulation_ready to review_ready to approved_for_future_use', async () => {
    const created = await service.createSimulationPlan(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safePlanSummary: 'Test lifecycle',
    });
    expect(created.data?.planStatus).toBe('draft');

    const simReady = await service.markSimulationPlanReady(ctx, schoolId, created.data!.simulationPlanId);
    expect(simReady.success).toBe(true);
    expect(simReady.data?.planStatus).toBe('ready');

    const reviewReady = await service.markSimulationPlanReviewReady(ctx, schoolId, created.data!.simulationPlanId);
    expect(reviewReady.success).toBe(true);
    expect(reviewReady.data?.planStatus).toBe('review_ready');

    const approved = await service.approveSimulationPlanForFutureUse(ctx, schoolId, created.data!.simulationPlanId);
    expect(approved.success).toBe(true);
    expect(approved.data?.planStatus).toBe('approved_for_future_use');
  });

  it('can suppress, block, and void plan', async () => {
    const created = await service.createSimulationPlan(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safePlanSummary: 'Test',
    });
    const id = created.data!.simulationPlanId;

    const suppressed = await service.suppressSimulationPlan(ctx, schoolId, id);
    expect(suppressed.data?.planStatus).toBe('suppressed');
  });

  it('can block plan', async () => {
    const created = await service.createSimulationPlan(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safePlanSummary: 'Test',
    });
    const blocked = await service.blockSimulationPlan(ctx, schoolId, created.data!.simulationPlanId);
    expect(blocked.data?.planStatus).toBe('blocked');
  });

  it('can void plan', async () => {
    const created = await service.createSimulationPlan(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safePlanSummary: 'Test',
    });
    const voided = await service.voidSimulationPlan(ctx, schoolId, created.data!.simulationPlanId);
    expect(voided.data?.planStatus).toBe('voided');
  });

  it('can list by school, student, plan, and status', async () => {
    await service.createSimulationPlan(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safePlanSummary: 'Test list',
    });
    const schoolList = await service.listSimulationPlansForSchool(schoolId);
    expect(schoolList.data?.length).toBeGreaterThanOrEqual(1);
    const studentList = await service.listSimulationPlansForStudent(schoolId, 'student-1');
    expect(studentList.data?.length).toBeGreaterThanOrEqual(1);
    const planList = await service.listSimulationPlansForPlan(schoolId, 'plan-1');
    expect(planList.data?.length).toBeGreaterThanOrEqual(1);
    const draftList = await service.listSimulationPlansByStatus(schoolId, 'draft');
    expect(draftList.data?.length).toBeGreaterThanOrEqual(1);
  });

  it('get returns the correct plan', async () => {
    const created = await service.createSimulationPlan(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safePlanSummary: 'Test get',
    });
    const found = await service.getSimulationPlan(schoolId, created.data!.simulationPlanId);
    expect(found.success).toBe(true);
    expect(found.data?.safePlanSummary).toBe('Test get');
  });
});

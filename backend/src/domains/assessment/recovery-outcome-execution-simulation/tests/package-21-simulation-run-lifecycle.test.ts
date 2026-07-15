import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemorySimulationRunRepository,
  InMemorySimulationAuditRepository,
  InMemorySimulationIdempotencyRepository,
} from '../repositories/inMemoryRecoveryOutcomeExecutionSimulationRepositories';
import { RecoveryOutcomeExecutionSimulationRunService } from '../services/recoveryOutcomeExecutionSimulationRunService';
import { RecoveryOutcomeExecutionSimulationSafetyService } from '../services/recoveryOutcomeExecutionSimulationSafetyService';
import { RecoveryOutcomeExecutionSimulationAuditBridge } from '../services/recoveryOutcomeExecutionSimulationAuditBridge';
import { RecoveryOutcomeExecutionSimulationIdempotencyService } from '../services/recoveryOutcomeExecutionSimulationIdempotencyService';
import { RecoveryOutcomeExecutionSimulationCommandContext } from '../contracts/recoveryOutcomeExecutionSimulationContracts';

describe('Package 21 - Simulation Run Lifecycle', () => {
  let service: RecoveryOutcomeExecutionSimulationRunService;
  let ctx: RecoveryOutcomeExecutionSimulationCommandContext;
  const schoolId = 'school-1';

  beforeEach(() => {
    const repo = new InMemorySimulationRunRepository();
    const safety = new RecoveryOutcomeExecutionSimulationSafetyService();
    const auditRepo = new InMemorySimulationAuditRepository();
    const audit = new RecoveryOutcomeExecutionSimulationAuditBridge(auditRepo);
    const idempotencyRepo = new InMemorySimulationIdempotencyRepository();
    const idempotency = new RecoveryOutcomeExecutionSimulationIdempotencyService(idempotencyRepo);
    service = new RecoveryOutcomeExecutionSimulationRunService(repo, safety, audit, idempotency);
    ctx = { schoolId, actorId: 'actor-1', actorRole: 'teacher', correlationId: 'corr-1', idempotencyKey: 'ik-1' };
  });

  it('creates simulation run in draft status', async () => {
    const result = await service.createSimulationRun(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      simulationPlanId: 'sim-plan-1',
      safeRunSummary: 'Sim run test',
    });
    expect(result.success).toBe(true);
    expect(result.data?.runStatus).toBe('draft');
  });

  it('blocks student role from creating', async () => {
    const studentCtx = { ...ctx, actorRole: 'student' };
    const result = await service.createSimulationRun(studentCtx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      simulationPlanId: 'sim-plan-1',
      safeRunSummary: 'Test',
    });
    expect(result.success).toBe(false);
  });

  it('transitions from draft to simulating to simulated to review_ready', async () => {
    const created = await service.createSimulationRun(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      simulationPlanId: 'sim-plan-1',
      safeRunSummary: 'Test lifecycle',
    });
    expect(created.data?.runStatus).toBe('draft');

    const simulating = await service.markSimulationRunSimulating(ctx, schoolId, created.data!.simulationRunId);
    expect(simulating.success).toBe(true);
    expect(simulating.data?.runStatus).toBe('simulating');

    const simulated = await service.markSimulationRunSimulated(ctx, schoolId, created.data!.simulationRunId);
    expect(simulated.success).toBe(true);
    expect(simulated.data?.runStatus).toBe('simulated');

    const reviewReady = await service.markSimulationRunReviewReady(ctx, schoolId, created.data!.simulationRunId);
    expect(reviewReady.success).toBe(true);
    expect(reviewReady.data?.runStatus).toBe('review_ready');
  });

  it('can suppress run', async () => {
    const created = await service.createSimulationRun(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      simulationPlanId: 'sim-plan-1',
      safeRunSummary: 'Test',
    });
    const suppressed = await service.suppressSimulationRun(ctx, schoolId, created.data!.simulationRunId);
    expect(suppressed.data?.runStatus).toBe('suppressed');
  });

  it('can block run', async () => {
    const created = await service.createSimulationRun(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      simulationPlanId: 'sim-plan-1',
      safeRunSummary: 'Test',
    });
    const blocked = await service.blockSimulationRun(ctx, schoolId, created.data!.simulationRunId);
    expect(blocked.data?.runStatus).toBe('blocked');
  });

  it('can void run', async () => {
    const created = await service.createSimulationRun(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      simulationPlanId: 'sim-plan-1',
      safeRunSummary: 'Test',
    });
    const voided = await service.voidSimulationRun(ctx, schoolId, created.data!.simulationRunId);
    expect(voided.data?.runStatus).toBe('voided');
  });

  it('can list by school, student, plan, simulation plan, and status', async () => {
    await service.createSimulationRun(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      simulationPlanId: 'sim-plan-1',
      safeRunSummary: 'Test list',
    });
    const schoolList = await service.listSimulationRunsForSchool(schoolId);
    expect(schoolList.data?.length).toBeGreaterThanOrEqual(1);
    const studentList = await service.listSimulationRunsForStudent(schoolId, 'student-1');
    expect(studentList.data?.length).toBeGreaterThanOrEqual(1);
    const planList = await service.listSimulationRunsForPlan(schoolId, 'plan-1');
    expect(planList.data?.length).toBeGreaterThanOrEqual(1);
    const simPlanList = await service.listSimulationRunsForSimulationPlan(schoolId, 'sim-plan-1');
    expect(simPlanList.data?.length).toBeGreaterThanOrEqual(1);
    const draftList = await service.listSimulationRunsByStatus(schoolId, 'draft');
    expect(draftList.data?.length).toBeGreaterThanOrEqual(1);
  });

  it('get returns the correct run', async () => {
    const created = await service.createSimulationRun(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      simulationPlanId: 'sim-plan-1',
      safeRunSummary: 'Test get',
    });
    const found = await service.getSimulationRun(schoolId, created.data!.simulationRunId);
    expect(found.success).toBe(true);
    expect(found.data?.safeRunSummary).toBe('Test get');
  });
});

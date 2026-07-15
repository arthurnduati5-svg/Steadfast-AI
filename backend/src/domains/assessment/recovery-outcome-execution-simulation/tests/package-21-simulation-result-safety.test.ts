import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemorySimulationResultRepository,
  InMemorySimulationAuditRepository,
  InMemorySimulationIdempotencyRepository,
} from '../repositories/inMemoryRecoveryOutcomeExecutionSimulationRepositories';
import { RecoveryOutcomeExecutionSimulationResultService } from '../services/recoveryOutcomeExecutionSimulationResultService';
import { RecoveryOutcomeExecutionSimulationSafetyService } from '../services/recoveryOutcomeExecutionSimulationSafetyService';
import { RecoveryOutcomeExecutionSimulationAuditBridge } from '../services/recoveryOutcomeExecutionSimulationAuditBridge';
import { RecoveryOutcomeExecutionSimulationIdempotencyService } from '../services/recoveryOutcomeExecutionSimulationIdempotencyService';
import { RecoveryOutcomeExecutionSimulationCommandContext } from '../contracts/recoveryOutcomeExecutionSimulationContracts';

describe('Package 21 - Simulation Result Safety', () => {
  let service: RecoveryOutcomeExecutionSimulationResultService;
  let ctx: RecoveryOutcomeExecutionSimulationCommandContext;
  const schoolId = 'school-1';
  const runId = 'run-1';

  beforeEach(() => {
    const repo = new InMemorySimulationResultRepository();
    const safety = new RecoveryOutcomeExecutionSimulationSafetyService();
    const auditRepo = new InMemorySimulationAuditRepository();
    const audit = new RecoveryOutcomeExecutionSimulationAuditBridge(auditRepo);
    const idempotencyRepo = new InMemorySimulationIdempotencyRepository();
    const idempotency = new RecoveryOutcomeExecutionSimulationIdempotencyService(idempotencyRepo);
    service = new RecoveryOutcomeExecutionSimulationResultService(repo, safety, audit, idempotency);
    ctx = { schoolId, actorId: 'actor-1', actorRole: 'teacher', correlationId: 'corr-1', idempotencyKey: 'ik-1' };
  });

  it('creates simulation result in pending status', async () => {
    const result = await service.createSimulationResult(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      simulationRunId: runId,
      safeOutcomeSummary: 'Result test',
    });
    expect(result.success).toBe(true);
    expect(result.data?.outcomeStatus).toBe('pending');
  });

  it('blocks student role from creating', async () => {
    const studentCtx = { ...ctx, actorRole: 'student' };
    const result = await service.createSimulationResult(studentCtx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      simulationRunId: runId,
      safeOutcomeSummary: 'Test',
    });
    expect(result.success).toBe(false);
  });

  it('lists by simulationRunId, planId, and outcome', async () => {
    await service.createSimulationResult(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      simulationRunId: runId,
      safeOutcomeSummary: 'Test list',
    });
    const runList = await service.listResultsForSimulationRun(runId);
    expect(runList.data?.length).toBeGreaterThanOrEqual(1);
    const planList = await service.listResultsForPlan(schoolId, 'plan-1');
    expect(planList.data?.length).toBeGreaterThanOrEqual(1);
    const outcomeList = await service.listResultsByOutcome(schoolId, 'pending');
    expect(outcomeList.data?.length).toBeGreaterThanOrEqual(1);
  });

  it('marks result review ready', async () => {
    const created = await service.createSimulationResult(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      simulationRunId: runId,
      safeOutcomeSummary: 'Test review',
    });
    const reviewReady = await service.markSimulationResultReviewReady(ctx, schoolId, created.data!.simulationResultId);
    expect(reviewReady.success).toBe(true);
    expect(reviewReady.data?.outcomeStatus).toBe('review_ready');
  });

  it('voids simulation result', async () => {
    const created = await service.createSimulationResult(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      simulationRunId: runId,
      safeOutcomeSummary: 'Test void',
    });
    const voided = await service.voidSimulationResult(ctx, schoolId, created.data!.simulationResultId);
    expect(voided.data?.outcomeStatus).toBe('voided');
  });

  it('contains mock outcomes only - no real outcomes', async () => {
    const result = await service.createSimulationResult(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      simulationRunId: runId,
      safeOutcomeSummary: 'Mock outcome',
      simulationOutcomeDetailsJson: { mockResult: 'simulated_pass' },
    });
    expect(result.success).toBe(true);
    expect(result.data?.simulationOutcomeDetailsJson).toBeDefined();
    expect(result.data?.outcomeStatus).toBe('pending');
  });

  it('get returns the correct result', async () => {
    const created = await service.createSimulationResult(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      simulationRunId: runId,
      safeOutcomeSummary: 'Test get',
    });
    const found = await service.getSimulationResult(schoolId, created.data!.simulationResultId);
    expect(found.success).toBe(true);
    expect(found.data?.safeOutcomeSummary).toBe('Test get');
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemorySimulationStepRepository,
  InMemorySimulationAuditRepository,
  InMemorySimulationIdempotencyRepository,
} from '../repositories/inMemoryRecoveryOutcomeExecutionSimulationRepositories';
import { RecoveryOutcomeExecutionSimulationStepService } from '../services/recoveryOutcomeExecutionSimulationStepService';
import { RecoveryOutcomeExecutionSimulationSafetyService } from '../services/recoveryOutcomeExecutionSimulationSafetyService';
import { RecoveryOutcomeExecutionSimulationAuditBridge } from '../services/recoveryOutcomeExecutionSimulationAuditBridge';
import { RecoveryOutcomeExecutionSimulationIdempotencyService } from '../services/recoveryOutcomeExecutionSimulationIdempotencyService';
import { RecoveryOutcomeExecutionSimulationCommandContext } from '../contracts/recoveryOutcomeExecutionSimulationContracts';

describe('Package 21 - Simulation Step Trace', () => {
  let service: RecoveryOutcomeExecutionSimulationStepService;
  let ctx: RecoveryOutcomeExecutionSimulationCommandContext;
  const schoolId = 'school-1';
  const runId = 'run-1';

  beforeEach(() => {
    const repo = new InMemorySimulationStepRepository();
    const safety = new RecoveryOutcomeExecutionSimulationSafetyService();
    const auditRepo = new InMemorySimulationAuditRepository();
    const audit = new RecoveryOutcomeExecutionSimulationAuditBridge(auditRepo);
    const idempotencyRepo = new InMemorySimulationIdempotencyRepository();
    const idempotency = new RecoveryOutcomeExecutionSimulationIdempotencyService(idempotencyRepo);
    service = new RecoveryOutcomeExecutionSimulationStepService(repo, safety, audit, idempotency);
    ctx = { schoolId, actorId: 'actor-1', actorRole: 'teacher', correlationId: 'corr-1', idempotencyKey: 'ik-1' };
  });

  it('creates simulation step in pending status', async () => {
    const result = await service.createSimulationStep(ctx, {
      simulationRunId: runId,
      stepSequence: 1,
      stepName: 'Load test data',
      safeStepSummary: 'Loading test data into simulation',
    });
    expect(result.success).toBe(true);
    expect(result.data?.stepStatus).toBe('pending');
    expect(result.data?.stepSequence).toBe(1);
  });

  it('blocks student role from creating', async () => {
    const studentCtx = { ...ctx, actorRole: 'student' };
    const result = await service.createSimulationStep(studentCtx, {
      simulationRunId: runId,
      stepSequence: 1,
      stepName: 'Test',
      safeStepSummary: 'Test',
    });
    expect(result.success).toBe(false);
  });

  it('lists steps by simulationRunId', async () => {
    await service.createSimulationStep({ ...ctx, idempotencyKey: 'ik-ls1' }, {
      simulationRunId: runId,
      stepSequence: 1,
      stepName: 'Step one',
      safeStepSummary: 'First step',
    });
    await service.createSimulationStep({ ...ctx, idempotencyKey: 'ik-ls2' }, {
      simulationRunId: runId,
      stepSequence: 2,
      stepName: 'Step two',
      safeStepSummary: 'Second step',
    });
    const list = await service.listStepsForSimulationRun(runId);
    expect(list.data?.length).toBe(2);
  });

  it('marks step as simulated', async () => {
    const created = await service.createSimulationStep(ctx, {
      simulationRunId: runId,
      stepSequence: 1,
      stepName: 'Test step',
      safeStepSummary: 'Test',
    });
    const simulated = await service.markStepSimulated(ctx, schoolId, created.data!.simulationStepId);
    expect(simulated.data?.stepStatus).toBe('simulated');
  });

  it('marks step as blocked', async () => {
    const created = await service.createSimulationStep(ctx, {
      simulationRunId: runId,
      stepSequence: 1,
      stepName: 'Test step',
      safeStepSummary: 'Test',
    });
    const blocked = await service.markStepBlocked(ctx, schoolId, created.data!.simulationStepId);
    expect(blocked.data?.stepStatus).toBe('blocked');
  });

  it('voids a step', async () => {
    const created = await service.createSimulationStep(ctx, {
      simulationRunId: runId,
      stepSequence: 1,
      stepName: 'Test step',
      safeStepSummary: 'Test',
    });
    const voided = await service.voidStep(ctx, schoolId, created.data!.simulationStepId);
    expect(voided.data?.stepStatus).toBe('voided');
  });

  it('lists steps by status', async () => {
    await service.createSimulationStep(ctx, {
      simulationRunId: runId,
      stepSequence: 1,
      stepName: 'Pending step',
      safeStepSummary: 'Pending',
    });
    const pendingList = await service.listStepsByStatus(schoolId, 'pending');
    expect(pendingList.data?.length).toBeGreaterThanOrEqual(1);
  });

  it('get returns the correct step', async () => {
    const created = await service.createSimulationStep(ctx, {
      simulationRunId: runId,
      stepSequence: 1,
      stepName: 'Get test',
      safeStepSummary: 'Test get',
    });
    const found = await service.getSimulationStep(schoolId, created.data!.simulationStepId);
    expect(found.success).toBe(true);
    expect(found.data?.stepName).toBe('Get test');
  });
});

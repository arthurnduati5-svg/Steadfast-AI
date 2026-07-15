import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemorySimulationReadinessRepository,
  InMemorySimulationAuditRepository,
  InMemorySimulationIdempotencyRepository,
} from '../repositories/inMemoryRecoveryOutcomeExecutionSimulationRepositories';
import { RecoveryOutcomeExecutionSimulationReadinessService } from '../services/recoveryOutcomeExecutionSimulationReadinessService';
import { RecoveryOutcomeExecutionSimulationSafetyService } from '../services/recoveryOutcomeExecutionSimulationSafetyService';
import { RecoveryOutcomeExecutionSimulationAuditBridge } from '../services/recoveryOutcomeExecutionSimulationAuditBridge';
import { RecoveryOutcomeExecutionSimulationIdempotencyService } from '../services/recoveryOutcomeExecutionSimulationIdempotencyService';
import { RecoveryOutcomeExecutionSimulationCommandContext } from '../contracts/recoveryOutcomeExecutionSimulationContracts';

describe('Package 21 - Idempotency and Audit', () => {
  let service: RecoveryOutcomeExecutionSimulationReadinessService;
  let ctx: RecoveryOutcomeExecutionSimulationCommandContext;
  let auditRepo: InMemorySimulationAuditRepository;
  let idempotencyRepo: InMemorySimulationIdempotencyRepository;
  const schoolId = 'school-1';

  beforeEach(() => {
    const repo = new InMemorySimulationReadinessRepository();
    const safety = new RecoveryOutcomeExecutionSimulationSafetyService();
    auditRepo = new InMemorySimulationAuditRepository();
    const audit = new RecoveryOutcomeExecutionSimulationAuditBridge(auditRepo);
    idempotencyRepo = new InMemorySimulationIdempotencyRepository();
    const idempotency = new RecoveryOutcomeExecutionSimulationIdempotencyService(idempotencyRepo);
    service = new RecoveryOutcomeExecutionSimulationReadinessService(repo, safety, audit, idempotency);
    ctx = { schoolId, actorId: 'actor-1', actorRole: 'teacher', correlationId: 'corr-1', idempotencyKey: 'ik-1' };
  });

  it('blocks duplicate mutating operations via idempotency key', async () => {
    const req = {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      recoveryOutcomeActionReadinessId: 'ar-1',
      safeReadinessSummary: 'Idempotency test',
    };
    const first = await service.createSimulationReadiness(ctx, req);
    expect(first.success).toBe(true);

    const second = await service.createSimulationReadiness(ctx, req);
    expect(second.success).toBe(false);
    expect(second.status).toBe('DUPLICATE');
  });

  it('creates audit events for mutations', async () => {
    const result = await service.createSimulationReadiness(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      recoveryOutcomeActionReadinessId: 'ar-1',
      safeReadinessSummary: 'Audit test',
    });
    expect(result.success).toBe(true);

    const audits = await auditRepo.listBySchool(schoolId);
    expect(audits.length).toBeGreaterThanOrEqual(1);
    expect(audits[0].eventType).toBe('SIMULATION_READINESS_CREATED');
  });

  it('audit events capture actor and decision', async () => {
    const result = await service.createSimulationReadiness(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      recoveryOutcomeActionReadinessId: 'ar-1',
      safeReadinessSummary: 'Audit actor test',
    });
    const audits = await auditRepo.listBySchool(schoolId);
    expect(audits[0].actorId).toBe('actor-1');
    expect(audits[0].actorRole).toBe('teacher');
    expect(audits[0].decision).toBe('created');
  });

  it('audit events capture simulationReadinessId', async () => {
    const result = await service.createSimulationReadiness(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      recoveryOutcomeActionReadinessId: 'ar-1',
      safeReadinessSummary: 'Audit ref test',
    });
    const audits = await auditRepo.listBySchool(schoolId);
    expect(audits[0].simulationReadinessId).toBe(result.data!.simulationReadinessId);
  });

  it('idempotency record is created and marked completed', async () => {
    await service.createSimulationReadiness(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      recoveryOutcomeActionReadinessId: 'ar-1',
      safeReadinessSummary: 'Idempotency record test',
    });
    const record = await idempotencyRepo.findByIdempotencyKey(schoolId, 'createSimulationReadiness', 'ik-1');
    expect(record).not.toBeNull();
    expect(record!.status).toBe('completed');
  });
});

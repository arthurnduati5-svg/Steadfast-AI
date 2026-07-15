import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryRecoveryLifecycleClosureRepositories } from '../repositories/inMemoryRecoveryLifecycleClosureRepositories';
import { RecoveryLifecycleClosureReadinessService } from '../services/recoveryLifecycleClosureReadinessService';
import { RecoveryLifecycleClosureSafetyService } from '../services/recoveryLifecycleClosureSafetyService';
import { RecoveryLifecycleClosureAuditBridge } from '../services/recoveryLifecycleClosureAuditBridge';
import { RecoveryLifecycleClosureIdempotencyService } from '../services/recoveryLifecycleClosureIdempotencyService';
import { RecoveryLifecycleClosurePolicyEnforcer } from '../policies/recoveryLifecycleClosurePolicyDefinitions';
import { RecoveryLifecycleClosureCommandContext } from '../contracts/recoveryLifecycleClosureContracts';

describe('Package 22 - Idempotency and Audit', () => {
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

  it('blocks duplicate mutating operations via idempotency key', async () => {
    const req = {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      recoveryOutcomeExecutionSimulationReadinessId: 'sim-readiness-1',
      safeReadinessSummary: 'Idempotency test',
    };
    const first = await service.createClosureReadiness(ctx, req);
    expect(first.success).toBe(true);

    const second = await service.createClosureReadiness(ctx, req);
    expect(second.success).toBe(false);
    expect(second.status).toBe('DUPLICATE');
  });

  it('creates audit events for mutations', async () => {
    const result = await service.createClosureReadiness(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      recoveryOutcomeExecutionSimulationReadinessId: 'sim-readiness-1',
      safeReadinessSummary: 'Audit test',
    });
    expect(result.success).toBe(true);

    const audits = await repos.closureAudit.listBySchool(schoolId);
    expect(audits.length).toBeGreaterThanOrEqual(1);
    expect(audits[0].eventType).toBe('CLOSURE_READINESS_CREATED');
  });

  it('audit events capture actor and decision', async () => {
    const result = await service.createClosureReadiness(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      recoveryOutcomeExecutionSimulationReadinessId: 'sim-readiness-1',
      safeReadinessSummary: 'Audit actor test',
    });
    const audits = await repos.closureAudit.listBySchool(schoolId);
    expect(audits[0].actorId).toBe('actor-1');
    expect(audits[0].actorRole).toBe('teacher');
    expect(audits[0].decision).toBe('created');
  });

  it('audit events capture the closure readiness id', async () => {
    const result = await service.createClosureReadiness(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      recoveryOutcomeExecutionSimulationReadinessId: 'sim-readiness-1',
      safeReadinessSummary: 'Audit ref test',
    });
    const audits = await repos.closureAudit.listBySchool(schoolId);
    expect(audits[0].closureReadinessId).toBe(result.data!.closureReadinessId);
  });

  it('idempotency record is created and marked completed', async () => {
    await service.createClosureReadiness(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      recoveryOutcomeExecutionSimulationReadinessId: 'sim-readiness-1',
      safeReadinessSummary: 'Idempotency record test',
    });
    const record = await repos.closureIdempotency.findByIdempotencyKey(schoolId, 'createClosureReadiness', 'ik-1');
    expect(record).not.toBeNull();
    expect(record!.status).toBe('completed');
  });

  it('idempotency record has correct structure', async () => {
    await service.createClosureReadiness(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      recoveryOutcomeExecutionSimulationReadinessId: 'sim-readiness-1',
      safeReadinessSummary: 'Structure test',
    });
    const record = await repos.closureIdempotency.findByIdempotencyKey(schoolId, 'createClosureReadiness', 'ik-1');
    expect(record!.closureIdempotencyId).toBeDefined();
    expect(record!.schoolId).toBe(schoolId);
    expect(record!.operation).toBe('createClosureReadiness');
    expect(record!.idempotencyKey).toBe('ik-1');
    expect(record!.requestHash).toBeDefined();
    expect(record!.status).toBe('completed');
    expect(record!.resourceType).toBe('closureReadiness');
    expect(record!.resourceId).toBeDefined();
    expect(record!.safeResultSummary).toContain('Closure readiness');
  });

  it('same idempotency key with same operation returns DUPLICATE status', async () => {
    const req = {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      recoveryOutcomeExecutionSimulationReadinessId: 'sim-readiness-1',
      safeReadinessSummary: 'Same key test',
    };
    await service.createClosureReadiness(ctx, req);

    const repeat = await service.createClosureReadiness(ctx, req);
    expect(repeat.success).toBe(false);
    expect(repeat.status).toBe('DUPLICATE');
    expect(repeat.message).toContain('Idempotency key already processed');
  });

  it('different idempotency keys allow separate creates', async () => {
    const req = {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      recoveryOutcomeExecutionSimulationReadinessId: 'sim-readiness-1',
      safeReadinessSummary: 'Different key test',
    };
    const first = await service.createClosureReadiness(ctx, req);
    expect(first.success).toBe(true);

    const ctx2 = { ...ctx, idempotencyKey: 'ik-2' };
    const second = await service.createClosureReadiness(ctx2, req);
    expect(second.success).toBe(true);
    expect(second.data?.closureReadinessId).not.toBe(first.data?.closureReadinessId);
  });
});

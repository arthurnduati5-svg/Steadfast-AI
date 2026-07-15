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

describe('Package 21 - Simulation Readiness Lifecycle', () => {
  let service: RecoveryOutcomeExecutionSimulationReadinessService;
  let ctx: RecoveryOutcomeExecutionSimulationCommandContext;
  const schoolId = 'school-1';

  beforeEach(() => {
    const repo = new InMemorySimulationReadinessRepository();
    const safety = new RecoveryOutcomeExecutionSimulationSafetyService();
    const auditRepo = new InMemorySimulationAuditRepository();
    const audit = new RecoveryOutcomeExecutionSimulationAuditBridge(auditRepo);
    const idempotencyRepo = new InMemorySimulationIdempotencyRepository();
    const idempotency = new RecoveryOutcomeExecutionSimulationIdempotencyService(idempotencyRepo);
    service = new RecoveryOutcomeExecutionSimulationReadinessService(repo, safety, audit, idempotency);
    ctx = { schoolId, actorId: 'actor-1', actorRole: 'teacher', correlationId: 'corr-1', idempotencyKey: 'ik-1' };
  });

  it('creates simulation readiness in draft status', async () => {
    const result = await service.createSimulationReadiness(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      recoveryOutcomeActionReadinessId: 'action-readiness-1',
      safeReadinessSummary: 'Sim readiness test',
      readinessChecksJson: { check: 'ok' },
    });
    expect(result.success).toBe(true);
    expect(result.data?.readinessStatus).toBe('draft');
    expect(result.data?.schoolId).toBe(schoolId);
  });

  it('blocks creation when missing recoveryOutcomeActionReadinessId', async () => {
    const result = await service.createSimulationReadiness(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      recoveryOutcomeActionReadinessId: '',
      safeReadinessSummary: 'Missing ref',
    });
    expect(result.success).toBe(false);
  });

  it('blocks student role from creating', async () => {
    const studentCtx = { ...ctx, actorRole: 'student' };
    const result = await service.createSimulationReadiness(studentCtx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      recoveryOutcomeActionReadinessId: 'ar-1',
      safeReadinessSummary: 'Test',
    });
    expect(result.success).toBe(false);
  });

  it('transitions from draft to review_ready to approved_for_future_use', async () => {
    const created = await service.createSimulationReadiness(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      recoveryOutcomeActionReadinessId: 'ar-1',
      safeReadinessSummary: 'Test',
    });
    expect(created.data?.readinessStatus).toBe('draft');

    const reviewReady = await service.markSimulationReadinessReviewReady(ctx, schoolId, created.data!.simulationReadinessId);
    expect(reviewReady.success).toBe(true);
    expect(reviewReady.data?.readinessStatus).toBe('review_ready');

    const approved = await service.approveSimulationReadinessForFutureUse(ctx, schoolId, created.data!.simulationReadinessId);
    expect(approved.success).toBe(true);
    expect(approved.data?.readinessStatus).toBe('approved_for_future_use');
  });

  it('can suppress, block, and void readiness', async () => {
    const created = await service.createSimulationReadiness(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      recoveryOutcomeActionReadinessId: 'ar-1',
      safeReadinessSummary: 'Test',
    });
    const id = created.data!.simulationReadinessId;

    const suppressed = await service.suppressSimulationReadiness(ctx, schoolId, id);
    expect(suppressed.data?.readinessStatus).toBe('suppressed');
  });

  it('can block readiness', async () => {
    const created = await service.createSimulationReadiness(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      recoveryOutcomeActionReadinessId: 'ar-1',
      safeReadinessSummary: 'Test',
    });
    const blocked = await service.blockSimulationReadiness(ctx, schoolId, created.data!.simulationReadinessId);
    expect(blocked.data?.readinessStatus).toBe('blocked');
  });

  it('can void readiness', async () => {
    const created = await service.createSimulationReadiness(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      recoveryOutcomeActionReadinessId: 'ar-1',
      safeReadinessSummary: 'Test',
    });
    const voided = await service.voidSimulationReadiness(ctx, schoolId, created.data!.simulationReadinessId);
    expect(voided.data?.readinessStatus).toBe('voided');
  });

  it('can list by school, student, plan, and status', async () => {
    await service.createSimulationReadiness(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      recoveryOutcomeActionReadinessId: 'ar-1',
      safeReadinessSummary: 'Test',
    });
    const schoolList = await service.listSimulationReadinessForSchool(schoolId);
    expect(schoolList.data?.length).toBeGreaterThanOrEqual(1);
    const studentList = await service.listSimulationReadinessForStudent(schoolId, 'student-1');
    expect(studentList.data?.length).toBeGreaterThanOrEqual(1);
    const planList = await service.listSimulationReadinessForPlan(schoolId, 'plan-1');
    expect(planList.data?.length).toBeGreaterThanOrEqual(1);
    const draftList = await service.listSimulationReadinessByStatus(schoolId, 'draft');
    expect(draftList.data?.length).toBeGreaterThanOrEqual(1);
  });

  it('get returns the correct record', async () => {
    const created = await service.createSimulationReadiness(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      recoveryOutcomeActionReadinessId: 'ar-1',
      safeReadinessSummary: 'Test get',
    });
    const found = await service.getSimulationReadiness(schoolId, created.data!.simulationReadinessId);
    expect(found.success).toBe(true);
    expect(found.data?.safeReadinessSummary).toBe('Test get');
  });
});

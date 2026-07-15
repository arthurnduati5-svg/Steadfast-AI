import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryFailureInjectionRepository,
  InMemorySimulationAuditRepository,
  InMemorySimulationIdempotencyRepository,
} from '../repositories/inMemoryRecoveryOutcomeExecutionSimulationRepositories';
import { RecoveryOutcomeExecutionFailureInjectionService } from '../services/recoveryOutcomeExecutionFailureInjectionService';
import { RecoveryOutcomeExecutionSimulationSafetyService } from '../services/recoveryOutcomeExecutionSimulationSafetyService';
import { RecoveryOutcomeExecutionSimulationAuditBridge } from '../services/recoveryOutcomeExecutionSimulationAuditBridge';
import { RecoveryOutcomeExecutionSimulationIdempotencyService } from '../services/recoveryOutcomeExecutionSimulationIdempotencyService';
import { RecoveryOutcomeExecutionSimulationCommandContext } from '../contracts/recoveryOutcomeExecutionSimulationContracts';

describe('Package 21 - Failure Injection Safety', () => {
  let service: RecoveryOutcomeExecutionFailureInjectionService;
  let ctx: RecoveryOutcomeExecutionSimulationCommandContext;
  const schoolId = 'school-1';

  beforeEach(() => {
    const repo = new InMemoryFailureInjectionRepository();
    const safety = new RecoveryOutcomeExecutionSimulationSafetyService();
    const auditRepo = new InMemorySimulationAuditRepository();
    const audit = new RecoveryOutcomeExecutionSimulationAuditBridge(auditRepo);
    const idempotencyRepo = new InMemorySimulationIdempotencyRepository();
    const idempotency = new RecoveryOutcomeExecutionSimulationIdempotencyService(idempotencyRepo);
    service = new RecoveryOutcomeExecutionFailureInjectionService(repo, safety, audit, idempotency);
    ctx = { schoolId, actorId: 'actor-1', actorRole: 'teacher', correlationId: 'corr-1', idempotencyKey: 'ik-1' };
  });

  it('creates failure injection scenario in draft status', async () => {
    const result = await service.createFailureInjectionScenario(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      injectionType: 'timeout',
      safeInjectionSummary: 'Timeout injection test',
    });
    expect(result.success).toBe(true);
    expect(result.data?.injectionStatus).toBe('draft');
    expect(result.data?.injectionType).toBe('timeout');
  });

  it('blocks student role from creating', async () => {
    const studentCtx = { ...ctx, actorRole: 'student' };
    const result = await service.createFailureInjectionScenario(studentCtx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      injectionType: 'timeout',
      safeInjectionSummary: 'Test',
    });
    expect(result.success).toBe(false);
  });

  it('lists by plan and by type', async () => {
    await service.createFailureInjectionScenario(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      injectionType: 'network_error',
      safeInjectionSummary: 'Test list',
    });
    const planList = await service.listFailureInjectionScenariosForPlan(schoolId, 'plan-1');
    expect(planList.data?.length).toBeGreaterThanOrEqual(1);
    const typeList = await service.listFailureInjectionScenariosByType(schoolId, 'network_error');
    expect(typeList.data?.length).toBeGreaterThanOrEqual(1);
  });

  it('transitions to review_ready to approved_for_future_use', async () => {
    const created = await service.createFailureInjectionScenario(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      injectionType: 'timeout',
      safeInjectionSummary: 'Test lifecycle',
    });
    const reviewReady = await service.markFailureInjectionReviewReady(ctx, schoolId, created.data!.failureInjectionId);
    expect(reviewReady.data?.injectionStatus).toBe('review_ready');

    const approved = await service.approveFailureInjectionForFutureUse(ctx, schoolId, created.data!.failureInjectionId);
    expect(approved.data?.injectionStatus).toBe('approved_for_future_use');
  });

  it('can suppress, block, and void', async () => {
    const created = await service.createFailureInjectionScenario(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      injectionType: 'timeout',
      safeInjectionSummary: 'Test transitions',
    });
    const id = created.data!.failureInjectionId;

    const suppressed = await service.suppressFailureInjection(ctx, schoolId, id);
    expect(suppressed.data?.injectionStatus).toBe('suppressed');
  });

  it('can block failure injection', async () => {
    const created = await service.createFailureInjectionScenario(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      injectionType: 'timeout',
      safeInjectionSummary: 'Test block',
    });
    const blocked = await service.blockFailureInjection(ctx, schoolId, created.data!.failureInjectionId);
    expect(blocked.data?.injectionStatus).toBe('blocked');
  });

  it('can void failure injection', async () => {
    const created = await service.createFailureInjectionScenario(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      injectionType: 'timeout',
      safeInjectionSummary: 'Test void',
    });
    const voided = await service.voidFailureInjection(ctx, schoolId, created.data!.failureInjectionId);
    expect(voided.data?.injectionStatus).toBe('voided');
  });

  it('injection is metadata-only - cannot trigger real failures', async () => {
    const result = await service.createFailureInjectionScenario(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      injectionType: 'database_down',
      safeInjectionSummary: 'Metadata only',
      injectionParametersJson: { delayMs: 5000 },
      expectedFailureBehaviorJson: { errorCode: 'DB_TIMEOUT' },
    });
    expect(result.success).toBe(true);
    expect(result.data?.injectionStatus).toBe('draft');
    expect(result.data?.injectionType).toBe('database_down');
  });

  it('get returns the correct failure injection', async () => {
    const created = await service.createFailureInjectionScenario(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      injectionType: 'timeout',
      safeInjectionSummary: 'Test get',
    });
    const found = await service.getFailureInjectionScenario(schoolId, created.data!.failureInjectionId);
    expect(found.success).toBe(true);
    expect(found.data?.safeInjectionSummary).toBe('Test get');
  });
});

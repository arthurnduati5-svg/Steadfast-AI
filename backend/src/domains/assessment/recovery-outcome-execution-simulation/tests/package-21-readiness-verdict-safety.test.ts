import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryReadinessVerdictRepository,
  InMemorySimulationAuditRepository,
  InMemorySimulationIdempotencyRepository,
} from '../repositories/inMemoryRecoveryOutcomeExecutionSimulationRepositories';
import { RecoveryOutcomeExecutionReadinessVerdictService } from '../services/recoveryOutcomeExecutionReadinessVerdictService';
import { RecoveryOutcomeExecutionSimulationSafetyService } from '../services/recoveryOutcomeExecutionSimulationSafetyService';
import { RecoveryOutcomeExecutionSimulationAuditBridge } from '../services/recoveryOutcomeExecutionSimulationAuditBridge';
import { RecoveryOutcomeExecutionSimulationIdempotencyService } from '../services/recoveryOutcomeExecutionSimulationIdempotencyService';
import { RecoveryOutcomeExecutionSimulationCommandContext } from '../contracts/recoveryOutcomeExecutionSimulationContracts';

describe('Package 21 - Readiness Verdict Safety', () => {
  let service: RecoveryOutcomeExecutionReadinessVerdictService;
  let ctx: RecoveryOutcomeExecutionSimulationCommandContext;
  const schoolId = 'school-1';
  const runId = 'run-1';

  beforeEach(() => {
    const repo = new InMemoryReadinessVerdictRepository();
    const safety = new RecoveryOutcomeExecutionSimulationSafetyService();
    const auditRepo = new InMemorySimulationAuditRepository();
    const audit = new RecoveryOutcomeExecutionSimulationAuditBridge(auditRepo);
    const idempotencyRepo = new InMemorySimulationIdempotencyRepository();
    const idempotency = new RecoveryOutcomeExecutionSimulationIdempotencyService(idempotencyRepo);
    service = new RecoveryOutcomeExecutionReadinessVerdictService(repo, safety, audit, idempotency);
    ctx = { schoolId, actorId: 'actor-1', actorRole: 'teacher', correlationId: 'corr-1', idempotencyKey: 'ik-1' };
  });

  it('creates readiness verdict in draft status', async () => {
    const result = await service.createReadinessVerdict(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeVerdictSummary: 'Verdict test',
    });
    expect(result.success).toBe(true);
    expect(result.data?.verdictStatus).toBe('draft');
  });

  it('blocks student role from creating', async () => {
    const studentCtx = { ...ctx, actorRole: 'student' };
    const result = await service.createReadinessVerdict(studentCtx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeVerdictSummary: 'Test',
    });
    expect(result.success).toBe(false);
  });

  it('lists by plan, simulationRunId, and status', async () => {
    await service.createReadinessVerdict(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      simulationRunId: runId,
      safeVerdictSummary: 'Test list',
    });
    const planList = await service.listReadinessVerdictsForPlan(schoolId, 'plan-1');
    expect(planList.data?.length).toBeGreaterThanOrEqual(1);
    const runList = await service.listReadinessVerdictsForSimulationRun(runId);
    expect(runList.data?.length).toBeGreaterThanOrEqual(1);
    const statusList = await service.listReadinessVerdictsByStatus(schoolId, 'draft');
    expect(statusList.data?.length).toBeGreaterThanOrEqual(1);
  });

  it('transitions to review_ready to approved_for_future_use', async () => {
    const created = await service.createReadinessVerdict(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeVerdictSummary: 'Test lifecycle',
    });
    const reviewReady = await service.markReadinessVerdictReviewReady(ctx, schoolId, created.data!.readinessVerdictId);
    expect(reviewReady.data?.verdictStatus).toBe('review_ready');

    const approved = await service.approveReadinessVerdictForFutureUse(ctx, schoolId, created.data!.readinessVerdictId);
    expect(approved.data?.verdictStatus).toBe('approved_for_future_use');
  });

  it('can suppress, block, and void', async () => {
    const created = await service.createReadinessVerdict(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeVerdictSummary: 'Test transitions',
    });
    const id = created.data!.readinessVerdictId;

    const suppressed = await service.suppressReadinessVerdict(ctx, schoolId, id);
    expect(suppressed.data?.verdictStatus).toBe('suppressed');
  });

  it('can block readiness verdict', async () => {
    const created = await service.createReadinessVerdict(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeVerdictSummary: 'Test block',
    });
    const blocked = await service.blockReadinessVerdict(ctx, schoolId, created.data!.readinessVerdictId);
    expect(blocked.data?.verdictStatus).toBe('blocked');
  });

  it('can void readiness verdict', async () => {
    const created = await service.createReadinessVerdict(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeVerdictSummary: 'Test void',
    });
    const voided = await service.voidReadinessVerdict(ctx, schoolId, created.data!.readinessVerdictId);
    expect(voided.data?.verdictStatus).toBe('voided');
  });

  it('verdict does NOT execute live action - safe metadata only', async () => {
    const result = await service.createReadinessVerdict(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeVerdictSummary: 'Safe verdict',
      verdictDetailsJson: { readinessScore: 85, recommendation: 'proceed' },
    });
    expect(result.success).toBe(true);
    expect(result.data?.verdictDetailsJson).toBeDefined();
    expect(result.data?.verdictStatus).toBe('draft');
  });

  it('get returns the correct verdict', async () => {
    const created = await service.createReadinessVerdict(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeVerdictSummary: 'Test get',
    });
    const found = await service.getReadinessVerdict(schoolId, created.data!.readinessVerdictId);
    expect(found.success).toBe(true);
    expect(found.data?.safeVerdictSummary).toBe('Test get');
  });
});

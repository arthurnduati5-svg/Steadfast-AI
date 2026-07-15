import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryBlockedActionDiagnosticRepository,
  InMemorySimulationAuditRepository,
  InMemorySimulationIdempotencyRepository,
} from '../repositories/inMemoryRecoveryOutcomeExecutionSimulationRepositories';
import { RecoveryOutcomeExecutionBlockedActionDiagnosticService } from '../services/recoveryOutcomeExecutionBlockedActionDiagnosticService';
import { RecoveryOutcomeExecutionSimulationSafetyService } from '../services/recoveryOutcomeExecutionSimulationSafetyService';
import { RecoveryOutcomeExecutionSimulationAuditBridge } from '../services/recoveryOutcomeExecutionSimulationAuditBridge';
import { RecoveryOutcomeExecutionSimulationIdempotencyService } from '../services/recoveryOutcomeExecutionSimulationIdempotencyService';
import { RecoveryOutcomeExecutionSimulationCommandContext } from '../contracts/recoveryOutcomeExecutionSimulationContracts';

describe('Package 21 - Blocked Action Diagnostic Safety', () => {
  let service: RecoveryOutcomeExecutionBlockedActionDiagnosticService;
  let ctx: RecoveryOutcomeExecutionSimulationCommandContext;
  const schoolId = 'school-1';
  const runId = 'run-1';

  beforeEach(() => {
    const repo = new InMemoryBlockedActionDiagnosticRepository();
    const safety = new RecoveryOutcomeExecutionSimulationSafetyService();
    const auditRepo = new InMemorySimulationAuditRepository();
    const audit = new RecoveryOutcomeExecutionSimulationAuditBridge(auditRepo);
    const idempotencyRepo = new InMemorySimulationIdempotencyRepository();
    const idempotency = new RecoveryOutcomeExecutionSimulationIdempotencyService(idempotencyRepo);
    service = new RecoveryOutcomeExecutionBlockedActionDiagnosticService(repo, safety, audit, idempotency);
    ctx = { schoolId, actorId: 'actor-1', actorRole: 'teacher', correlationId: 'corr-1', idempotencyKey: 'ik-1' };
  });

  it('creates blocked action diagnostic in draft status', async () => {
    const result = await service.createBlockedActionDiagnostic(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      simulationRunId: runId,
      safeDiagnosticSummary: 'Diagnostic test',
    });
    expect(result.success).toBe(true);
    expect(result.data?.diagnosticStatus).toBe('draft');
  });

  it('blocks student role from creating', async () => {
    const studentCtx = { ...ctx, actorRole: 'student' };
    const result = await service.createBlockedActionDiagnostic(studentCtx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeDiagnosticSummary: 'Test',
    });
    expect(result.success).toBe(false);
  });

  it('lists by simulationRunId, planId, and reason', async () => {
    await service.createBlockedActionDiagnostic(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      simulationRunId: runId,
      safeDiagnosticSummary: 'Test list',
      blockedReasonCodesJson: ['POLICY_VIOLATION'],
    });
    const runList = await service.listDiagnosticsForSimulationRun(runId);
    expect(runList.data?.length).toBeGreaterThanOrEqual(1);
    const planList = await service.listDiagnosticsForPlan(schoolId, 'plan-1');
    expect(planList.data?.length).toBeGreaterThanOrEqual(1);
    const reasonList = await service.listDiagnosticsByReason(schoolId, 'POLICY_VIOLATION');
    expect(reasonList.data?.length).toBeGreaterThanOrEqual(1);
  });

  it('marks diagnostic review ready', async () => {
    const created = await service.createBlockedActionDiagnostic(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeDiagnosticSummary: 'Test review',
    });
    const reviewReady = await service.markDiagnosticReviewReady(ctx, schoolId, created.data!.blockedActionDiagnosticId);
    expect(reviewReady.success).toBe(true);
    expect(reviewReady.data?.diagnosticStatus).toBe('review_ready');
  });

  it('can suppress diagnostic', async () => {
    const created = await service.createBlockedActionDiagnostic(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeDiagnosticSummary: 'Test suppress',
    });
    const suppressed = await service.suppressDiagnostic(ctx, schoolId, created.data!.blockedActionDiagnosticId);
    expect(suppressed.data?.diagnosticStatus).toBe('suppressed');
  });

  it('voids diagnostic', async () => {
    const created = await service.createBlockedActionDiagnostic(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeDiagnosticSummary: 'Test void',
    });
    const voided = await service.voidDiagnostic(ctx, schoolId, created.data!.blockedActionDiagnosticId);
    expect(voided.data?.diagnosticStatus).toBe('voided');
  });

  it('does NOT auto-unblock actions - metadata only', async () => {
    const result = await service.createBlockedActionDiagnostic(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeDiagnosticSummary: 'Safe diagnostic',
      diagnosticDetailsJson: { reason: 'timeout', severity: 'high' },
    });
    expect(result.success).toBe(true);
    expect(result.data?.diagnosticStatus).toBe('draft');
  });

  it('get returns the correct diagnostic', async () => {
    const created = await service.createBlockedActionDiagnostic(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeDiagnosticSummary: 'Test get',
    });
    const found = await service.getBlockedActionDiagnostic(schoolId, created.data!.blockedActionDiagnosticId);
    expect(found.success).toBe(true);
    expect(found.data?.safeDiagnosticSummary).toBe('Test get');
  });
});

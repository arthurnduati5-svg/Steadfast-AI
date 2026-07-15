import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryEligibilityCheckRepository,
  InMemorySimulationAuditRepository,
  InMemorySimulationIdempotencyRepository,
} from '../repositories/inMemoryRecoveryOutcomeExecutionSimulationRepositories';
import { RecoveryOutcomeExecutionEligibilityService } from '../services/recoveryOutcomeExecutionEligibilityService';
import { RecoveryOutcomeExecutionSimulationSafetyService } from '../services/recoveryOutcomeExecutionSimulationSafetyService';
import { RecoveryOutcomeExecutionSimulationAuditBridge } from '../services/recoveryOutcomeExecutionSimulationAuditBridge';
import { RecoveryOutcomeExecutionSimulationIdempotencyService } from '../services/recoveryOutcomeExecutionSimulationIdempotencyService';
import { RecoveryOutcomeExecutionSimulationCommandContext } from '../contracts/recoveryOutcomeExecutionSimulationContracts';

describe('Package 21 - Eligibility Check Safety', () => {
  let service: RecoveryOutcomeExecutionEligibilityService;
  let ctx: RecoveryOutcomeExecutionSimulationCommandContext;
  const schoolId = 'school-1';

  beforeEach(() => {
    const repo = new InMemoryEligibilityCheckRepository();
    const safety = new RecoveryOutcomeExecutionSimulationSafetyService();
    const auditRepo = new InMemorySimulationAuditRepository();
    const audit = new RecoveryOutcomeExecutionSimulationAuditBridge(auditRepo);
    const idempotencyRepo = new InMemorySimulationIdempotencyRepository();
    const idempotency = new RecoveryOutcomeExecutionSimulationIdempotencyService(idempotencyRepo);
    service = new RecoveryOutcomeExecutionEligibilityService(repo, safety, audit, idempotency);
    ctx = { schoolId, actorId: 'actor-1', actorRole: 'teacher', correlationId: 'corr-1', idempotencyKey: 'ik-1' };
  });

  it('creates eligibility check in pending status', async () => {
    const result = await service.createEligibilityCheck(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeEligibilitySummary: 'Eligibility test',
    });
    expect(result.success).toBe(true);
    expect(result.data?.eligibilityStatus).toBe('pending');
  });

  it('blocks student role from creating', async () => {
    const studentCtx = { ...ctx, actorRole: 'student' };
    const result = await service.createEligibilityCheck(studentCtx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeEligibilitySummary: 'Test',
    });
    expect(result.success).toBe(false);
  });

  it('lists by plan, actionBundleId, and result', async () => {
    await service.createEligibilityCheck(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      recoveryOutcomeActionBundleId: 'bundle-1',
      safeEligibilitySummary: 'Test list',
    });
    const planList = await service.listEligibilityChecksForPlan(schoolId, 'plan-1');
    expect(planList.data?.length).toBeGreaterThanOrEqual(1);
    const bundleList = await service.listEligibilityChecksForActionBundle(schoolId, 'bundle-1');
    expect(bundleList.data?.length).toBeGreaterThanOrEqual(1);
    const resultList = await service.listEligibilityChecksByResult(schoolId, 'pending');
    expect(resultList.data?.length).toBeGreaterThanOrEqual(1);
  });

  it('marks eligibility check review ready', async () => {
    const created = await service.createEligibilityCheck(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeEligibilitySummary: 'Test review',
    });
    const reviewReady = await service.markEligibilityCheckReviewReady(ctx, schoolId, created.data!.eligibilityCheckId);
    expect(reviewReady.success).toBe(true);
    expect(reviewReady.data?.eligibilityStatus).toBe('review_ready');
  });

  it('voids eligibility check', async () => {
    const created = await service.createEligibilityCheck(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeEligibilitySummary: 'Test void',
    });
    const voided = await service.voidEligibilityCheck(ctx, schoolId, created.data!.eligibilityCheckId);
    expect(voided.data?.eligibilityStatus).toBe('voided');
  });

  it('does not execute any action - safe metadata only', async () => {
    const result = await service.createEligibilityCheck(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeEligibilitySummary: 'Safe check',
      eligibilityChecksJson: { criteria: ['attendance', 'grade_level'] },
    });
    expect(result.success).toBe(true);
    expect(result.data?.eligibilityChecksJson).toBeDefined();
    expect(result.data?.eligibilityStatus).toBe('pending');
  });

  it('get returns the correct eligibility check', async () => {
    const created = await service.createEligibilityCheck(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeEligibilitySummary: 'Test get',
    });
    const found = await service.getEligibilityCheck(schoolId, created.data!.eligibilityCheckId);
    expect(found.success).toBe(true);
    expect(found.data?.safeEligibilitySummary).toBe('Test get');
  });
});

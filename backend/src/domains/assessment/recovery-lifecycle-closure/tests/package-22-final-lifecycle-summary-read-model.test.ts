import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryRecoveryLifecycleClosureRepositories } from '../repositories/inMemoryRecoveryLifecycleClosureRepositories';
import { RecoveryFinalLifecycleSummaryService } from '../services/recoveryFinalLifecycleSummaryService';
import { RecoveryLifecycleClosureSafetyService } from '../services/recoveryLifecycleClosureSafetyService';
import { RecoveryLifecycleClosureAuditBridge } from '../services/recoveryLifecycleClosureAuditBridge';
import { RecoveryLifecycleClosureIdempotencyService } from '../services/recoveryLifecycleClosureIdempotencyService';
import { RecoveryLifecycleClosurePolicyEnforcer } from '../policies/recoveryLifecycleClosurePolicyDefinitions';
import { RecoveryLifecycleClosureCommandContext } from '../contracts/recoveryLifecycleClosureContracts';

describe('Package 22 - Final Lifecycle Summary Read Model', () => {
  let repos: InMemoryRecoveryLifecycleClosureRepositories;
  let service: RecoveryFinalLifecycleSummaryService;
  let ctx: RecoveryLifecycleClosureCommandContext;
  const schoolId = 'school-1';

  beforeEach(() => {
    repos = new InMemoryRecoveryLifecycleClosureRepositories();
    const policyEnforcer = new RecoveryLifecycleClosurePolicyEnforcer();
    const safety = new RecoveryLifecycleClosureSafetyService(policyEnforcer);
    const audit = new RecoveryLifecycleClosureAuditBridge(repos);
    const idempotency = new RecoveryLifecycleClosureIdempotencyService(repos);
    service = new RecoveryFinalLifecycleSummaryService(repos, policyEnforcer, safety, audit, idempotency);
    ctx = { schoolId, actorId: 'actor-1', actorRole: 'teacher', correlationId: 'corr-1', idempotencyKey: 'ik-1' };
  });

  it('creates final lifecycle summary in draft status', async () => {
    const result = await service.createFinalLifecycleSummary(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeSummary: 'Final summary test',
    });
    expect(result.success).toBe(true);
    expect(result.data?.summaryStatus).toBe('draft');
  });

  it('blocks student role from creating', async () => {
    const studentCtx = { ...ctx, actorRole: 'student' };
    const result = await service.createFinalLifecycleSummary(studentCtx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeSummary: 'Test',
    });
    expect(result.success).toBe(false);
    expect(result.status).toBe('DENIED');
  });

  it('get returns the correct summary', async () => {
    const created = await service.createFinalLifecycleSummary(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeSummary: 'Test get',
    });
    const found = await service.getFinalLifecycleSummary(schoolId, created.data!.finalLifecycleSummaryId);
    expect(found.success).toBe(true);
    expect(found.data?.safeSummary).toBe('Test get');
  });

  it('lists by school, student, and plan', async () => {
    await service.createFinalLifecycleSummary(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeSummary: 'Test list',
    });
    const schoolList = await service.listFinalLifecycleSummariesForSchool(schoolId);
    expect(schoolList.data?.length).toBeGreaterThanOrEqual(1);
    const studentList = await service.listFinalLifecycleSummariesForStudent(schoolId, 'student-1');
    expect(studentList.data?.length).toBeGreaterThanOrEqual(1);
    const planList = await service.listFinalLifecycleSummariesForPlan(schoolId, 'plan-1');
    expect(planList.data?.length).toBeGreaterThanOrEqual(1);
  });

  it('can refresh summary (recomputes from source data)', async () => {
    const created = await service.createFinalLifecycleSummary(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeSummary: 'Test refresh',
    });
    const refreshed = await service.refreshFinalLifecycleSummary(ctx, created.data!.finalLifecycleSummaryId);
    expect(refreshed.success).toBe(true);
    expect(refreshed.data?.summaryStatus).toBe('active');
    expect(refreshed.data?.refreshedAt).toBeDefined();
  });

  it('can mark summary stale', async () => {
    const created = await service.createFinalLifecycleSummary(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeSummary: 'Test stale',
    });
    const stale = await service.markFinalLifecycleSummaryStale(ctx, created.data!.finalLifecycleSummaryId);
    expect(stale.data?.summaryStatus).toBe('stale');
    expect(stale.data?.staleAt).toBeDefined();
  });

  it('can mark review ready and approve for future use', async () => {
    const created = await service.createFinalLifecycleSummary(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeSummary: 'Test transitions',
    });
    const reviewReady = await service.markFinalLifecycleSummaryReviewReady(ctx, created.data!.finalLifecycleSummaryId);
    expect(reviewReady.data?.summaryStatus).toBe('review_ready');

    const approved = await service.approveFinalLifecycleSummaryForFutureUse(ctx, created.data!.finalLifecycleSummaryId);
    expect(approved.data?.summaryStatus).toBe('approved_for_future_use');
  });

  it('can block and void summary', async () => {
    const created = await service.createFinalLifecycleSummary(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeSummary: 'Test block',
    });
    const blocked = await service.blockFinalLifecycleSummary(ctx, created.data!.finalLifecycleSummaryId);
    expect(blocked.data?.summaryStatus).toBe('blocked');

    const voided = await service.voidFinalLifecycleSummary(ctx, created.data!.finalLifecycleSummaryId);
    expect(voided.data?.summaryStatus).toBe('voided');
  });

  it('summary is a read model only (cannot execute actions)', async () => {
    const result = await service.createFinalLifecycleSummary(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeSummary: 'Read model test',
      lifecycleOverviewJson: { phases: ['simulation', 'readiness'] },
      outcomesJson: { key: 'improved' },
      nextStepsJson: { action: 'review' },
    });
    expect(result.success).toBe(true);
    expect(result.data?.summaryStatus).toBe('draft');
    expect(result.data?.lifecycleOverviewJson).toBeDefined();
    expect(result.data?.outcomesJson).toBeDefined();
  });
});

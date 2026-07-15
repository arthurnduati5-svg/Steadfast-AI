import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryRecoveryLifecycleClosureRepositories } from '../repositories/inMemoryRecoveryLifecycleClosureRepositories';
import { RecoveryNextCycleRecommendationService } from '../services/recoveryNextCycleRecommendationService';
import { RecoveryLifecycleClosureSafetyService } from '../services/recoveryLifecycleClosureSafetyService';
import { RecoveryLifecycleClosureAuditBridge } from '../services/recoveryLifecycleClosureAuditBridge';
import { RecoveryLifecycleClosureIdempotencyService } from '../services/recoveryLifecycleClosureIdempotencyService';
import { RecoveryLifecycleClosurePolicyEnforcer } from '../policies/recoveryLifecycleClosurePolicyDefinitions';
import { RecoveryLifecycleClosureCommandContext } from '../contracts/recoveryLifecycleClosureContracts';

describe('Package 22 - Next Cycle Recommendation Safety', () => {
  let repos: InMemoryRecoveryLifecycleClosureRepositories;
  let service: RecoveryNextCycleRecommendationService;
  let ctx: RecoveryLifecycleClosureCommandContext;
  const schoolId = 'school-1';

  beforeEach(() => {
    repos = new InMemoryRecoveryLifecycleClosureRepositories();
    const policyEnforcer = new RecoveryLifecycleClosurePolicyEnforcer();
    const safety = new RecoveryLifecycleClosureSafetyService(policyEnforcer);
    const audit = new RecoveryLifecycleClosureAuditBridge(repos);
    const idempotency = new RecoveryLifecycleClosureIdempotencyService(repos);
    service = new RecoveryNextCycleRecommendationService(repos, policyEnforcer, safety, audit, idempotency);
    ctx = { schoolId, actorId: 'actor-1', actorRole: 'teacher', correlationId: 'corr-1', idempotencyKey: 'ik-1' };
  });

  it('creates recommendation draft in draft status', async () => {
    const result = await service.createNextCycleRecommendationDraft(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      recommendationType: 'focus_area',
      safeRecommendationSummary: 'Next cycle recommendation test',
    });
    expect(result.success).toBe(true);
    expect(result.data?.recommendationStatus).toBe('draft');
  });

  it('blocks student role from creating', async () => {
    const studentCtx = { ...ctx, actorRole: 'student' };
    const result = await service.createNextCycleRecommendationDraft(studentCtx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      recommendationType: 'focus_area',
      safeRecommendationSummary: 'Test',
    });
    expect(result.success).toBe(false);
    expect(result.status).toBe('DENIED');
  });

  it('blocks parent role from creating', async () => {
    const parentCtx = { ...ctx, actorRole: 'parent' };
    const result = await service.createNextCycleRecommendationDraft(parentCtx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      recommendationType: 'focus_area',
      safeRecommendationSummary: 'Test',
    });
    expect(result.success).toBe(false);
  });

  it('does NOT assign work (no assignment fields present)', async () => {
    const result = await service.createNextCycleRecommendationDraft(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      recommendationType: 'focus_area',
      safeRecommendationSummary: 'No assignment',
    });
    expect(result.success).toBe(true);
    expect((result.data as any)?.assignmentId).toBeUndefined();
    expect((result.data as any)?.homeworkPayload).toBeUndefined();
    expect((result.data as any)?.practiceTaskPayload).toBeUndefined();
  });

  it('transitions from draft to review_ready to approved_for_future_use', async () => {
    const created = await service.createNextCycleRecommendationDraft(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      recommendationType: 'focus_area',
      safeRecommendationSummary: 'Test lifecycle',
    });
    expect(created.data?.recommendationStatus).toBe('draft');

    const reviewReady = await service.markNextCycleRecommendationReviewReady(ctx, created.data!.nextCycleRecommendationId);
    expect(reviewReady.success).toBe(true);
    expect(reviewReady.data?.recommendationStatus).toBe('review_ready');

    const approved = await service.approveNextCycleRecommendationForFutureUse(ctx, created.data!.nextCycleRecommendationId);
    expect(approved.success).toBe(true);
    expect(approved.data?.recommendationStatus).toBe('approved_for_future_use');
  });

  it('can suppress, block, and void recommendation', async () => {
    const created = await service.createNextCycleRecommendationDraft(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      recommendationType: 'focus_area',
      safeRecommendationSummary: 'Test',
    });
    const id = created.data!.nextCycleRecommendationId;

    const suppressed = await service.suppressNextCycleRecommendation(ctx, id);
    expect(suppressed.data?.recommendationStatus).toBe('suppressed');
  });

  it('can list by type and status', async () => {
    await service.createNextCycleRecommendationDraft(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      recommendationType: 'focus_area',
      safeRecommendationSummary: 'Test list',
    });
    const typeList = await service.listNextCycleRecommendationDraftsByType(schoolId, 'focus_area');
    expect(typeList.data?.length).toBeGreaterThanOrEqual(1);
  });

  it('get returns the correct recommendation', async () => {
    const created = await service.createNextCycleRecommendationDraft(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      recommendationType: 'focus_area',
      safeRecommendationSummary: 'Test get',
    });
    const found = await service.getNextCycleRecommendationDraft(schoolId, created.data!.nextCycleRecommendationId);
    expect(found.success).toBe(true);
    expect(found.data?.safeRecommendationSummary).toBe('Test get');
  });
});

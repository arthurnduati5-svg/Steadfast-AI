import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryRecoveryLifecycleClosureRepositories } from '../repositories/inMemoryRecoveryLifecycleClosureRepositories';
import { RecoveryStakeholderClosureDraftService } from '../services/recoveryStakeholderClosureDraftService';
import { RecoveryLifecycleClosureSafetyService } from '../services/recoveryLifecycleClosureSafetyService';
import { RecoveryLifecycleClosureAuditBridge } from '../services/recoveryLifecycleClosureAuditBridge';
import { RecoveryLifecycleClosureIdempotencyService } from '../services/recoveryLifecycleClosureIdempotencyService';
import { RecoveryLifecycleClosurePolicyEnforcer } from '../policies/recoveryLifecycleClosurePolicyDefinitions';
import { RecoveryLifecycleClosureCommandContext } from '../contracts/recoveryLifecycleClosureContracts';

describe('Package 22 - Student & Parent Closure Drafts Safety', () => {
  let repos: InMemoryRecoveryLifecycleClosureRepositories;
  let service: RecoveryStakeholderClosureDraftService;
  let ctx: RecoveryLifecycleClosureCommandContext;
  const schoolId = 'school-1';

  beforeEach(() => {
    repos = new InMemoryRecoveryLifecycleClosureRepositories();
    const policyEnforcer = new RecoveryLifecycleClosurePolicyEnforcer();
    const safety = new RecoveryLifecycleClosureSafetyService(policyEnforcer);
    const audit = new RecoveryLifecycleClosureAuditBridge(repos);
    const idempotency = new RecoveryLifecycleClosureIdempotencyService(repos);
    service = new RecoveryStakeholderClosureDraftService(repos, policyEnforcer, safety, audit, idempotency);
    ctx = { schoolId, actorId: 'actor-1', actorRole: 'teacher', correlationId: 'corr-1', idempotencyKey: 'ik-1' };
  });

  it('creates student closure reflection draft in draft status', async () => {
    const result = await service.createStudentClosureReflectionDraft(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeStudentReflectionSummary: 'Student reflection test',
    });
    expect(result.success).toBe(true);
    expect(result.data?.draftStatus).toBe('draft');
  });

  it('creates parent closure guidance draft in draft status', async () => {
    const result = await service.createParentClosureGuidanceDraft(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeParentGuidanceSummary: 'Parent guidance test',
    });
    expect(result.success).toBe(true);
    expect(result.data?.draftStatus).toBe('draft');
  });

  it('student closure reflection is safe and Socratic', async () => {
    const result = await service.createStudentClosureReflectionDraft(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeStudentReflectionSummary: 'Socratic reflection',
      reflectionContentJson: { type: 'closure_reflection', tone: 'socratic' },
    });
    expect(result.success).toBe(true);
    expect(result.data?.draftStatus).toBe('draft');
    expect(result.data?.reflectionContentJson).toBeDefined();
  });

  it('parent closure guidance is parent-safe', async () => {
    const result = await service.createParentClosureGuidanceDraft(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeParentGuidanceSummary: 'Parent guidance',
      guidanceContentJson: { type: 'guidance', audience: 'parent' },
    });
    expect(result.success).toBe(true);
    expect(result.data?.draftStatus).toBe('draft');
    expect(result.data?.guidanceContentJson).toBeDefined();
  });

  it('student closure does NOT send notification to student', async () => {
    const result = await service.createStudentClosureReflectionDraft(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeStudentReflectionSummary: 'No notify',
    });
    expect(result.success).toBe(true);
    expect((result.data as any)?.studentNotificationPayload).toBeUndefined();
    expect((result.data as any)?.emailPayload).toBeUndefined();
    expect((result.data as any)?.smsPayload).toBeUndefined();
  });

  it('parent closure does NOT send notification to parent', async () => {
    const result = await service.createParentClosureGuidanceDraft(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeParentGuidanceSummary: 'No notify',
    });
    expect(result.success).toBe(true);
    expect((result.data as any)?.parentNotificationPayload).toBeUndefined();
    expect((result.data as any)?.emailPayload).toBeUndefined();
    expect((result.data as any)?.pushPayload).toBeUndefined();
  });

  it('student drafts never go beyond review_ready (not sent/published)', async () => {
    const created = await service.createStudentClosureReflectionDraft(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeStudentReflectionSummary: 'No sent',
    });
    expect(created.data?.draftStatus).toBe('draft');

    const reviewReady = await service.markStudentClosureReflectionReviewReady(ctx, created.data!.studentClosureReflectionDraftId);
    expect(reviewReady.data?.draftStatus).toBe('review_ready');

    const approved = await service.approveStudentClosureReflectionForFutureUse(ctx, created.data!.studentClosureReflectionDraftId);
    expect(approved.data?.draftStatus).toBe('approved_for_future_use');

    expect(approved.data?.draftStatus).not.toMatch(/sent/);
    expect(approved.data?.draftStatus).not.toMatch(/published/);
  });

  it('parent drafts never go beyond review_ready (not sent/published)', async () => {
    const created = await service.createParentClosureGuidanceDraft(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeParentGuidanceSummary: 'No sent',
    });
    expect(created.data?.draftStatus).toBe('draft');

    const reviewReady = await service.markParentClosureGuidanceReviewReady(ctx, created.data!.parentClosureGuidanceDraftId);
    expect(reviewReady.data?.draftStatus).toBe('review_ready');

    const approved = await service.approveParentClosureGuidanceForFutureUse(ctx, created.data!.parentClosureGuidanceDraftId);
    expect(approved.data?.draftStatus).toBe('approved_for_future_use');

    expect(approved.data?.draftStatus).not.toMatch(/sent/);
    expect(approved.data?.draftStatus).not.toMatch(/published/);
  });

  it('can suppress, block, void student draft', async () => {
    const created = await service.createStudentClosureReflectionDraft(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeStudentReflectionSummary: 'Test',
    });
    const id = created.data!.studentClosureReflectionDraftId;

    const suppressed = await service.suppressStudentClosureReflection(ctx, id);
    expect(suppressed.data?.draftStatus).toBe('suppressed');
  });

  it('can suppress, block, void parent draft', async () => {
    const created = await service.createParentClosureGuidanceDraft(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeParentGuidanceSummary: 'Test',
    });
    const id = created.data!.parentClosureGuidanceDraftId;

    const blocked = await service.blockParentClosureGuidance(ctx, id);
    expect(blocked.data?.draftStatus).toBe('blocked');

    const voided = await service.voidParentClosureGuidance(ctx, id);
    expect(voided.data?.draftStatus).toBe('voided');
  });

  it('get returns correct student draft', async () => {
    const created = await service.createStudentClosureReflectionDraft(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeStudentReflectionSummary: 'Test get',
    });
    const found = await service.getStudentClosureReflectionDraft(schoolId, created.data!.studentClosureReflectionDraftId);
    expect(found.success).toBe(true);
    expect(found.data?.safeStudentReflectionSummary).toBe('Test get');
  });

  it('get returns correct parent draft', async () => {
    const created = await service.createParentClosureGuidanceDraft(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeParentGuidanceSummary: 'Test parent get',
    });
    const found = await service.getParentClosureGuidanceDraft(schoolId, created.data!.parentClosureGuidanceDraftId);
    expect(found.success).toBe(true);
    expect(found.data?.safeParentGuidanceSummary).toBe('Test parent get');
  });

  it('lists student drafts by plan and status', async () => {
    await service.createStudentClosureReflectionDraft(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeStudentReflectionSummary: 'Test list',
    });
    const planList = await service.listStudentClosureReflectionDraftsForPlan(schoolId, 'plan-1');
    expect(planList.data?.length).toBeGreaterThanOrEqual(1);
    const statusList = await service.listStudentClosureReflectionDraftsByStatus(schoolId, 'draft');
    expect(statusList.data?.length).toBeGreaterThanOrEqual(1);
  });

  it('lists parent drafts by plan and status', async () => {
    await service.createParentClosureGuidanceDraft(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeParentGuidanceSummary: 'Test list',
    });
    const planList = await service.listParentClosureGuidanceDraftsForPlan(schoolId, 'plan-1');
    expect(planList.data?.length).toBeGreaterThanOrEqual(1);
    const statusList = await service.listParentClosureGuidanceDraftsByStatus(schoolId, 'draft');
    expect(statusList.data?.length).toBeGreaterThanOrEqual(1);
  });
});

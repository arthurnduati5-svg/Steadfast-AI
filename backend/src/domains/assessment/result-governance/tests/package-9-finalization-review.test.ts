import { describe, it, expect, beforeEach } from 'vitest';
import { ResultFinalizationReviewService } from '../services/resultFinalizationReviewService';
import { InMemoryResultFinalizationReviewRepository } from '../repositories/inMemoryResultGovernanceRepositories';
import { ResultGovernancePolicyRegistry } from '../policies/resultGovernancePolicyDefinitions';

describe('Package 9 - Finalization Review', () => {
  let reviewRepo: InMemoryResultFinalizationReviewRepository;
  let policyRegistry: ResultGovernancePolicyRegistry;
  let reviewService: ResultFinalizationReviewService;

  beforeEach(() => {
    reviewRepo = new InMemoryResultFinalizationReviewRepository();
    policyRegistry = new ResultGovernancePolicyRegistry();
    reviewService = new ResultFinalizationReviewService(reviewRepo, policyRegistry);
  });

  it('should create a finalization review from result-version refs', async () => {
    const review = await reviewService.createFinalizationReview({
      schoolId: 'school-1',
      markingInvocationRequestId: 'mir-1',
      markingRunId: 'mr-1',
      reviewMode: 'teacher_reviewed',
      reviewedResultVersionRefs: { versionIds: ['mrv-1', 'mrv-2'] },
      requiredCheckRefs: { teacherReviewUnresolved: false, moderationUnresolved: false },
      safeReviewSummary: 'Review of exam results',
      actorId: 'actor-1',
      actorRole: 'teacher',
    }, 'corr-1');

    expect(review).toBeDefined();
    expect(review.schoolId).toBe('school-1');
    expect(review.reviewStatus).toBe('draft');
    expect(review.markingInvocationRequestId).toBe('mir-1');
    expect(review.markingRunId).toBe('mr-1');
    expect(review.createdByActorId).toBe('actor-1');
    expect(review.resultFinalizationReviewId).toBeTruthy();
  });

  it('should block creation without schoolId', async () => {
    await expect(reviewService.createFinalizationReview({
      schoolId: '',
      markingInvocationRequestId: 'mir-1',
      reviewMode: 'teacher_reviewed',
      reviewedResultVersionRefs: { versionIds: ['mrv-1'] },
      safeReviewSummary: 'test',
      actorId: 'actor-1',
      actorRole: 'teacher',
    }, 'corr-1')).rejects.toThrow('SCHOOL_CONTEXT_REQUIRED');
  });

  it('should block creation with student role', async () => {
    await expect(reviewService.createFinalizationReview({
      schoolId: 'school-1',
      markingInvocationRequestId: 'mir-1',
      reviewMode: 'teacher_reviewed',
      reviewedResultVersionRefs: { versionIds: ['mrv-1'] },
      safeReviewSummary: 'test',
      actorId: 'student-1',
      actorRole: 'student',
    }, 'corr-1')).rejects.toThrow('FORBIDDEN');
  });

  it('should block creation without result-version refs', async () => {
    await expect(reviewService.createFinalizationReview({
      schoolId: 'school-1',
      markingInvocationRequestId: 'mir-1',
      reviewMode: 'teacher_reviewed',
      reviewedResultVersionRefs: undefined as any,
      safeReviewSummary: 'test',
      actorId: 'actor-1',
      actorRole: 'teacher',
    }, 'corr-1')).rejects.toThrow('VALIDATION_FAILED');
  });

  it('should block creation without markingInvocationRequestId or markingRunId', async () => {
    await expect(reviewService.createFinalizationReview({
      schoolId: 'school-1',
      reviewMode: 'teacher_reviewed',
      reviewedResultVersionRefs: { versionIds: ['mrv-1'] },
      safeReviewSummary: 'test',
      actorId: 'actor-1',
      actorRole: 'teacher',
    }, 'corr-1')).rejects.toThrow('VALIDATION_FAILED');
  });

  it('should run readiness checks that pass', async () => {
    const review = await reviewService.createFinalizationReview({
      schoolId: 'school-1',
      markingInvocationRequestId: 'mir-1',
      reviewMode: 'teacher_reviewed',
      reviewedResultVersionRefs: { versionIds: ['mrv-1'] },
      requiredCheckRefs: { teacherReviewUnresolved: false, moderationUnresolved: false },
      safeReviewSummary: 'Review ready',
      actorId: 'actor-1',
      actorRole: 'teacher',
    }, 'corr-1');

    const checks = await reviewService.runFinalizationReadinessChecks(review.resultFinalizationReviewId, 'teacher');
    expect(checks.allChecksPassed).toBe(true);
    expect(checks.teacherReviewUnresolved).toBe(false);
    expect(checks.moderationUnresolved).toBe(false);
    expect(checks.missingResultVersionRefs).toBe(false);
  });

  it('should detect unresolved teacher review', async () => {
    const review = await reviewService.createFinalizationReview({
      schoolId: 'school-1',
      markingInvocationRequestId: 'mir-1',
      reviewMode: 'teacher_reviewed',
      reviewedResultVersionRefs: { versionIds: ['mrv-1'] },
      requiredCheckRefs: { teacherReviewUnresolved: true, moderationUnresolved: false },
      safeReviewSummary: 'Review with unresolved teacher review',
      actorId: 'actor-1',
      actorRole: 'teacher',
    }, 'corr-1');

    const checks = await reviewService.runFinalizationReadinessChecks(review.resultFinalizationReviewId, 'teacher');
    expect(checks.allChecksPassed).toBe(false);
    expect(checks.teacherReviewUnresolved).toBe(true);
    expect(checks.blockingReasonCodes).toContain('TEACHER_REVIEW_UNRESOLVED');
  });

  it('should detect unresolved moderation', async () => {
    const review = await reviewService.createFinalizationReview({
      schoolId: 'school-1',
      markingInvocationRequestId: 'mir-1',
      reviewMode: 'teacher_reviewed',
      reviewedResultVersionRefs: { versionIds: ['mrv-1'] },
      requiredCheckRefs: { teacherReviewUnresolved: false, moderationUnresolved: true },
      safeReviewSummary: 'Review with unresolved moderation',
      actorId: 'actor-1',
      actorRole: 'teacher',
    }, 'corr-1');

    const checks = await reviewService.runFinalizationReadinessChecks(review.resultFinalizationReviewId, 'teacher');
    expect(checks.allChecksPassed).toBe(false);
    expect(checks.moderationUnresolved).toBe(true);
    expect(checks.blockingReasonCodes).toContain('MODERATION_UNRESOLVED');
  });

  it('should mark review ready for decision when checks pass', async () => {
    const review = await reviewService.createFinalizationReview({
      schoolId: 'school-1',
      markingInvocationRequestId: 'mir-1',
      reviewMode: 'teacher_reviewed',
      reviewedResultVersionRefs: { versionIds: ['mrv-1'] },
      requiredCheckRefs: { teacherReviewUnresolved: false, moderationUnresolved: false },
      safeReviewSummary: 'Ready review',
      actorId: 'actor-1',
      actorRole: 'teacher',
    }, 'corr-1');

    const ready = await reviewService.markReviewReadyForDecision(review.resultFinalizationReviewId, 'teacher');
    expect(ready?.reviewStatus).toBe('ready_for_decision');
  });

  it('should block ready-for-decision when checks fail', async () => {
    const review = await reviewService.createFinalizationReview({
      schoolId: 'school-1',
      markingInvocationRequestId: 'mir-1',
      reviewMode: 'teacher_reviewed',
      reviewedResultVersionRefs: {},
      requiredCheckRefs: { teacherReviewUnresolved: true },
      safeReviewSummary: 'Failing review',
      actorId: 'actor-1',
      actorRole: 'teacher',
    }, 'corr-1');

    await expect(reviewService.markReviewReadyForDecision(review.resultFinalizationReviewId, 'teacher')).rejects.toThrow('FINALIZATION_BLOCKED');
  });

  it('should block a review', async () => {
    const review = await reviewService.createFinalizationReview({
      schoolId: 'school-1',
      markingInvocationRequestId: 'mir-1',
      reviewMode: 'teacher_reviewed',
      reviewedResultVersionRefs: { versionIds: ['mrv-1'] },
      safeReviewSummary: 'Blockable review',
      actorId: 'actor-1',
      actorRole: 'teacher',
    }, 'corr-1');

    const blocked = await reviewService.blockFinalizationReview(review.resultFinalizationReviewId, 'teacher');
    expect(blocked?.reviewStatus).toBe('blocked');
    expect(blocked?.blockedAt).toBeTruthy();
  });

  it('should cancel a review', async () => {
    const review = await reviewService.createFinalizationReview({
      schoolId: 'school-1',
      markingInvocationRequestId: 'mir-1',
      reviewMode: 'teacher_reviewed',
      reviewedResultVersionRefs: { versionIds: ['mrv-1'] },
      safeReviewSummary: 'Cancellable review',
      actorId: 'actor-1',
      actorRole: 'teacher',
    }, 'corr-1');

    const cancelled = await reviewService.cancelFinalizationReview(review.resultFinalizationReviewId, 'teacher');
    expect(cancelled?.reviewStatus).toBe('cancelled');
  });

  it('should complete a review', async () => {
    const review = await reviewService.createFinalizationReview({
      schoolId: 'school-1',
      markingInvocationRequestId: 'mir-1',
      reviewMode: 'teacher_reviewed',
      reviewedResultVersionRefs: { versionIds: ['mrv-1'] },
      safeReviewSummary: 'Completable review',
      actorId: 'actor-1',
      actorRole: 'teacher',
    }, 'corr-1');

    const completed = await reviewService.completeFinalizationReview(review.resultFinalizationReviewId, 'teacher');
    expect(completed?.reviewStatus).toBe('completed');
    expect(completed?.completedAt).toBeTruthy();
  });

  it('should list reviews for school', async () => {
    await reviewService.createFinalizationReview({
      schoolId: 'school-1', markingInvocationRequestId: 'mir-1',
      reviewMode: 'teacher_reviewed', reviewedResultVersionRefs: { v: ['1'] },
      safeReviewSummary: 'R1', actorId: 'a1', actorRole: 'teacher',
    }, 'c1');
    await reviewService.createFinalizationReview({
      schoolId: 'school-1', markingRunId: 'mr-1',
      reviewMode: 'teacher_reviewed', reviewedResultVersionRefs: { v: ['2'] },
      safeReviewSummary: 'R2', actorId: 'a2', actorRole: 'teacher',
    }, 'c2');

    const list = await reviewService.listFinalizationReviewsForSchool('school-1');
    expect(list.length).toBe(2);
  });

  it('should list reviews for marking run', async () => {
    await reviewService.createFinalizationReview({
      schoolId: 'school-1', markingRunId: 'mr-1',
      reviewMode: 'teacher_reviewed', reviewedResultVersionRefs: { v: ['1'] },
      safeReviewSummary: 'R1', actorId: 'a1', actorRole: 'teacher',
    }, 'c1');

    const list = await reviewService.listFinalizationReviewsForMarkingRun('mr-1');
    expect(list.length).toBe(1);
  });

  it('should not publish results', async () => {
    const review = await reviewService.createFinalizationReview({
      schoolId: 'school-1', markingInvocationRequestId: 'mir-1',
      reviewMode: 'teacher_reviewed', reviewedResultVersionRefs: { v: ['1'] },
      safeReviewSummary: 'No publish test', actorId: 'a1', actorRole: 'teacher',
    }, 'c1');

    expect((review as any).parentDeliveryPayload).toBeUndefined();
    expect((review as any).parentNotification).toBeUndefined();
  });

  it('should not release to parent', async () => {
    const review = await reviewService.createFinalizationReview({
      schoolId: 'school-1', markingInvocationRequestId: 'mir-1',
      reviewMode: 'teacher_reviewed', reviewedResultVersionRefs: { v: ['1'] },
      safeReviewSummary: 'No parent test', actorId: 'a1', actorRole: 'teacher',
    }, 'c1');

    expect((review as any).parentSummary).toBeUndefined();
    expect((review as any).parentPortalPublished).toBeUndefined();
  });

  it('should not mutate mastery', async () => {
    const review = await reviewService.createFinalizationReview({
      schoolId: 'school-1', markingInvocationRequestId: 'mir-1',
      reviewMode: 'teacher_reviewed', reviewedResultVersionRefs: { v: ['1'] },
      safeReviewSummary: 'No mastery test', actorId: 'a1', actorRole: 'teacher',
    }, 'c1');

    expect((review as any).masterySnapshot).toBeUndefined();
    expect((review as any).skillMasteryUpdated).toBeUndefined();
  });
});

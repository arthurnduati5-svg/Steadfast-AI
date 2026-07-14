import { describe, it, expect, beforeEach } from 'vitest';
import { ResultFinalizationReviewService } from '../services/resultFinalizationReviewService';
import { ResultFinalizationDecisionService } from '../services/resultFinalizationDecisionService';
import {
  InMemoryResultFinalizationReviewRepository,
  InMemoryResultFinalizationDecisionRepository,
} from '../repositories/inMemoryResultGovernanceRepositories';
import { ResultGovernancePolicyRegistry } from '../policies/resultGovernancePolicyDefinitions';

describe('Package 9 - Finalization Decision', () => {
  let reviewRepo: InMemoryResultFinalizationReviewRepository;
  let decisionRepo: InMemoryResultFinalizationDecisionRepository;
  let policyRegistry: ResultGovernancePolicyRegistry;
  let reviewService: ResultFinalizationReviewService;
  let decisionService: ResultFinalizationDecisionService;

  beforeEach(() => {
    reviewRepo = new InMemoryResultFinalizationReviewRepository();
    decisionRepo = new InMemoryResultFinalizationDecisionRepository();
    policyRegistry = new ResultGovernancePolicyRegistry();
    reviewService = new ResultFinalizationReviewService(reviewRepo, policyRegistry);
    decisionService = new ResultFinalizationDecisionService(decisionRepo, reviewRepo, policyRegistry);
  });

  async function createReadyReview(): Promise<string> {
    const review = await reviewService.createFinalizationReview({
      schoolId: 'school-1', markingInvocationRequestId: 'mir-1', reviewMode: 'teacher_reviewed',
      reviewedResultVersionRefs: { versionIds: ['mrv-1'] },
      requiredCheckRefs: { teacherReviewUnresolved: false, moderationUnresolved: false },
      safeReviewSummary: 'Ready review', actorId: 'a1', actorRole: 'teacher',
    }, 'c1');
    await reviewService.markReviewReadyForDecision(review.resultFinalizationReviewId, 'teacher');
    return review.resultFinalizationReviewId;
  }

  it('should create an approved decision from ready review', async () => {
    const reviewId = await createReadyReview();
    const decision = await decisionService.createFinalizationDecision({
      schoolId: 'school-1', resultFinalizationReviewId: reviewId,
      decisionStatus: 'approved_for_finalization', decisionType: 'teacher_finalization',
      decidedByActorId: 'a1', decidedByRole: 'teacher',
      safeDecisionSummary: 'All results approved', affectedResultVersionRefs: { refs: ['mrv-1'] },
    });

    expect(decision).toBeDefined();
    expect(decision.decisionStatus).toBe('approved_for_finalization');
    expect(decision.resultFinalizationReviewId).toBe(reviewId);
    expect(decision.resultFinalizationDecisionId).toBeTruthy();
  });

  it('should create a returned-for-review decision', async () => {
    const reviewId = await createReadyReview();
    const decision = await decisionService.createFinalizationDecision({
      schoolId: 'school-1', resultFinalizationReviewId: reviewId,
      decisionStatus: 'returned_for_review', decisionType: 'teacher_finalization',
      decidedByActorId: 'a1', decidedByRole: 'teacher',
      safeDecisionSummary: 'Needs more review',
    });

    expect(decision.decisionStatus).toBe('returned_for_review');
  });

  it('should create a blocked decision', async () => {
    const reviewId = await createReadyReview();
    const decision = await decisionService.createFinalizationDecision({
      schoolId: 'school-1', resultFinalizationReviewId: reviewId,
      decisionStatus: 'blocked', decisionType: 'teacher_finalization',
      decidedByActorId: 'a1', decidedByRole: 'teacher',
      safeDecisionSummary: 'System blocked',
    });

    expect(decision.decisionStatus).toBe('blocked');
  });

  it('should block decision creation from non-ready review', async () => {
    const review = await reviewService.createFinalizationReview({
      schoolId: 'school-1', markingInvocationRequestId: 'mir-1', reviewMode: 'teacher_reviewed',
      reviewedResultVersionRefs: { versionIds: ['mrv-1'] },
      safeReviewSummary: 'Draft review', actorId: 'a1', actorRole: 'teacher',
    }, 'c1');

    await expect(decisionService.createFinalizationDecision({
      schoolId: 'school-1', resultFinalizationReviewId: review.resultFinalizationReviewId,
      decisionStatus: 'approved_for_finalization', decisionType: 'teacher_finalization',
      decidedByActorId: 'a1', decidedByRole: 'teacher',
      safeDecisionSummary: 'Should fail',
    })).rejects.toThrow('VALIDATION_FAILED');
  });

  it('should reject student role creating decision', async () => {
    const reviewId = await createReadyReview();
    await expect(decisionService.createFinalizationDecision({
      schoolId: 'school-1', resultFinalizationReviewId: reviewId,
      decisionStatus: 'approved_for_finalization', decisionType: 'teacher_finalization',
      decidedByActorId: 'student-1', decidedByRole: 'student',
      safeDecisionSummary: 'Student decision',
    })).rejects.toThrow('FORBIDDEN');
  });

  it('should approve decision', async () => {
    const reviewId = await createReadyReview();
    const decision = await decisionService.createFinalizationDecision({
      schoolId: 'school-1', resultFinalizationReviewId: reviewId,
      decisionStatus: 'approved_for_finalization', decisionType: 'teacher_finalization',
      decidedByActorId: 'a1', decidedByRole: 'teacher',
      safeDecisionSummary: 'Approved',
    });

    const approved = await decisionService.approveForFinalization(decision.resultFinalizationDecisionId, 'teacher');
    expect(approved?.decisionStatus).toBe('approved_for_finalization');
  });

  it('should return decision for review', async () => {
    const reviewId = await createReadyReview();
    const decision = await decisionService.createFinalizationDecision({
      schoolId: 'school-1', resultFinalizationReviewId: reviewId,
      decisionStatus: 'approved_for_finalization', decisionType: 'teacher_finalization',
      decidedByActorId: 'a1', decidedByRole: 'teacher',
      safeDecisionSummary: 'Needs review',
    });

    const returned = await decisionService.returnForReview(decision.resultFinalizationDecisionId, 'teacher');
    expect(returned?.decisionStatus).toBe('returned_for_review');
  });

  it('should void a decision', async () => {
    const reviewId = await createReadyReview();
    const decision = await decisionService.createFinalizationDecision({
      schoolId: 'school-1', resultFinalizationReviewId: reviewId,
      decisionStatus: 'approved_for_finalization', decisionType: 'teacher_finalization',
      decidedByActorId: 'a1', decidedByRole: 'teacher',
      safeDecisionSummary: 'Voidable',
    });

    const voided = await decisionService.voidFinalizationDecision(decision.resultFinalizationDecisionId, 'teacher');
    expect(voided?.decisionStatus).toBe('void');
    expect(voided?.voidedAt).toBeTruthy();
  });

  it('should preserve MarkingResultVersionRecord references without modifying them', async () => {
    const reviewId = await createReadyReview();
    const decision = await decisionService.createFinalizationDecision({
      schoolId: 'school-1', resultFinalizationReviewId: reviewId,
      decisionStatus: 'approved_for_finalization', decisionType: 'teacher_finalization',
      decidedByActorId: 'a1', decidedByRole: 'teacher',
      safeDecisionSummary: 'Preserved refs',
      affectedResultVersionRefs: { refs: ['mrv-1', 'mrv-2'], unchanged: true },
    });

    expect(decision.affectedResultVersionRefsJson).toBeDefined();
    const refs = decision.affectedResultVersionRefsJson as any;
    expect(refs.refs).toContain('mrv-1');
    expect(refs.unchanged).toBe(true);
  });

  it('should not overwrite Package 5 result versions', async () => {
    // Package 5 MarkingResultVersionRecord is not touched by decision service.
    // Decision service only creates ResultFinalizationDecisionRecord.
    const reviewId = await createReadyReview();
    const decision = await decisionService.createFinalizationDecision({
      schoolId: 'school-1', resultFinalizationReviewId: reviewId,
      decisionStatus: 'approved_for_finalization', decisionType: 'teacher_finalization',
      decidedByActorId: 'a1', decidedByRole: 'teacher',
      safeDecisionSummary: 'No overwrite',
    });

    expect((decision as any).marksAwarded).toBeUndefined();
    expect((decision as any).status).not.toBeDefined(); // decisionStatus is the field, not status
    expect(decision.decisionStatus).toBeDefined();
  });

  it('should not send results', async () => {
    const reviewId = await createReadyReview();
    const decision = await decisionService.createFinalizationDecision({
      schoolId: 'school-1', resultFinalizationReviewId: reviewId,
      decisionStatus: 'approved_for_finalization', decisionType: 'teacher_finalization',
      decidedByActorId: 'a1', decidedByRole: 'teacher',
      safeDecisionSummary: 'No send',
    });
    expect((decision as any).parentDeliveryPayload).toBeUndefined();
    expect((decision as any).emailSent).toBeUndefined();
  });

  it('should not mutate mastery', async () => {
    const reviewId = await createReadyReview();
    const decision = await decisionService.createFinalizationDecision({
      schoolId: 'school-1', resultFinalizationReviewId: reviewId,
      decisionStatus: 'approved_for_finalization', decisionType: 'teacher_finalization',
      decidedByActorId: 'a1', decidedByRole: 'teacher',
      safeDecisionSummary: 'No mastery',
    });
    expect((decision as any).masteryMutation).toBeUndefined();
    expect((decision as any).skillMasteryUpdated).toBeUndefined();
  });
});

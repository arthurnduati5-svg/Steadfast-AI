import { randomUUID } from 'crypto';
import type { ResultFinalizationReviewRepository } from '../contracts/resultGovernanceRepositoryContracts';
import type { ResultFinalizationReview, CreateFinalizationReviewRequest, FinalizationReadinessCheckResult } from '../contracts/index';
import { ResultGovernancePolicyRegistry, isAllowedMutationRole } from '../policies/resultGovernancePolicyDefinitions';

export class ResultFinalizationReviewService {
  constructor(
    private reviewRepo: ResultFinalizationReviewRepository,
    private policyRegistry: ResultGovernancePolicyRegistry,
  ) {}

  async createFinalizationReview(req: CreateFinalizationReviewRequest, correlationId: string): Promise<ResultFinalizationReview> {
    if (!req.schoolId) throw new Error('SCHOOL_CONTEXT_REQUIRED: schoolId is required');
    if (!isAllowedMutationRole(req.actorRole)) throw new Error(`FORBIDDEN: role ${req.actorRole} cannot create finalization reviews`);
    if (!req.markingInvocationRequestId && !req.markingRunId) throw new Error('VALIDATION_FAILED: markingInvocationRequestId or markingRunId is required');
    if (!req.reviewedResultVersionRefs) throw new Error('VALIDATION_FAILED: reviewedResultVersionRefs is required');
    const policy = this.policyRegistry.checkPolicy('RESULT_FINALIZATION_REVIEW', req.actorRole);
    if (!policy.allowed) throw new Error(`POLICY_BLOCKED: ${policy.safeMessage}`);

    const review: ResultFinalizationReview = {
      resultFinalizationReviewId: randomUUID(),
      schoolId: req.schoolId,
      markingInvocationRequestId: req.markingInvocationRequestId,
      markingRunId: req.markingRunId,
      deliverySessionId: req.deliverySessionId,
      paperId: req.paperId,
      paperVersionId: req.paperVersionId,
      reviewStatus: 'draft',
      reviewMode: req.reviewMode || 'teacher_reviewed',
      reviewedResultVersionRefsJson: req.reviewedResultVersionRefs as Record<string, unknown>,
      requiredCheckRefsJson: req.requiredCheckRefs as Record<string, unknown>,
      safeReviewSummary: req.safeReviewSummary,
      createdByActorId: req.actorId,
      createdByRole: req.actorRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return this.reviewRepo.create(review);
  }

  async getFinalizationReview(reviewId: string): Promise<ResultFinalizationReview | null> {
    return this.reviewRepo.getById(reviewId);
  }

  async listFinalizationReviewsForSchool(schoolId: string): Promise<ResultFinalizationReview[]> {
    return this.reviewRepo.listBySchool(schoolId);
  }

  async listFinalizationReviewsForMarkingRun(markingRunId: string): Promise<ResultFinalizationReview[]> {
    return this.reviewRepo.listByMarkingRun(markingRunId);
  }

  async runFinalizationReadinessChecks(reviewId: string, actorRole: string): Promise<FinalizationReadinessCheckResult> {
    if (!isAllowedMutationRole(actorRole)) throw new Error(`FORBIDDEN: role ${actorRole} cannot run readiness checks`);
    const review = await this.reviewRepo.getById(reviewId);
    if (!review) throw new Error('NOT_FOUND: finalization review not found');

    const blockingReasonCodes: string[] = [];
    const result: FinalizationReadinessCheckResult = {
      allChecksPassed: true,
      blockingReasonCodes: [],
      safeSummary: 'All readiness checks passed',
      teacherReviewUnresolved: false,
      moderationUnresolved: false,
      missingResultVersionRefs: false,
      policyBlocked: false,
    };

    if (!review.reviewedResultVersionRefsJson || Object.keys(review.reviewedResultVersionRefsJson).length === 0) {
      result.missingResultVersionRefs = true;
      result.allChecksPassed = false;
      blockingReasonCodes.push('MISSING_RESULT_VERSION_REFS');
    }

    const policy = this.policyRegistry.checkPolicy('RESULT_FINALIZATION_REVIEW', actorRole);
    if (!policy.allowed) {
      result.policyBlocked = true;
      result.allChecksPassed = false;
      blockingReasonCodes.push('POLICY_BLOCKED');
    }

    const checkRefs = review.requiredCheckRefsJson as Record<string, any> | null;
    if (checkRefs) {
      if (checkRefs.teacherReviewUnresolved === true) {
        result.teacherReviewUnresolved = true;
        result.allChecksPassed = false;
        blockingReasonCodes.push('TEACHER_REVIEW_UNRESOLVED');
      }
      if (checkRefs.moderationUnresolved === true) {
        result.moderationUnresolved = true;
        result.allChecksPassed = false;
        blockingReasonCodes.push('MODERATION_UNRESOLVED');
      }
    }

    result.blockingReasonCodes = blockingReasonCodes;
    if (!result.allChecksPassed) {
      result.safeSummary = `Readiness checks blocked: ${blockingReasonCodes.join(', ')}`;
    }
    return result;
  }

  async markReviewReadyForDecision(reviewId: string, actorRole: string, safeSummary?: string): Promise<ResultFinalizationReview | null> {
    if (!isAllowedMutationRole(actorRole)) throw new Error(`FORBIDDEN: role ${actorRole} cannot update review status`);
    const review = await this.reviewRepo.getById(reviewId);
    if (!review) throw new Error('NOT_FOUND: finalization review not found');
    const checks = await this.runFinalizationReadinessChecks(reviewId, actorRole);
    if (!checks.allChecksPassed) throw new Error(`FINALIZATION_BLOCKED: readiness checks failed: ${checks.blockingReasonCodes.join(', ')}`);
    return this.reviewRepo.updateStatus(reviewId, 'ready_for_decision', safeSummary || 'Review ready for finalization decision');
  }

  async blockFinalizationReview(reviewId: string, actorRole: string, safeSummary?: string): Promise<ResultFinalizationReview | null> {
    if (!isAllowedMutationRole(actorRole)) throw new Error(`FORBIDDEN: role ${actorRole} cannot block reviews`);
    return this.reviewRepo.updateStatus(reviewId, 'blocked', safeSummary || 'Review blocked');
  }

  async cancelFinalizationReview(reviewId: string, actorRole: string, safeSummary?: string): Promise<ResultFinalizationReview | null> {
    if (!isAllowedMutationRole(actorRole)) throw new Error(`FORBIDDEN: role ${actorRole} cannot cancel reviews`);
    return this.reviewRepo.updateStatus(reviewId, 'cancelled', safeSummary || 'Review cancelled');
  }

  async completeFinalizationReview(reviewId: string, actorRole: string, safeSummary?: string): Promise<ResultFinalizationReview | null> {
    if (!isAllowedMutationRole(actorRole)) throw new Error(`FORBIDDEN: role ${actorRole} cannot complete reviews`);
    return this.reviewRepo.updateStatus(reviewId, 'completed', safeSummary || 'Review completed');
  }
}

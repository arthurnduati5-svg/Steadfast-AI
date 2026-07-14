import { randomUUID } from 'crypto';
import type { ResultFinalizationDecisionRepository, ResultFinalizationReviewRepository } from '../contracts/resultGovernanceRepositoryContracts';
import type { ResultFinalizationDecision, CreateFinalizationDecisionRequest } from '../contracts/index';
import { ResultGovernancePolicyRegistry, isAllowedMutationRole } from '../policies/resultGovernancePolicyDefinitions';

export class ResultFinalizationDecisionService {
  constructor(
    private decisionRepo: ResultFinalizationDecisionRepository,
    private reviewRepo: ResultFinalizationReviewRepository,
    private policyRegistry: ResultGovernancePolicyRegistry,
  ) {}

  async createFinalizationDecision(req: CreateFinalizationDecisionRequest): Promise<ResultFinalizationDecision> {
    if (!req.schoolId) throw new Error('SCHOOL_CONTEXT_REQUIRED: schoolId is required');
    if (!isAllowedMutationRole(req.decidedByRole)) throw new Error(`FORBIDDEN: role ${req.decidedByRole} cannot create finalization decisions`);
    const policy = this.policyRegistry.checkPolicy('RESULT_FINALIZATION_DECISION', req.decidedByRole);
    if (!policy.allowed) throw new Error(`POLICY_BLOCKED: ${policy.safeMessage}`);

    const review = await this.reviewRepo.getById(req.resultFinalizationReviewId);
    if (!review) throw new Error('NOT_FOUND: finalization review not found');
    if (review.reviewStatus !== 'ready_for_decision') throw new Error(`VALIDATION_FAILED: review status must be ready_for_decision, got ${review.reviewStatus}`);

    if (req.decisionStatus !== 'returned_for_review' && req.decisionStatus !== 'blocked') {
      const checkRefs = review.requiredCheckRefsJson as Record<string, any> | null;
      if (checkRefs?.teacherReviewUnresolved === true) throw new Error('TEACHER_REVIEW_UNRESOLVED: teacher review items remain unresolved');
      if (checkRefs?.moderationUnresolved === true) throw new Error('MODERATION_UNRESOLVED: moderation blockers remain unresolved');
    }

    const decision: ResultFinalizationDecision = {
      resultFinalizationDecisionId: randomUUID(),
      schoolId: req.schoolId,
      resultFinalizationReviewId: req.resultFinalizationReviewId,
      markingInvocationRequestId: req.markingInvocationRequestId || review.markingInvocationRequestId,
      markingRunId: req.markingRunId || review.markingRunId,
      decisionStatus: req.decisionStatus || 'approved_for_finalization',
      decisionType: req.decisionType || 'teacher_finalization',
      decidedByActorId: req.decidedByActorId,
      decidedByRole: req.decidedByRole,
      safeDecisionSummary: req.safeDecisionSummary,
      reasonCodesJson: req.reasonCodes as Record<string, unknown>,
      affectedResultVersionRefsJson: req.affectedResultVersionRefs as Record<string, unknown>,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return this.decisionRepo.create(decision);
  }

  async approveForFinalization(decisionId: string, actorRole: string, safeSummary?: string): Promise<ResultFinalizationDecision | null> {
    if (!isAllowedMutationRole(actorRole)) throw new Error(`FORBIDDEN: role ${actorRole} cannot approve decisions`);
    return this.decisionRepo.updateStatus(decisionId, 'approved_for_finalization', safeSummary || 'Approved for finalization');
  }

  async returnForReview(decisionId: string, actorRole: string, safeSummary?: string): Promise<ResultFinalizationDecision | null> {
    if (!isAllowedMutationRole(actorRole)) throw new Error(`FORBIDDEN: role ${actorRole} cannot return decisions for review`);
    return this.decisionRepo.updateStatus(decisionId, 'returned_for_review', safeSummary || 'Returned for review');
  }

  async blockFinalizationDecision(decisionId: string, actorRole: string, safeSummary?: string): Promise<ResultFinalizationDecision | null> {
    if (!isAllowedMutationRole(actorRole)) throw new Error(`FORBIDDEN: role ${actorRole} cannot block decisions`);
    return this.decisionRepo.updateStatus(decisionId, 'blocked', safeSummary || 'Decision blocked');
  }

  async voidFinalizationDecision(decisionId: string, actorRole: string, safeSummary?: string): Promise<ResultFinalizationDecision | null> {
    if (!isAllowedMutationRole(actorRole)) throw new Error(`FORBIDDEN: role ${actorRole} cannot void decisions`);
    const voidedAt = new Date().toISOString();
    return this.decisionRepo.voidDecision(decisionId, voidedAt);
  }

  async getFinalizationDecision(decisionId: string): Promise<ResultFinalizationDecision | null> {
    return this.decisionRepo.getById(decisionId);
  }

  async listDecisionsForReview(reviewId: string): Promise<ResultFinalizationDecision[]> {
    return this.decisionRepo.listByReview(reviewId);
  }
}

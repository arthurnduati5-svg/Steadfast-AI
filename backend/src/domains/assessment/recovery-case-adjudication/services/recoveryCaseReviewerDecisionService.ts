import type { RecoveryCaseAdjudicationCommandContext, RecoveryCaseAdjudicationSafeEnvelope } from '../contracts/recoveryCaseAdjudicationContracts';
import type { RecoveryCaseReviewerDecisionDraft, CreateReviewerDecisionInput } from '../contracts/recoveryCaseReviewerDecisionContracts';
import type { RecoveryCaseReviewerDecisionDraftRepository, RecoveryCaseAdjudicationAuditRepository } from '../contracts/recoveryCaseAdjudicationRepositoryContracts';
import { isRoleAllowedForMutation } from '../policies/recoveryCaseAdjudicationPolicyDefinitions';

export class RecoveryCaseReviewerDecisionService {
  constructor(
    private decisionRepo: RecoveryCaseReviewerDecisionDraftRepository,
    private auditRepo: RecoveryCaseAdjudicationAuditRepository,
  ) {}

  async createReviewerDecisionDraft(
    ctx: RecoveryCaseAdjudicationCommandContext,
    input: CreateReviewerDecisionInput,
  ): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewerDecisionDraft>> {
    if (!isRoleAllowedForMutation(ctx.actorRole)) {
      return { success: false, status: 'error', message: 'Role not allowed for mutation', errorCode: 'FORBIDDEN_ROLE', correlationId: ctx.correlationId };
    }

    const decision = await this.decisionRepo.create({
      ...input,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    });

    await this.auditRepo.create({
      schoolId: ctx.schoolId,
      entityType: 'reviewer_decision',
      entityId: decision.reviewerDecisionId,
      action: 'create_reviewer_decision_draft',
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      correlationId: ctx.correlationId,
      safeMetadata: { sourceRefs: ctx.sourceRefsJson, decisionCode: input.decisionCode, reviewerPosition: input.reviewerPosition },
    });

    return { success: true, status: 'ok', data: decision, correlationId: ctx.correlationId };
  }

  async getReviewerDecisionDraft(decisionId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewerDecisionDraft>> {
    const decision = await this.decisionRepo.getById(decisionId);
    if (!decision) {
      return { success: false, status: 'not_found', message: 'Reviewer decision not found', errorCode: 'NOT_FOUND' };
    }
    return { success: true, status: 'ok', data: decision };
  }

  async listReviewerDecisionsForSchool(schoolId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewerDecisionDraft[]>> {
    const items = await this.decisionRepo.listBySchool(schoolId);
    return { success: true, status: 'ok', data: items };
  }

  async listReviewerDecisionsForQueueItem(schoolId: string, queueItemId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewerDecisionDraft[]>> {
    const items = await this.decisionRepo.listByQueueItemId(schoolId, queueItemId);
    return { success: true, status: 'ok', data: items };
  }

  async listReviewerDecisionsForSession(schoolId: string, sessionId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewerDecisionDraft[]>> {
    const items = await this.decisionRepo.listBySessionId(schoolId, sessionId);
    return { success: true, status: 'ok', data: items };
  }

  async listReviewerDecisionsByReviewer(schoolId: string, reviewerActorId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewerDecisionDraft[]>> {
    const items = await this.decisionRepo.listByReviewer(schoolId, reviewerActorId);
    return { success: true, status: 'ok', data: items };
  }

  async listReviewerDecisionsByStatus(schoolId: string, status: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewerDecisionDraft[]>> {
    const items = await this.decisionRepo.listByStatus(schoolId, status);
    return { success: true, status: 'ok', data: items };
  }

  async markReviewerDecisionReviewReady(decisionId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewerDecisionDraft>> {
    const decision = await this.decisionRepo.updateStatus(decisionId, 'review_ready');
    await this.auditRepo.create({
      schoolId: decision.schoolId,
      entityType: 'reviewer_decision',
      entityId: decisionId,
      action: 'mark_reviewer_decision_review_ready',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: decision.decisionStatus },
    });
    return { success: true, status: 'ok', data: decision };
  }

  async markReviewerDecisionNeedsSecondReview(decisionId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewerDecisionDraft>> {
    const decision = await this.decisionRepo.updateStatus(decisionId, 'needs_second_review');
    await this.auditRepo.create({
      schoolId: decision.schoolId,
      entityType: 'reviewer_decision',
      entityId: decisionId,
      action: 'mark_reviewer_decision_needs_second_review',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: decision.decisionStatus },
    });
    return { success: true, status: 'ok', data: decision };
  }

  async markReviewerDecisionNeedsMoreEvidence(decisionId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewerDecisionDraft>> {
    const decision = await this.decisionRepo.updateStatus(decisionId, 'needs_more_evidence');
    await this.auditRepo.create({
      schoolId: decision.schoolId,
      entityType: 'reviewer_decision',
      entityId: decisionId,
      action: 'mark_reviewer_decision_needs_more_evidence',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: decision.decisionStatus },
    });
    return { success: true, status: 'ok', data: decision };
  }

  async blockReviewerDecision(decisionId: string, reasonCodes: string[]): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewerDecisionDraft>> {
    const decision = await this.decisionRepo.updateStatus(decisionId, 'blocked', reasonCodes);
    await this.auditRepo.create({
      schoolId: decision.schoolId,
      entityType: 'reviewer_decision',
      entityId: decisionId,
      action: 'block_reviewer_decision',
      actorId: '',
      actorRole: '',
      safeMetadata: { reasonCodes, previousStatus: decision.decisionStatus },
    });
    return { success: true, status: 'ok', data: decision };
  }

  async suppressReviewerDecision(decisionId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewerDecisionDraft>> {
    const decision = await this.decisionRepo.updateStatus(decisionId, 'suppressed');
    await this.auditRepo.create({
      schoolId: decision.schoolId,
      entityType: 'reviewer_decision',
      entityId: decisionId,
      action: 'suppress_reviewer_decision',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: decision.decisionStatus },
    });
    return { success: true, status: 'ok', data: decision };
  }

  async voidReviewerDecision(decisionId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewerDecisionDraft>> {
    const decision = await this.decisionRepo.void(decisionId);
    await this.auditRepo.create({
      schoolId: decision.schoolId,
      entityType: 'reviewer_decision',
      entityId: decisionId,
      action: 'void_reviewer_decision',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: decision.decisionStatus },
    });
    return { success: true, status: 'ok', data: decision };
  }
}

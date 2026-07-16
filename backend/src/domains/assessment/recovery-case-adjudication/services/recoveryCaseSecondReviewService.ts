import type { RecoveryCaseAdjudicationCommandContext, RecoveryCaseAdjudicationSafeEnvelope } from '../contracts/recoveryCaseAdjudicationContracts';
import type { RecoveryCaseSecondReviewRequest, CreateSecondReviewRequestInput } from '../contracts/recoveryCaseSecondReviewContracts';
import type { RecoveryCaseSecondReviewRequestRepository, RecoveryCaseAdjudicationAuditRepository } from '../contracts/recoveryCaseAdjudicationRepositoryContracts';
import { isRoleAllowedForMutation } from '../policies/recoveryCaseAdjudicationPolicyDefinitions';

export class RecoveryCaseSecondReviewService {
  constructor(
    private secondReviewRepo: RecoveryCaseSecondReviewRequestRepository,
    private auditRepo: RecoveryCaseAdjudicationAuditRepository,
  ) {}

  async createSecondReviewRequest(
    ctx: RecoveryCaseAdjudicationCommandContext,
    input: CreateSecondReviewRequestInput,
  ): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseSecondReviewRequest>> {
    if (!isRoleAllowedForMutation(ctx.actorRole)) {
      return { success: false, status: 'error', message: 'Role not allowed for mutation', errorCode: 'FORBIDDEN_ROLE', correlationId: ctx.correlationId };
    }

    const request = await this.secondReviewRepo.create({
      ...input,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    });

    await this.auditRepo.create({
      schoolId: ctx.schoolId,
      entityType: 'second_review_request',
      entityId: request.secondReviewRequestId,
      action: 'create_second_review_request',
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      correlationId: ctx.correlationId,
      safeMetadata: { sourceRefs: ctx.sourceRefsJson, primaryDecisionId: input.primaryDecisionId },
    });

    return { success: true, status: 'ok', data: request, correlationId: ctx.correlationId };
  }

  async getSecondReviewRequest(requestId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseSecondReviewRequest>> {
    const request = await this.secondReviewRepo.getById(requestId);
    if (!request) {
      return { success: false, status: 'not_found', message: 'Second review request not found', errorCode: 'NOT_FOUND' };
    }
    return { success: true, status: 'ok', data: request };
  }

  async listSecondReviewRequestsForSchool(schoolId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseSecondReviewRequest[]>> {
    const items = await this.secondReviewRepo.listBySchool(schoolId);
    return { success: true, status: 'ok', data: items };
  }

  async listSecondReviewRequestsForQueueItem(schoolId: string, queueItemId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseSecondReviewRequest[]>> {
    const items = await this.secondReviewRepo.listByQueueItemId(schoolId, queueItemId);
    return { success: true, status: 'ok', data: items };
  }

  async listSecondReviewRequestsByStatus(schoolId: string, status: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseSecondReviewRequest[]>> {
    const items = await this.secondReviewRepo.listByStatus(schoolId, status);
    return { success: true, status: 'ok', data: items };
  }

  async markSecondReviewReviewReady(requestId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseSecondReviewRequest>> {
    const request = await this.secondReviewRepo.updateStatus(requestId, 'review_ready');
    await this.auditRepo.create({
      schoolId: request.schoolId,
      entityType: 'second_review_request',
      entityId: requestId,
      action: 'mark_second_review_review_ready',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: request.requestStatus },
    });
    return { success: true, status: 'ok', data: request };
  }

  async markAwaitingDistinctReviewer(requestId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseSecondReviewRequest>> {
    const request = await this.secondReviewRepo.updateStatus(requestId, 'awaiting_distinct_reviewer');
    await this.auditRepo.create({
      schoolId: request.schoolId,
      entityType: 'second_review_request',
      entityId: requestId,
      action: 'mark_awaiting_distinct_reviewer',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: request.requestStatus },
    });
    return { success: true, status: 'ok', data: request };
  }

  async markSecondReviewReceived(requestId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseSecondReviewRequest>> {
    const request = await this.secondReviewRepo.updateStatus(requestId, 'review_received');
    await this.auditRepo.create({
      schoolId: request.schoolId,
      entityType: 'second_review_request',
      entityId: requestId,
      action: 'mark_second_review_received',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: request.requestStatus },
    });
    return { success: true, status: 'ok', data: request };
  }

  async blockSecondReviewRequest(requestId: string, reasonCodes: string[]): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseSecondReviewRequest>> {
    const request = await this.secondReviewRepo.updateStatus(requestId, 'blocked', reasonCodes);
    await this.auditRepo.create({
      schoolId: request.schoolId,
      entityType: 'second_review_request',
      entityId: requestId,
      action: 'block_second_review_request',
      actorId: '',
      actorRole: '',
      safeMetadata: { reasonCodes, previousStatus: request.requestStatus },
    });
    return { success: true, status: 'ok', data: request };
  }

  async suppressSecondReviewRequest(requestId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseSecondReviewRequest>> {
    const request = await this.secondReviewRepo.updateStatus(requestId, 'suppressed');
    await this.auditRepo.create({
      schoolId: request.schoolId,
      entityType: 'second_review_request',
      entityId: requestId,
      action: 'suppress_second_review_request',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: request.requestStatus },
    });
    return { success: true, status: 'ok', data: request };
  }

  async voidSecondReviewRequest(requestId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseSecondReviewRequest>> {
    const request = await this.secondReviewRepo.void(requestId);
    await this.auditRepo.create({
      schoolId: request.schoolId,
      entityType: 'second_review_request',
      entityId: requestId,
      action: 'void_second_review_request',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: request.requestStatus },
    });
    return { success: true, status: 'ok', data: request };
  }
}

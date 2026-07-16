import type { RecoveryCaseAdjudicationCommandContext, RecoveryCaseAdjudicationSafeEnvelope } from '../contracts/recoveryCaseAdjudicationContracts';
import type { RecoveryCasePriorityOverrideRequest, CreatePriorityOverrideRequestInput } from '../contracts/recoveryCasePriorityOverrideContracts';
import type { RecoveryCasePriorityOverrideRequestRepository, RecoveryCaseAdjudicationAuditRepository } from '../contracts/recoveryCaseAdjudicationRepositoryContracts';
import { isRoleAllowedForMutation } from '../policies/recoveryCaseAdjudicationPolicyDefinitions';

export class RecoveryCasePriorityOverrideService {
  constructor(
    private overrideRepo: RecoveryCasePriorityOverrideRequestRepository,
    private auditRepo: RecoveryCaseAdjudicationAuditRepository,
  ) {}

  async createPriorityOverrideRequest(
    ctx: RecoveryCaseAdjudicationCommandContext,
    input: CreatePriorityOverrideRequestInput,
  ): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCasePriorityOverrideRequest>> {
    if (!isRoleAllowedForMutation(ctx.actorRole)) {
      return { success: false, status: 'error', message: 'Role not allowed for mutation', errorCode: 'FORBIDDEN_ROLE', correlationId: ctx.correlationId };
    }

    const request = await this.overrideRepo.create({
      ...input,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    });

    await this.auditRepo.create({
      schoolId: ctx.schoolId,
      entityType: 'priority_override_request',
      entityId: request.priorityOverrideRequestId,
      action: 'create_priority_override_request',
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      correlationId: ctx.correlationId,
      safeMetadata: { sourceRefs: ctx.sourceRefsJson, requestedPriorityBand: input.requestedPriorityBand },
    });

    return { success: true, status: 'ok', data: request, correlationId: ctx.correlationId };
  }

  async getPriorityOverrideRequest(requestId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCasePriorityOverrideRequest>> {
    const request = await this.overrideRepo.getById(requestId);
    if (!request) {
      return { success: false, status: 'not_found', message: 'Priority override request not found', errorCode: 'NOT_FOUND' };
    }
    return { success: true, status: 'ok', data: request };
  }

  async listPriorityOverridesForSchool(schoolId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCasePriorityOverrideRequest[]>> {
    const items = await this.overrideRepo.listBySchool(schoolId);
    return { success: true, status: 'ok', data: items };
  }

  async listPriorityOverridesForQueueItem(schoolId: string, queueItemId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCasePriorityOverrideRequest[]>> {
    const items = await this.overrideRepo.listByQueueItemId(schoolId, queueItemId);
    return { success: true, status: 'ok', data: items };
  }

  async listPriorityOverridesByRequestor(schoolId: string, actorId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCasePriorityOverrideRequest[]>> {
    const items = await this.overrideRepo.listByRequestor(schoolId, actorId);
    return { success: true, status: 'ok', data: items };
  }

  async listPriorityOverridesByStatus(schoolId: string, status: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCasePriorityOverrideRequest[]>> {
    const items = await this.overrideRepo.listByStatus(schoolId, status);
    return { success: true, status: 'ok', data: items };
  }

  async markPriorityOverrideReviewReady(requestId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCasePriorityOverrideRequest>> {
    const request = await this.overrideRepo.updateStatus(requestId, 'review_ready');
    await this.auditRepo.create({
      schoolId: request.schoolId,
      entityType: 'priority_override_request',
      entityId: requestId,
      action: 'mark_priority_override_review_ready',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: request.overrideStatus },
    });
    return { success: true, status: 'ok', data: request };
  }

  async markPriorityOverrideNeedsSecondReview(requestId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCasePriorityOverrideRequest>> {
    const request = await this.overrideRepo.updateStatus(requestId, 'needs_second_review');
    await this.auditRepo.create({
      schoolId: request.schoolId,
      entityType: 'priority_override_request',
      entityId: requestId,
      action: 'mark_priority_override_needs_second_review',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: request.overrideStatus },
    });
    return { success: true, status: 'ok', data: request };
  }

  async approvePriorityOverrideForFutureUse(requestId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCasePriorityOverrideRequest>> {
    const request = await this.overrideRepo.updateStatus(requestId, 'approved_for_future_use');
    await this.auditRepo.create({
      schoolId: request.schoolId,
      entityType: 'priority_override_request',
      entityId: requestId,
      action: 'approve_priority_override_for_future_use',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: request.overrideStatus },
    });
    return { success: true, status: 'ok', data: request };
  }

  async rejectPriorityOverride(requestId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCasePriorityOverrideRequest>> {
    const request = await this.overrideRepo.updateStatus(requestId, 'rejected');
    await this.auditRepo.create({
      schoolId: request.schoolId,
      entityType: 'priority_override_request',
      entityId: requestId,
      action: 'reject_priority_override',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: request.overrideStatus },
    });
    return { success: true, status: 'ok', data: request };
  }

  async blockPriorityOverride(requestId: string, reasonCodes: string[]): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCasePriorityOverrideRequest>> {
    const request = await this.overrideRepo.updateStatus(requestId, 'blocked', reasonCodes);
    await this.auditRepo.create({
      schoolId: request.schoolId,
      entityType: 'priority_override_request',
      entityId: requestId,
      action: 'block_priority_override',
      actorId: '',
      actorRole: '',
      safeMetadata: { reasonCodes, previousStatus: request.overrideStatus },
    });
    return { success: true, status: 'ok', data: request };
  }

  async suppressPriorityOverride(requestId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCasePriorityOverrideRequest>> {
    const request = await this.overrideRepo.updateStatus(requestId, 'suppressed');
    await this.auditRepo.create({
      schoolId: request.schoolId,
      entityType: 'priority_override_request',
      entityId: requestId,
      action: 'suppress_priority_override',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: request.overrideStatus },
    });
    return { success: true, status: 'ok', data: request };
  }

  async voidPriorityOverride(requestId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCasePriorityOverrideRequest>> {
    const request = await this.overrideRepo.void(requestId);
    await this.auditRepo.create({
      schoolId: request.schoolId,
      entityType: 'priority_override_request',
      entityId: requestId,
      action: 'void_priority_override',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: request.overrideStatus },
    });
    return { success: true, status: 'ok', data: request };
  }
}

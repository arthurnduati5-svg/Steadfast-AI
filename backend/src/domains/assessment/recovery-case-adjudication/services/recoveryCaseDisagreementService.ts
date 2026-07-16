import type { RecoveryCaseAdjudicationCommandContext, RecoveryCaseAdjudicationSafeEnvelope } from '../contracts/recoveryCaseAdjudicationContracts';
import type { RecoveryCaseDisagreementResolutionDraft, CreateDisagreementResolutionDraftInput } from '../contracts/recoveryCaseDisagreementContracts';
import type { RecoveryCaseDisagreementResolutionDraftRepository, RecoveryCaseAdjudicationAuditRepository } from '../contracts/recoveryCaseAdjudicationRepositoryContracts';
import { isRoleAllowedForMutation } from '../policies/recoveryCaseAdjudicationPolicyDefinitions';

export class RecoveryCaseDisagreementService {
  constructor(
    private disagreementRepo: RecoveryCaseDisagreementResolutionDraftRepository,
    private auditRepo: RecoveryCaseAdjudicationAuditRepository,
  ) {}

  async createDisagreementResolutionDraft(
    ctx: RecoveryCaseAdjudicationCommandContext,
    input: CreateDisagreementResolutionDraftInput,
  ): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseDisagreementResolutionDraft>> {
    if (!isRoleAllowedForMutation(ctx.actorRole)) {
      return { success: false, status: 'error', message: 'Role not allowed for mutation', errorCode: 'FORBIDDEN_ROLE', correlationId: ctx.correlationId };
    }

    const draft = await this.disagreementRepo.create({
      ...input,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    });

    await this.auditRepo.create({
      schoolId: ctx.schoolId,
      entityType: 'disagreement_resolution_draft',
      entityId: draft.disagreementResolutionDraftId,
      action: 'create_disagreement_resolution_draft',
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      correlationId: ctx.correlationId,
      safeMetadata: { sourceRefs: ctx.sourceRefsJson, consensusId: input.consensusId },
    });

    return { success: true, status: 'ok', data: draft, correlationId: ctx.correlationId };
  }

  async getDisagreementResolutionDraft(draftId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseDisagreementResolutionDraft>> {
    const draft = await this.disagreementRepo.getById(draftId);
    if (!draft) {
      return { success: false, status: 'not_found', message: 'Disagreement resolution draft not found', errorCode: 'NOT_FOUND' };
    }
    return { success: true, status: 'ok', data: draft };
  }

  async listDisagreementDraftsForSchool(schoolId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseDisagreementResolutionDraft[]>> {
    const items = await this.disagreementRepo.listBySchool(schoolId);
    return { success: true, status: 'ok', data: items };
  }

  async listDisagreementDraftsForQueueItem(schoolId: string, queueItemId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseDisagreementResolutionDraft[]>> {
    const items = await this.disagreementRepo.listByQueueItemId(schoolId, queueItemId);
    return { success: true, status: 'ok', data: items };
  }

  async listDisagreementDraftsByStatus(schoolId: string, status: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseDisagreementResolutionDraft[]>> {
    const items = await this.disagreementRepo.listByStatus(schoolId, status);
    return { success: true, status: 'ok', data: items };
  }

  async markDisagreementDraftReviewReady(draftId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseDisagreementResolutionDraft>> {
    const draft = await this.disagreementRepo.updateStatus(draftId, 'review_ready');
    await this.auditRepo.create({
      schoolId: draft.schoolId,
      entityType: 'disagreement_resolution_draft',
      entityId: draftId,
      action: 'mark_disagreement_draft_review_ready',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: draft.draftStatus },
    });
    return { success: true, status: 'ok', data: draft };
  }

  async approveDisagreementDraftForFutureUse(draftId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseDisagreementResolutionDraft>> {
    const draft = await this.disagreementRepo.updateStatus(draftId, 'approved_for_future_use');
    await this.auditRepo.create({
      schoolId: draft.schoolId,
      entityType: 'disagreement_resolution_draft',
      entityId: draftId,
      action: 'approve_disagreement_draft_for_future_use',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: draft.draftStatus },
    });
    return { success: true, status: 'ok', data: draft };
  }

  async blockDisagreementDraft(draftId: string, reasonCodes: string[]): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseDisagreementResolutionDraft>> {
    const draft = await this.disagreementRepo.updateStatus(draftId, 'blocked', reasonCodes);
    await this.auditRepo.create({
      schoolId: draft.schoolId,
      entityType: 'disagreement_resolution_draft',
      entityId: draftId,
      action: 'block_disagreement_draft',
      actorId: '',
      actorRole: '',
      safeMetadata: { reasonCodes, previousStatus: draft.draftStatus },
    });
    return { success: true, status: 'ok', data: draft };
  }

  async suppressDisagreementDraft(draftId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseDisagreementResolutionDraft>> {
    const draft = await this.disagreementRepo.updateStatus(draftId, 'suppressed');
    await this.auditRepo.create({
      schoolId: draft.schoolId,
      entityType: 'disagreement_resolution_draft',
      entityId: draftId,
      action: 'suppress_disagreement_draft',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: draft.draftStatus },
    });
    return { success: true, status: 'ok', data: draft };
  }

  async voidDisagreementDraft(draftId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseDisagreementResolutionDraft>> {
    const draft = await this.disagreementRepo.void(draftId);
    await this.auditRepo.create({
      schoolId: draft.schoolId,
      entityType: 'disagreement_resolution_draft',
      entityId: draftId,
      action: 'void_disagreement_draft',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: draft.draftStatus },
    });
    return { success: true, status: 'ok', data: draft };
  }
}

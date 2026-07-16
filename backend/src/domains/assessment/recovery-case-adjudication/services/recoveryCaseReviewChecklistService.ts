import type { RecoveryCaseAdjudicationCommandContext, RecoveryCaseAdjudicationSafeEnvelope } from '../contracts/recoveryCaseAdjudicationContracts';
import type { RecoveryCaseReviewChecklist, CreateReviewChecklistInput } from '../contracts/recoveryCaseReviewChecklistContracts';
import type { RecoveryCaseReviewChecklistRepository, RecoveryCaseAdjudicationAuditRepository } from '../contracts/recoveryCaseAdjudicationRepositoryContracts';
import { isRoleAllowedForMutation } from '../policies/recoveryCaseAdjudicationPolicyDefinitions';

export class RecoveryCaseReviewChecklistService {
  constructor(
    private checklistRepo: RecoveryCaseReviewChecklistRepository,
    private auditRepo: RecoveryCaseAdjudicationAuditRepository,
  ) {}

  async createReviewChecklist(
    ctx: RecoveryCaseAdjudicationCommandContext,
    input: CreateReviewChecklistInput,
  ): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewChecklist>> {
    if (!isRoleAllowedForMutation(ctx.actorRole)) {
      return { success: false, status: 'error', message: 'Role not allowed for mutation', errorCode: 'FORBIDDEN_ROLE', correlationId: ctx.correlationId };
    }

    const checklist = await this.checklistRepo.create({
      ...input,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    });

    await this.auditRepo.create({
      schoolId: ctx.schoolId,
      entityType: 'review_checklist',
      entityId: checklist.reviewChecklistId,
      action: 'create_review_checklist',
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      correlationId: ctx.correlationId,
      safeMetadata: { sourceRefs: ctx.sourceRefsJson },
    });

    return { success: true, status: 'ok', data: checklist, correlationId: ctx.correlationId };
  }

  async evaluateReviewChecklist(checklistId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewChecklist>> {
    const checklist = await this.checklistRepo.getById(checklistId);
    if (!checklist) {
      return { success: false, status: 'not_found', message: 'Review checklist not found', errorCode: 'NOT_FOUND' };
    }

    const needsMoreEvidence = Object.values(checklist.checklistResults).some(
      (r) => r === 'insufficient_evidence' || r === 'missing_evidence',
    );
    const outcome = needsMoreEvidence ? 'needs_more_evidence' : 'ready';

    const updated = await this.checklistRepo.updateStatus(checklistId, outcome);
    await this.auditRepo.create({
      schoolId: updated.schoolId,
      entityType: 'review_checklist',
      entityId: checklistId,
      action: 'evaluate_review_checklist',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousOutcome: checklist.checklistOutcome, newOutcome: outcome },
    });

    return { success: true, status: 'ok', data: updated };
  }

  async getReviewChecklist(checklistId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewChecklist>> {
    const checklist = await this.checklistRepo.getById(checklistId);
    if (!checklist) {
      return { success: false, status: 'not_found', message: 'Review checklist not found', errorCode: 'NOT_FOUND' };
    }
    return { success: true, status: 'ok', data: checklist };
  }

  async listReviewChecklistsForQueueItem(schoolId: string, queueItemId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewChecklist[]>> {
    const items = await this.checklistRepo.listByQueueItemId(schoolId, queueItemId);
    return { success: true, status: 'ok', data: items };
  }

  async listReviewChecklistsForSession(schoolId: string, _sessionId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewChecklist[]>> {
    const items = await this.checklistRepo.listBySchool(schoolId);
    return { success: true, status: 'ok', data: items };
  }

  async listReviewChecklistsByOutcome(schoolId: string, outcome: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewChecklist[]>> {
    const items = await this.checklistRepo.listByOutcome(schoolId, outcome);
    return { success: true, status: 'ok', data: items };
  }

  async markChecklistReviewReady(checklistId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewChecklist>> {
    const checklist = await this.checklistRepo.updateStatus(checklistId, 'ready');
    await this.auditRepo.create({
      schoolId: checklist.schoolId,
      entityType: 'review_checklist',
      entityId: checklistId,
      action: 'mark_checklist_review_ready',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousOutcome: checklist.checklistOutcome },
    });
    return { success: true, status: 'ok', data: checklist };
  }

  async markChecklistNeedsMoreEvidence(checklistId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewChecklist>> {
    const checklist = await this.checklistRepo.updateStatus(checklistId, 'needs_more_evidence');
    await this.auditRepo.create({
      schoolId: checklist.schoolId,
      entityType: 'review_checklist',
      entityId: checklistId,
      action: 'mark_checklist_needs_more_evidence',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousOutcome: checklist.checklistOutcome },
    });
    return { success: true, status: 'ok', data: checklist };
  }

  async markChecklistNeedsConflictDeclaration(checklistId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewChecklist>> {
    const checklist = await this.checklistRepo.updateStatus(checklistId, 'needs_conflict_declaration');
    await this.auditRepo.create({
      schoolId: checklist.schoolId,
      entityType: 'review_checklist',
      entityId: checklistId,
      action: 'mark_checklist_needs_conflict_declaration',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousOutcome: checklist.checklistOutcome },
    });
    return { success: true, status: 'ok', data: checklist };
  }

  async blockChecklist(checklistId: string, reasonCodes: string[]): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewChecklist>> {
    const checklist = await this.checklistRepo.updateStatus(checklistId, 'blocked', reasonCodes);
    await this.auditRepo.create({
      schoolId: checklist.schoolId,
      entityType: 'review_checklist',
      entityId: checklistId,
      action: 'block_checklist',
      actorId: '',
      actorRole: '',
      safeMetadata: { reasonCodes, previousOutcome: checklist.checklistOutcome },
    });
    return { success: true, status: 'ok', data: checklist };
  }

  async voidChecklist(checklistId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewChecklist>> {
    const checklist = await this.checklistRepo.void(checklistId);
    await this.auditRepo.create({
      schoolId: checklist.schoolId,
      entityType: 'review_checklist',
      entityId: checklistId,
      action: 'void_checklist',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousOutcome: checklist.checklistOutcome },
    });
    return { success: true, status: 'ok', data: checklist };
  }
}

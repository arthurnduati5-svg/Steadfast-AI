import type { RecoveryCaseAdjudicationCommandContext, RecoveryCaseAdjudicationSafeEnvelope } from '../contracts/recoveryCaseAdjudicationContracts';
import type { RecoveryCaseQueueDisposition, CreateQueueDispositionInput } from '../contracts/recoveryCaseQueueDispositionContracts';
import type { RecoveryCaseQueueDispositionRepository, RecoveryCaseAdjudicationAuditRepository } from '../contracts/recoveryCaseAdjudicationRepositoryContracts';
import { isRoleAllowedForMutation } from '../policies/recoveryCaseAdjudicationPolicyDefinitions';

export class RecoveryCaseQueueDispositionService {
  constructor(
    private dispositionRepo: RecoveryCaseQueueDispositionRepository,
    private auditRepo: RecoveryCaseAdjudicationAuditRepository,
  ) {}

  async createQueueDisposition(
    ctx: RecoveryCaseAdjudicationCommandContext,
    input: CreateQueueDispositionInput,
  ): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseQueueDisposition>> {
    if (!isRoleAllowedForMutation(ctx.actorRole)) {
      return { success: false, status: 'error', message: 'Role not allowed for mutation', errorCode: 'FORBIDDEN_ROLE', correlationId: ctx.correlationId };
    }

    const disposition = await this.dispositionRepo.create({
      ...input,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    });

    await this.auditRepo.create({
      schoolId: ctx.schoolId,
      entityType: 'queue_disposition',
      entityId: disposition.queueDispositionId,
      action: 'create_queue_disposition',
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      correlationId: ctx.correlationId,
      safeMetadata: { sourceRefs: ctx.sourceRefsJson, dispositionCode: input.dispositionCode },
    });

    return { success: true, status: 'ok', data: disposition, correlationId: ctx.correlationId };
  }

  async getQueueDisposition(dispositionId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseQueueDisposition>> {
    const disposition = await this.dispositionRepo.getById(dispositionId);
    if (!disposition) {
      return { success: false, status: 'not_found', message: 'Queue disposition not found', errorCode: 'NOT_FOUND' };
    }
    return { success: true, status: 'ok', data: disposition };
  }

  async listQueueDispositionsForSchool(schoolId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseQueueDisposition[]>> {
    const items = await this.dispositionRepo.listBySchool(schoolId);
    return { success: true, status: 'ok', data: items };
  }

  async listQueueDispositionsForQueueItem(schoolId: string, queueItemId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseQueueDisposition[]>> {
    const items = await this.dispositionRepo.listByQueueItemId(schoolId, queueItemId);
    return { success: true, status: 'ok', data: items };
  }

  async listQueueDispositionsByCode(schoolId: string, code: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseQueueDisposition[]>> {
    const items = await this.dispositionRepo.listByCode(schoolId, code);
    return { success: true, status: 'ok', data: items };
  }

  async listQueueDispositionsByStatus(schoolId: string, status: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseQueueDisposition[]>> {
    const items = await this.dispositionRepo.listByStatus(schoolId, status);
    return { success: true, status: 'ok', data: items };
  }

  async markQueueDispositionReviewReady(dispositionId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseQueueDisposition>> {
    const disposition = await this.dispositionRepo.updateStatus(dispositionId, 'review_ready');
    await this.auditRepo.create({
      schoolId: disposition.schoolId,
      entityType: 'queue_disposition',
      entityId: dispositionId,
      action: 'mark_queue_disposition_review_ready',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: disposition.dispositionStatus },
    });
    return { success: true, status: 'ok', data: disposition };
  }

  async approveQueueDispositionForFutureUse(dispositionId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseQueueDisposition>> {
    const disposition = await this.dispositionRepo.updateStatus(dispositionId, 'approved_for_future_use');
    await this.auditRepo.create({
      schoolId: disposition.schoolId,
      entityType: 'queue_disposition',
      entityId: dispositionId,
      action: 'approve_queue_disposition_for_future_use',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: disposition.dispositionStatus },
    });
    return { success: true, status: 'ok', data: disposition };
  }

  async blockQueueDisposition(dispositionId: string, reasonCodes: string[]): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseQueueDisposition>> {
    const disposition = await this.dispositionRepo.updateStatus(dispositionId, 'blocked', reasonCodes);
    await this.auditRepo.create({
      schoolId: disposition.schoolId,
      entityType: 'queue_disposition',
      entityId: dispositionId,
      action: 'block_queue_disposition',
      actorId: '',
      actorRole: '',
      safeMetadata: { reasonCodes, previousStatus: disposition.dispositionStatus },
    });
    return { success: true, status: 'ok', data: disposition };
  }

  async suppressQueueDisposition(dispositionId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseQueueDisposition>> {
    const disposition = await this.dispositionRepo.updateStatus(dispositionId, 'suppressed');
    await this.auditRepo.create({
      schoolId: disposition.schoolId,
      entityType: 'queue_disposition',
      entityId: dispositionId,
      action: 'suppress_queue_disposition',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: disposition.dispositionStatus },
    });
    return { success: true, status: 'ok', data: disposition };
  }

  async voidQueueDisposition(dispositionId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseQueueDisposition>> {
    const disposition = await this.dispositionRepo.void(dispositionId);
    await this.auditRepo.create({
      schoolId: disposition.schoolId,
      entityType: 'queue_disposition',
      entityId: dispositionId,
      action: 'void_queue_disposition',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: disposition.dispositionStatus },
    });
    return { success: true, status: 'ok', data: disposition };
  }
}

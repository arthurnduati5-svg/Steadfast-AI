import { v4 as uuid } from 'uuid';
import { RecoveryCaseTriageCommandContext, RecoveryCaseTriageSafeEnvelope, RecoveryCaseDraftStatus } from '../contracts/recoveryCaseTriageContracts';
import { RecoveryCaseWorkloadAllocationDraft, CreateAllocationDraftRequest } from '../contracts/recoveryCaseAllocationDraftContracts';
import { RecoveryCaseWorkloadAllocationDraftRepository } from '../contracts/recoveryCaseTriageRepositoryContracts';
import { checkPolicy } from '../policies/recoveryCaseTriagePolicyDefinitions';

export class RecoveryCaseAllocationDraftService {
  constructor(private repo: RecoveryCaseWorkloadAllocationDraftRepository) {}

  async createAllocationDraft(ctx: RecoveryCaseTriageCommandContext, schoolId: string, body: CreateAllocationDraftRequest): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseWorkloadAllocationDraft>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_ALLOCATION_DRAFT_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const now = new Date().toISOString();
      const record = {
        allocationDraftId: uuid(),
        schoolId: ctx.schoolId,
        queueSnapshotId: body.queueSnapshotId,
        reviewerRef: body.reviewerRef,
        audienceRole: body.audienceRole,
        allocationDraftStatus: 'draft',
        allocatedItemIdsJson: body.allocatedItemIdsJson ?? [],
        totalAllocated: (body.allocatedItemIdsJson ?? []).length,
        safeAllocationSummary: body.safeAllocationSummary ?? `Allocation draft for ${body.reviewerRef}`,
        allocationDetailsJson: body.allocationDetailsJson ?? {},
        sourceRefsJson: body.sourceRefsJson ?? {},
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
        createdAt: now,
        updatedAt: now,
      };
      const created = await this.repo.create(record);
      return { success: true, data: created, status: 'created', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async getAllocationDraft(schoolId: string, id: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseWorkloadAllocationDraft>> {
    try {
      const record = await this.repo.getById(id);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Allocation draft not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listAllocationDraftsForSchool(schoolId: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseWorkloadAllocationDraft[]>> {
    try {
      const records = await this.repo.listBySchool(schoolId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listAllocationDraftsForQueue(queueSnapshotId: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseWorkloadAllocationDraft[]>> {
    try {
      const records = await this.repo.listByQueue(queueSnapshotId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listAllocationDraftsByReviewer(schoolId: string, reviewerRef: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseWorkloadAllocationDraft[]>> {
    try {
      const records = await this.repo.listByReviewer(schoolId, reviewerRef);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listAllocationDraftsByStatus(schoolId: string, status: RecoveryCaseDraftStatus | string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseWorkloadAllocationDraft[]>> {
    try {
      const records = await this.repo.listByStatus(schoolId, status);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markAllocationDraftReviewReady(ctx: RecoveryCaseTriageCommandContext, schoolId: string, id: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseWorkloadAllocationDraft>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_ALLOCATION_DRAFT_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.markReviewReady(id);
      return { success: true, data: updated, status: 'updated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async approveAllocationDraftForFutureUse(ctx: RecoveryCaseTriageCommandContext, schoolId: string, id: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseWorkloadAllocationDraft>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_ALLOCATION_DRAFT_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.approveFutureUse(id);
      return { success: true, data: updated, status: 'approved', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async blockAllocationDraft(ctx: RecoveryCaseTriageCommandContext, schoolId: string, id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseWorkloadAllocationDraft>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_ALLOCATION_DRAFT_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.block(id, reasonCode, safeMessage);
      return { success: true, data: updated, status: 'blocked', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async suppressAllocationDraft(ctx: RecoveryCaseTriageCommandContext, schoolId: string, id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseWorkloadAllocationDraft>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_ALLOCATION_DRAFT_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.suppress(id, reasonCode, safeMessage);
      return { success: true, data: updated, status: 'suppressed', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async voidAllocationDraft(ctx: RecoveryCaseTriageCommandContext, schoolId: string, id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseWorkloadAllocationDraft>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_ALLOCATION_DRAFT_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.void(id, reasonCode, safeMessage);
      return { success: true, data: updated, status: 'voided', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }
}

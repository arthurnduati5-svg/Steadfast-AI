import { v4 as uuid } from 'uuid';
import { RecoveryCaseTriageCommandContext, RecoveryCaseTriageSafeEnvelope, RecoveryCaseDraftStatus } from '../contracts/recoveryCaseTriageContracts';
import { RecoveryCaseReviewWindowDraft, CreateReviewWindowDraftRequest } from '../contracts/recoveryCaseReviewWindowDraftContracts';
import { RecoveryCaseReviewWindowDraftRepository } from '../contracts/recoveryCaseTriageRepositoryContracts';
import { checkPolicy } from '../policies/recoveryCaseTriagePolicyDefinitions';

export class RecoveryCaseReviewWindowDraftService {
  constructor(private repo: RecoveryCaseReviewWindowDraftRepository) {}

  async createReviewWindowDraft(ctx: RecoveryCaseTriageCommandContext, schoolId: string, body: CreateReviewWindowDraftRequest): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseReviewWindowDraft>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_REVIEW_WINDOW_DRAFT_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };

      const windowStart = new Date(body.windowStartAt);
      const windowEnd = new Date(body.windowEndAt);
      if (isNaN(windowStart.getTime())) return { success: false, status: 'DENIED', message: 'Invalid windowStartAt date', correlationId: ctx.correlationId };
      if (isNaN(windowEnd.getTime())) return { success: false, status: 'DENIED', message: 'Invalid windowEndAt date', correlationId: ctx.correlationId };
      if (windowEnd <= windowStart) return { success: false, status: 'DENIED', message: 'windowEnd must be after windowStart', correlationId: ctx.correlationId };

      const now = new Date().toISOString();
      const record = {
        reviewWindowDraftId: uuid(),
        schoolId: ctx.schoolId,
        queueSnapshotId: body.queueSnapshotId,
        reviewerRef: body.reviewerRef,
        audienceRole: body.audienceRole,
        reviewWindowDraftStatus: 'draft',
        windowStartAt: body.windowStartAt,
        windowEndAt: body.windowEndAt,
        maxCapacity: body.maxCapacity,
        safeWindowSummary: body.safeWindowSummary ?? `Review window ${body.windowStartAt} - ${body.windowEndAt}`,
        windowDetailsJson: body.windowDetailsJson ?? {},
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

  async getReviewWindowDraft(schoolId: string, id: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseReviewWindowDraft>> {
    try {
      const record = await this.repo.getById(id);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Review window draft not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listReviewWindowDraftsForSchool(schoolId: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseReviewWindowDraft[]>> {
    try {
      const records = await this.repo.listBySchool(schoolId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listReviewWindowDraftsForQueue(queueSnapshotId: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseReviewWindowDraft[]>> {
    try {
      const records = await this.repo.listByQueue(queueSnapshotId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listReviewWindowDraftsByReviewer(schoolId: string, reviewerRef: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseReviewWindowDraft[]>> {
    try {
      const records = await this.repo.listByReviewer(schoolId, reviewerRef);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listReviewWindowDraftsByStatus(schoolId: string, status: RecoveryCaseDraftStatus | string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseReviewWindowDraft[]>> {
    try {
      const records = await this.repo.listByStatus(schoolId, status);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markReviewWindowDraftReviewReady(ctx: RecoveryCaseTriageCommandContext, schoolId: string, id: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseReviewWindowDraft>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_REVIEW_WINDOW_DRAFT_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.markReviewReady(id);
      return { success: true, data: updated, status: 'updated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async approveReviewWindowForFutureUse(ctx: RecoveryCaseTriageCommandContext, schoolId: string, id: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseReviewWindowDraft>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_REVIEW_WINDOW_DRAFT_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.approveFutureUse(id);
      return { success: true, data: updated, status: 'approved', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async blockReviewWindowDraft(ctx: RecoveryCaseTriageCommandContext, schoolId: string, id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseReviewWindowDraft>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_REVIEW_WINDOW_DRAFT_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.block(id, reasonCode, safeMessage);
      return { success: true, data: updated, status: 'blocked', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async suppressReviewWindowDraft(ctx: RecoveryCaseTriageCommandContext, schoolId: string, id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseReviewWindowDraft>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_REVIEW_WINDOW_DRAFT_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.suppress(id, reasonCode, safeMessage);
      return { success: true, data: updated, status: 'suppressed', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async voidReviewWindowDraft(ctx: RecoveryCaseTriageCommandContext, schoolId: string, id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseReviewWindowDraft>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_REVIEW_WINDOW_DRAFT_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.void(id, reasonCode, safeMessage);
      return { success: true, data: updated, status: 'voided', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }
}

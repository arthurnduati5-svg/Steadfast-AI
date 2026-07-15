import { RecoveryContinuationActionDraftRepository } from '../contracts/recoveryOutcomeActionRepositoryContracts';
import { RecoveryContinuationActionDraft, CreateContinuationActionDraftRequest } from '../contracts/recoveryActionDraftContracts';
import { RecoveryOutcomeActionCommandContext, RecoveryOutcomeActionSafeEnvelope } from '../contracts/recoveryOutcomeActionContracts';
import { RecoveryOutcomeActionSafetyService } from './recoveryOutcomeActionSafetyService';
import { RecoveryOutcomeActionAuditBridge } from './recoveryOutcomeActionAuditBridge';
import { RecoveryOutcomeActionIdempotencyService } from './recoveryOutcomeActionIdempotencyService';
import { v4 as uuid } from 'uuid';

export class RecoveryContinuationActionDraftService {
  constructor(
    private repo: RecoveryContinuationActionDraftRepository,
    private safety: RecoveryOutcomeActionSafetyService,
    private audit: RecoveryOutcomeActionAuditBridge,
    private idempotency: RecoveryOutcomeActionIdempotencyService,
  ) {}

  async createContinuationActionDraft(ctx: RecoveryOutcomeActionCommandContext, req: CreateContinuationActionDraftRequest): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryContinuationActionDraft>> {
    try {
      this.safety.validateSchoolContext(ctx.schoolId);
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_CONTINUATION_ACTION_DRAFT_CREATION');
      this.safety.validatePackage19Ref(req.recoveryContinuationDecisionDraftId, 'recoveryContinuationDecisionDraftId');
      const { isDuplicate } = await this.idempotency.processIdempotency(ctx, 'createContinuationActionDraft', req as any);
      if (isDuplicate) return { success: false, status: 'DUPLICATE', message: 'Duplicate', idempotencyKey: ctx.idempotencyKey };
      const now = new Date();
      const record: RecoveryContinuationActionDraft = {
        continuationActionDraftId: uuid(), schoolId: req.schoolId, studentRef: req.studentRef,
        resultRecoveryPlanId: req.resultRecoveryPlanId, recoveryContinuationDecisionDraftId: req.recoveryContinuationDecisionDraftId,
        recoveryOutcomeDecisionSummaryId: req.recoveryOutcomeDecisionSummaryId, draftStatus: 'draft',
        safeActionSummary: req.safeActionSummary, actionDetailsJson: req.actionDetailsJson, blockedReasonCodesJson: [],
        sourceRefsJson: req.sourceRefsJson ?? {}, createdByActorId: req.createdByActorId, createdByRole: req.createdByRole,
        createdAt: now, updatedAt: now,
      };
      const created = await this.repo.create(record);
      await this.audit.record(ctx, 'CONTINUATION_ACTION_DRAFT_CREATED', 'created', `Continuation draft ${created.continuationActionDraftId}`, { continuationActionDraftId: created.continuationActionDraftId });
      await this.idempotency.markCompleted(ctx, 'RecoveryContinuationActionDraft', created.continuationActionDraftId);
      return { success: true, data: created, status: 'created', idempotencyKey: ctx.idempotencyKey };
    } catch (err: any) { return { success: false, status: 'error', message: err.message, idempotencyKey: ctx.idempotencyKey }; }
  }

  async getActionDraft(id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryContinuationActionDraft>> {
    try {
      const record = await this.repo.getById(id);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listActionDraftsForPlan(schoolId: string, planId: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryContinuationActionDraft[]>> {
    try { return { success: true, data: await this.repo.listByPlanId(schoolId, planId), status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listActionDraftsForStudent(schoolId: string, studentRef: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryContinuationActionDraft[]>> {
    try { return { success: true, data: await this.repo.listByStudentRef(schoolId, studentRef), status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listActionDraftsByStatus(schoolId: string, status: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryContinuationActionDraft[]>> {
    try { return { success: true, data: await this.repo.listByStatus(schoolId, status as any), status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async markActionDraftReviewReady(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryContinuationActionDraft>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_CONTINUATION_ACTION_DRAFT_CREATION');
      const updated = await this.repo.markReviewReady(id);
      await this.audit.record(ctx, 'CONTINUATION_DRAFT_REVIEW_READY', 'updated', `Draft ${id} review ready`, { continuationActionDraftId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async approveActionDraftForFutureUse(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryContinuationActionDraft>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_CONTINUATION_ACTION_DRAFT_CREATION');
      const updated = await this.repo.approveForFutureUse(id);
      await this.audit.record(ctx, 'CONTINUATION_DRAFT_APPROVED', 'updated', `Draft ${id} approved`, { continuationActionDraftId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async suppressActionDraft(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryContinuationActionDraft>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_CONTINUATION_ACTION_DRAFT_CREATION');
      const updated = await this.repo.suppress(id);
      await this.audit.record(ctx, 'CONTINUATION_DRAFT_SUPPRESSED', 'updated', `Draft ${id} suppressed`, { continuationActionDraftId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async blockActionDraft(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryContinuationActionDraft>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_CONTINUATION_ACTION_DRAFT_CREATION');
      const updated = await this.repo.block(id);
      await this.audit.record(ctx, 'CONTINUATION_DRAFT_BLOCKED', 'updated', `Draft ${id} blocked`, { continuationActionDraftId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async voidActionDraft(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryContinuationActionDraft>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_CONTINUATION_ACTION_DRAFT_CREATION');
      const updated = await this.repo.void(id);
      await this.audit.record(ctx, 'CONTINUATION_DRAFT_VOIDED', 'updated', `Draft ${id} voided`, { continuationActionDraftId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }
}

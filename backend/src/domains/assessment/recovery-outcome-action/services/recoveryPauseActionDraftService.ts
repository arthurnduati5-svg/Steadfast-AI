import { RecoveryPauseActionDraftRepository } from '../contracts/recoveryOutcomeActionRepositoryContracts';
import { RecoveryPauseActionDraft, CreatePauseActionDraftRequest } from '../contracts/recoveryActionDraftContracts';
import { RecoveryOutcomeActionCommandContext, RecoveryOutcomeActionSafeEnvelope } from '../contracts/recoveryOutcomeActionContracts';
import { RecoveryOutcomeActionSafetyService } from './recoveryOutcomeActionSafetyService';
import { RecoveryOutcomeActionAuditBridge } from './recoveryOutcomeActionAuditBridge';
import { RecoveryOutcomeActionIdempotencyService } from './recoveryOutcomeActionIdempotencyService';
import { v4 as uuid } from 'uuid';

export class RecoveryPauseActionDraftService {
  constructor(
    private repo: RecoveryPauseActionDraftRepository,
    private safety: RecoveryOutcomeActionSafetyService,
    private audit: RecoveryOutcomeActionAuditBridge,
    private idempotency: RecoveryOutcomeActionIdempotencyService,
  ) {}

  async createPauseActionDraft(ctx: RecoveryOutcomeActionCommandContext, req: CreatePauseActionDraftRequest): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryPauseActionDraft>> {
    try {
      this.safety.validateSchoolContext(ctx.schoolId);
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_PAUSE_ACTION_DRAFT_CREATION');
      this.safety.validatePackage19Ref(req.recoveryPauseDecisionDraftId, 'recoveryPauseDecisionDraftId');
      const { isDuplicate } = await this.idempotency.processIdempotency(ctx, 'createPauseActionDraft', req as any);
      if (isDuplicate) return { success: false, status: 'DUPLICATE', message: 'Duplicate', idempotencyKey: ctx.idempotencyKey };
      const now = new Date();
      const record: RecoveryPauseActionDraft = {
        pauseActionDraftId: uuid(), schoolId: req.schoolId, studentRef: req.studentRef,
        resultRecoveryPlanId: req.resultRecoveryPlanId, recoveryPauseDecisionDraftId: req.recoveryPauseDecisionDraftId,
        recoveryOutcomeDecisionSummaryId: req.recoveryOutcomeDecisionSummaryId, draftStatus: 'draft',
        safeActionSummary: req.safeActionSummary, pauseDetailsJson: req.pauseDetailsJson, blockedReasonCodesJson: [],
        sourceRefsJson: req.sourceRefsJson ?? {}, createdByActorId: req.createdByActorId, createdByRole: req.createdByRole,
        createdAt: now, updatedAt: now,
      };
      const created = await this.repo.create(record);
      await this.audit.record(ctx, 'PAUSE_ACTION_DRAFT_CREATED', 'created', `Pause draft ${created.pauseActionDraftId}`, { pauseActionDraftId: created.pauseActionDraftId });
      await this.idempotency.markCompleted(ctx, 'RecoveryPauseActionDraft', created.pauseActionDraftId);
      return { success: true, data: created, status: 'created', idempotencyKey: ctx.idempotencyKey };
    } catch (err: any) { return { success: false, status: 'error', message: err.message, idempotencyKey: ctx.idempotencyKey }; }
  }

  async getActionDraft(id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryPauseActionDraft>> {
    try { const d = await this.repo.getById(id); if (!d) return { success: false, status: 'NOT_FOUND' }; return { success: true, data: d, status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listActionDraftsForPlan(schoolId: string, planId: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryPauseActionDraft[]>> {
    try { return { success: true, data: await this.repo.listByPlanId(schoolId, planId), status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listActionDraftsForStudent(schoolId: string, studentRef: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryPauseActionDraft[]>> {
    try { return { success: true, data: await this.repo.listByStudentRef(schoolId, studentRef), status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async markActionDraftReviewReady(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryPauseActionDraft>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_PAUSE_ACTION_DRAFT_CREATION');
      const updated = await this.repo.markReviewReady(id);
      await this.audit.record(ctx, 'PAUSE_DRAFT_REVIEW_READY', 'updated', `Draft ${id} review ready`, { pauseActionDraftId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async approveActionDraftForFutureUse(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryPauseActionDraft>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_PAUSE_ACTION_DRAFT_CREATION');
      const updated = await this.repo.approveForFutureUse(id);
      await this.audit.record(ctx, 'PAUSE_DRAFT_APPROVED', 'updated', `Draft ${id} approved`, { pauseActionDraftId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async suppressActionDraft(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryPauseActionDraft>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_PAUSE_ACTION_DRAFT_CREATION');
      const updated = await this.repo.suppress(id);
      await this.audit.record(ctx, 'PAUSE_DRAFT_SUPPRESSED', 'updated', `Draft ${id} suppressed`, { pauseActionDraftId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async blockActionDraft(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryPauseActionDraft>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_PAUSE_ACTION_DRAFT_CREATION');
      const updated = await this.repo.block(id);
      await this.audit.record(ctx, 'PAUSE_DRAFT_BLOCKED', 'updated', `Draft ${id} blocked`, { pauseActionDraftId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async voidActionDraft(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryPauseActionDraft>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_PAUSE_ACTION_DRAFT_CREATION');
      const updated = await this.repo.void(id);
      await this.audit.record(ctx, 'PAUSE_DRAFT_VOIDED', 'updated', `Draft ${id} voided`, { pauseActionDraftId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }
}

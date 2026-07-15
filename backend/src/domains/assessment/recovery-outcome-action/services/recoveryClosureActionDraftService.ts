import { RecoveryClosureActionDraftRepository } from '../contracts/recoveryOutcomeActionRepositoryContracts';
import { RecoveryClosureActionDraft, CreateClosureActionDraftRequest } from '../contracts/recoveryActionDraftContracts';
import { RecoveryOutcomeActionCommandContext, RecoveryOutcomeActionSafeEnvelope } from '../contracts/recoveryOutcomeActionContracts';
import { RecoveryOutcomeActionSafetyService } from './recoveryOutcomeActionSafetyService';
import { RecoveryOutcomeActionAuditBridge } from './recoveryOutcomeActionAuditBridge';
import { RecoveryOutcomeActionIdempotencyService } from './recoveryOutcomeActionIdempotencyService';
import { v4 as uuid } from 'uuid';

export class RecoveryClosureActionDraftService {
  constructor(
    private repo: RecoveryClosureActionDraftRepository,
    private safety: RecoveryOutcomeActionSafetyService,
    private audit: RecoveryOutcomeActionAuditBridge,
    private idempotency: RecoveryOutcomeActionIdempotencyService,
  ) {}

  async createClosureActionDraft(ctx: RecoveryOutcomeActionCommandContext, req: CreateClosureActionDraftRequest): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryClosureActionDraft>> {
    try {
      this.safety.validateSchoolContext(ctx.schoolId);
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_CLOSURE_ACTION_DRAFT_CREATION');
      this.safety.validatePackage19Ref(req.recoveryClosureDecisionDraftId, 'recoveryClosureDecisionDraftId');
      const { isDuplicate } = await this.idempotency.processIdempotency(ctx, 'createClosureActionDraft', req as any);
      if (isDuplicate) return { success: false, status: 'DUPLICATE', message: 'Duplicate', idempotencyKey: ctx.idempotencyKey };
      const now = new Date();
      const record: RecoveryClosureActionDraft = {
        closureActionDraftId: uuid(), schoolId: req.schoolId, studentRef: req.studentRef,
        resultRecoveryPlanId: req.resultRecoveryPlanId, recoveryClosureDecisionDraftId: req.recoveryClosureDecisionDraftId,
        recoveryOutcomeDecisionSummaryId: req.recoveryOutcomeDecisionSummaryId, draftStatus: 'draft',
        safeActionSummary: req.safeActionSummary, closureDetailsJson: req.closureDetailsJson,
        closureType: req.closureType, blockedReasonCodesJson: [],
        sourceRefsJson: req.sourceRefsJson ?? {}, createdByActorId: req.createdByActorId, createdByRole: req.createdByRole,
        createdAt: now, updatedAt: now,
      };
      const created = await this.repo.create(record);
      await this.audit.record(ctx, 'CLOSURE_ACTION_DRAFT_CREATED', 'created', `Closure draft ${created.closureActionDraftId}`, { closureActionDraftId: created.closureActionDraftId });
      await this.idempotency.markCompleted(ctx, 'RecoveryClosureActionDraft', created.closureActionDraftId);
      return { success: true, data: created, status: 'created', idempotencyKey: ctx.idempotencyKey };
    } catch (err: any) { return { success: false, status: 'error', message: err.message, idempotencyKey: ctx.idempotencyKey }; }
  }

  async getActionDraft(id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryClosureActionDraft>> {
    try { const d = await this.repo.getById(id); if (!d) return { success: false, status: 'NOT_FOUND' }; return { success: true, data: d, status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listActionDraftsForPlan(schoolId: string, planId: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryClosureActionDraft[]>> {
    try { return { success: true, data: await this.repo.listByPlanId(schoolId, planId), status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listActionDraftsForStudent(schoolId: string, studentRef: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryClosureActionDraft[]>> {
    try { return { success: true, data: await this.repo.listByStudentRef(schoolId, studentRef), status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listActionDraftsByStatus(schoolId: string, status: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryClosureActionDraft[]>> {
    try { return { success: true, data: await this.repo.listByStatus(schoolId, status as any), status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async markActionDraftReviewReady(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryClosureActionDraft>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_CLOSURE_ACTION_DRAFT_CREATION');
      const updated = await this.repo.markReviewReady(id);
      await this.audit.record(ctx, 'CLOSURE_DRAFT_REVIEW_READY', 'updated', `Draft ${id} review ready`, { closureActionDraftId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async approveActionDraftForFutureUse(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryClosureActionDraft>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_CLOSURE_ACTION_DRAFT_CREATION');
      const updated = await this.repo.approveForFutureUse(id);
      await this.audit.record(ctx, 'CLOSURE_DRAFT_APPROVED', 'updated', `Draft ${id} approved`, { closureActionDraftId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async suppressActionDraft(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryClosureActionDraft>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_CLOSURE_ACTION_DRAFT_CREATION');
      const updated = await this.repo.suppress(id);
      await this.audit.record(ctx, 'CLOSURE_DRAFT_SUPPRESSED', 'updated', `Draft ${id} suppressed`, { closureActionDraftId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async blockActionDraft(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryClosureActionDraft>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_CLOSURE_ACTION_DRAFT_CREATION');
      const updated = await this.repo.block(id);
      await this.audit.record(ctx, 'CLOSURE_DRAFT_BLOCKED', 'updated', `Draft ${id} blocked`, { closureActionDraftId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async voidActionDraft(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryClosureActionDraft>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_CLOSURE_ACTION_DRAFT_CREATION');
      const updated = await this.repo.void(id);
      await this.audit.record(ctx, 'CLOSURE_DRAFT_VOIDED', 'updated', `Draft ${id} voided`, { closureActionDraftId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }
}

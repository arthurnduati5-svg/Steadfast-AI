import { IStudentPreviewDraftRepository, IParentPreviewDraftRepository } from '../contracts/recoveryOutcomeExecutionSimulationRepositoryContracts';
import { RecoveryOutcomeExecutionStudentPreviewDraft, RecoveryOutcomeExecutionParentPreviewDraft, CreateStudentPreviewDraftRequest, CreateParentPreviewDraftRequest } from '../contracts/recoveryOutcomeExecutionPreviewDraftContracts';
import { RecoveryOutcomeExecutionSimulationCommandContext, RecoveryOutcomeExecutionSimulationSafeEnvelope } from '../contracts/recoveryOutcomeExecutionSimulationContracts';
import { RecoveryOutcomeExecutionSimulationSafetyService } from './recoveryOutcomeExecutionSimulationSafetyService';
import { RecoveryOutcomeExecutionSimulationAuditBridge } from './recoveryOutcomeExecutionSimulationAuditBridge';
import { RecoveryOutcomeExecutionSimulationIdempotencyService } from './recoveryOutcomeExecutionSimulationIdempotencyService';
import { v4 as uuid } from 'uuid';

export class RecoveryOutcomeExecutionPreviewDraftService {
  constructor(
    private studentRepo: IStudentPreviewDraftRepository,
    private parentRepo: IParentPreviewDraftRepository,
    private safety: RecoveryOutcomeExecutionSimulationSafetyService,
    private audit: RecoveryOutcomeExecutionSimulationAuditBridge,
    private idempotency: RecoveryOutcomeExecutionSimulationIdempotencyService,
  ) {}

  async createStudentPreviewDraft(
    ctx: RecoveryOutcomeExecutionSimulationCommandContext,
    req: CreateStudentPreviewDraftRequest,
  ): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionStudentPreviewDraft>> {
    try {
      this.safety.validateSchoolContext(ctx.schoolId);
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_STUDENT_PREVIEW_DRAFT_CREATION');

      const existing = await this.idempotency.checkIdempotency(ctx.schoolId, 'createStudentPreviewDraft', ctx.idempotencyKey);
      if (existing && existing.status === 'completed') {
        return { success: false, status: 'DUPLICATE', message: 'Idempotency key already processed', idempotencyKey: ctx.idempotencyKey };
      }

      const blockedCodes = this.safety.validateContent(req.safeStudentPreviewSummary, req.previewContentJson ?? {});
      if (blockedCodes.length > 0) {
        return { success: false, status: 'BLOCKED', message: 'Content validation failed', blockedReasonCodes: blockedCodes, idempotencyKey: ctx.idempotencyKey };
      }

      const requestHash = await this.idempotency.computeRequestHash('createStudentPreviewDraft', req as any);
      await this.idempotency.createIdempotencyEntry(ctx.schoolId, 'createStudentPreviewDraft', ctx.idempotencyKey, requestHash);

      const now = new Date().toISOString();
      const record: Partial<RecoveryOutcomeExecutionStudentPreviewDraft> = {
        studentPreviewDraftId: uuid(),
        schoolId: ctx.schoolId,
        studentRef: req.studentRef,
        resultRecoveryPlanId: req.resultRecoveryPlanId,
        simulationRunId: req.simulationRunId,
        draftStatus: 'draft',
        safeStudentPreviewSummary: req.safeStudentPreviewSummary,
        previewContentJson: req.previewContentJson ?? {},
        blockedReasonCodesJson: [],
        sourceRefsJson: req.sourceRefsJson ?? {},
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
        createdAt: now,
        updatedAt: now,
      };

      const created = await this.studentRepo.create(record);
      await this.audit.recordSimulationEvent(ctx, 'STUDENT_PREVIEW_DRAFT_CREATED', 'created', `Student preview draft ${created.studentPreviewDraftId} created`, { studentPreviewDraftId: created.studentPreviewDraftId });
      await this.idempotency.markCompleted(ctx.schoolId, 'createStudentPreviewDraft', ctx.idempotencyKey, `Student preview draft ${created.studentPreviewDraftId} created`);

      return { success: true, data: created, status: 'created', idempotencyKey: ctx.idempotencyKey };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, idempotencyKey: ctx.idempotencyKey };
    }
  }

  async createParentPreviewDraft(
    ctx: RecoveryOutcomeExecutionSimulationCommandContext,
    req: CreateParentPreviewDraftRequest,
  ): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionParentPreviewDraft>> {
    try {
      this.safety.validateSchoolContext(ctx.schoolId);
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_PARENT_PREVIEW_DRAFT_CREATION');

      const existing = await this.idempotency.checkIdempotency(ctx.schoolId, 'createParentPreviewDraft', ctx.idempotencyKey);
      if (existing && existing.status === 'completed') {
        return { success: false, status: 'DUPLICATE', message: 'Idempotency key already processed', idempotencyKey: ctx.idempotencyKey };
      }

      const blockedCodes = this.safety.validateContent(req.safeParentPreviewSummary, req.previewContentJson ?? {});
      if (blockedCodes.length > 0) {
        return { success: false, status: 'BLOCKED', message: 'Content validation failed', blockedReasonCodes: blockedCodes, idempotencyKey: ctx.idempotencyKey };
      }

      const requestHash = await this.idempotency.computeRequestHash('createParentPreviewDraft', req as any);
      await this.idempotency.createIdempotencyEntry(ctx.schoolId, 'createParentPreviewDraft', ctx.idempotencyKey, requestHash);

      const now = new Date().toISOString();
      const record: Partial<RecoveryOutcomeExecutionParentPreviewDraft> = {
        parentPreviewDraftId: uuid(),
        schoolId: ctx.schoolId,
        studentRef: req.studentRef,
        resultRecoveryPlanId: req.resultRecoveryPlanId,
        simulationRunId: req.simulationRunId,
        draftStatus: 'draft',
        safeParentPreviewSummary: req.safeParentPreviewSummary,
        previewContentJson: req.previewContentJson ?? {},
        blockedReasonCodesJson: [],
        sourceRefsJson: req.sourceRefsJson ?? {},
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
        createdAt: now,
        updatedAt: now,
      };

      const created = await this.parentRepo.create(record);
      await this.audit.recordSimulationEvent(ctx, 'PARENT_PREVIEW_DRAFT_CREATED', 'created', `Parent preview draft ${created.parentPreviewDraftId} created`, { parentPreviewDraftId: created.parentPreviewDraftId });
      await this.idempotency.markCompleted(ctx.schoolId, 'createParentPreviewDraft', ctx.idempotencyKey, `Parent preview draft ${created.parentPreviewDraftId} created`);

      return { success: true, data: created, status: 'created', idempotencyKey: ctx.idempotencyKey };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, idempotencyKey: ctx.idempotencyKey };
    }
  }

  async getStudentPreviewDraft(schoolId: string, studentPreviewDraftId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionStudentPreviewDraft>> {
    try {
      const record = await this.studentRepo.getById(studentPreviewDraftId);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Student preview draft not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async getParentPreviewDraft(schoolId: string, parentPreviewDraftId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionParentPreviewDraft>> {
    try {
      const record = await this.parentRepo.getById(parentPreviewDraftId);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Parent preview draft not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listStudentPreviewDraftsForPlan(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionStudentPreviewDraft[]>> {
    try {
      const records = await this.studentRepo.listByPlanId(schoolId, resultRecoveryPlanId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listParentPreviewDraftsForPlan(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionParentPreviewDraft[]>> {
    try {
      const records = await this.parentRepo.listByPlanId(schoolId, resultRecoveryPlanId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listStudentPreviewDraftsByStatus(schoolId: string, draftStatus: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionStudentPreviewDraft[]>> {
    try {
      const records = await this.studentRepo.listByStatus(schoolId, draftStatus);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listParentPreviewDraftsByStatus(schoolId: string, draftStatus: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionParentPreviewDraft[]>> {
    try {
      const records = await this.parentRepo.listByStatus(schoolId, draftStatus);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markStudentPreviewDraftReviewReady(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, studentPreviewDraftId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionStudentPreviewDraft>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_STUDENT_PREVIEW_DRAFT_CREATION');
      const updated = await this.studentRepo.markReviewReady(studentPreviewDraftId);
      await this.audit.recordSimulationEvent(ctx, 'STUDENT_PREVIEW_DRAFT_REVIEW_READY', 'updated', `Student preview draft ${studentPreviewDraftId} marked review ready`, { studentPreviewDraftId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markParentPreviewDraftReviewReady(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, parentPreviewDraftId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionParentPreviewDraft>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_PARENT_PREVIEW_DRAFT_CREATION');
      const updated = await this.parentRepo.markReviewReady(parentPreviewDraftId);
      await this.audit.recordSimulationEvent(ctx, 'PARENT_PREVIEW_DRAFT_REVIEW_READY', 'updated', `Parent preview draft ${parentPreviewDraftId} marked review ready`, { parentPreviewDraftId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async approveStudentPreviewDraftForFutureUse(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, studentPreviewDraftId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionStudentPreviewDraft>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_STUDENT_PREVIEW_DRAFT_CREATION');
      const updated = await this.studentRepo.approveForFutureUse(studentPreviewDraftId);
      await this.audit.recordSimulationEvent(ctx, 'STUDENT_PREVIEW_DRAFT_APPROVED', 'updated', `Student preview draft ${studentPreviewDraftId} approved for future use`, { studentPreviewDraftId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async approveParentPreviewDraftForFutureUse(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, parentPreviewDraftId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionParentPreviewDraft>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_PARENT_PREVIEW_DRAFT_CREATION');
      const updated = await this.parentRepo.approveForFutureUse(parentPreviewDraftId);
      await this.audit.recordSimulationEvent(ctx, 'PARENT_PREVIEW_DRAFT_APPROVED', 'updated', `Parent preview draft ${parentPreviewDraftId} approved for future use`, { parentPreviewDraftId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async suppressStudentPreviewDraft(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, studentPreviewDraftId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionStudentPreviewDraft>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_STUDENT_PREVIEW_DRAFT_CREATION');
      const updated = await this.studentRepo.suppress(studentPreviewDraftId);
      await this.audit.recordSimulationEvent(ctx, 'STUDENT_PREVIEW_DRAFT_SUPPRESSED', 'updated', `Student preview draft ${studentPreviewDraftId} suppressed`, { studentPreviewDraftId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async suppressParentPreviewDraft(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, parentPreviewDraftId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionParentPreviewDraft>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_PARENT_PREVIEW_DRAFT_CREATION');
      const updated = await this.parentRepo.suppress(parentPreviewDraftId);
      await this.audit.recordSimulationEvent(ctx, 'PARENT_PREVIEW_DRAFT_SUPPRESSED', 'updated', `Parent preview draft ${parentPreviewDraftId} suppressed`, { parentPreviewDraftId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async blockStudentPreviewDraft(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, studentPreviewDraftId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionStudentPreviewDraft>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_STUDENT_PREVIEW_DRAFT_CREATION');
      const updated = await this.studentRepo.block(studentPreviewDraftId);
      await this.audit.recordSimulationEvent(ctx, 'STUDENT_PREVIEW_DRAFT_BLOCKED', 'updated', `Student preview draft ${studentPreviewDraftId} blocked`, { studentPreviewDraftId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async blockParentPreviewDraft(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, parentPreviewDraftId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionParentPreviewDraft>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_PARENT_PREVIEW_DRAFT_CREATION');
      const updated = await this.parentRepo.block(parentPreviewDraftId);
      await this.audit.recordSimulationEvent(ctx, 'PARENT_PREVIEW_DRAFT_BLOCKED', 'updated', `Parent preview draft ${parentPreviewDraftId} blocked`, { parentPreviewDraftId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async voidStudentPreviewDraft(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, studentPreviewDraftId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionStudentPreviewDraft>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_STUDENT_PREVIEW_DRAFT_CREATION');
      const updated = await this.studentRepo.void(studentPreviewDraftId);
      await this.audit.recordSimulationEvent(ctx, 'STUDENT_PREVIEW_DRAFT_VOIDED', 'updated', `Student preview draft ${studentPreviewDraftId} voided`, { studentPreviewDraftId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async voidParentPreviewDraft(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, parentPreviewDraftId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionParentPreviewDraft>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_PARENT_PREVIEW_DRAFT_CREATION');
      const updated = await this.parentRepo.void(parentPreviewDraftId);
      await this.audit.recordSimulationEvent(ctx, 'PARENT_PREVIEW_DRAFT_VOIDED', 'updated', `Parent preview draft ${parentPreviewDraftId} voided`, { parentPreviewDraftId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }
}

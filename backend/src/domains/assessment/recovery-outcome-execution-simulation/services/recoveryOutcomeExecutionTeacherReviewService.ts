import { ITeacherReviewRepository } from '../contracts/recoveryOutcomeExecutionSimulationRepositoryContracts';
import { RecoveryOutcomeExecutionTeacherReview, CreateTeacherReviewRequest } from '../contracts/recoveryOutcomeExecutionTeacherReviewContracts';
import { RecoveryOutcomeExecutionSimulationCommandContext, RecoveryOutcomeExecutionSimulationSafeEnvelope } from '../contracts/recoveryOutcomeExecutionSimulationContracts';
import { RecoveryOutcomeExecutionSimulationSafetyService } from './recoveryOutcomeExecutionSimulationSafetyService';
import { RecoveryOutcomeExecutionSimulationAuditBridge } from './recoveryOutcomeExecutionSimulationAuditBridge';
import { RecoveryOutcomeExecutionSimulationIdempotencyService } from './recoveryOutcomeExecutionSimulationIdempotencyService';
import { v4 as uuid } from 'uuid';

export class RecoveryOutcomeExecutionTeacherReviewService {
  constructor(
    private repo: ITeacherReviewRepository,
    private safety: RecoveryOutcomeExecutionSimulationSafetyService,
    private audit: RecoveryOutcomeExecutionSimulationAuditBridge,
    private idempotency: RecoveryOutcomeExecutionSimulationIdempotencyService,
  ) {}

  async createTeacherSimulationReview(
    ctx: RecoveryOutcomeExecutionSimulationCommandContext,
    req: CreateTeacherReviewRequest,
  ): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionTeacherReview>> {
    try {
      this.safety.validateSchoolContext(ctx.schoolId);
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_TEACHER_REVIEW_CREATION');

      const existing = await this.idempotency.checkIdempotency(ctx.schoolId, 'createTeacherSimulationReview', ctx.idempotencyKey);
      if (existing && existing.status === 'completed') {
        return { success: false, status: 'DUPLICATE', message: 'Idempotency key already processed', idempotencyKey: ctx.idempotencyKey };
      }

      const blockedCodes = this.safety.validateContent(req.safeTeacherReviewSummary, req.teacherReviewNotesJson ?? {});
      if (blockedCodes.length > 0) {
        return { success: false, status: 'BLOCKED', message: 'Content validation failed', blockedReasonCodes: blockedCodes, idempotencyKey: ctx.idempotencyKey };
      }

      const requestHash = await this.idempotency.computeRequestHash('createTeacherSimulationReview', req as any);
      await this.idempotency.createIdempotencyEntry(ctx.schoolId, 'createTeacherSimulationReview', ctx.idempotencyKey, requestHash);

      const now = new Date().toISOString();
      const record: Partial<RecoveryOutcomeExecutionTeacherReview> = {
        teacherSimulationReviewId: uuid(),
        schoolId: ctx.schoolId,
        teacherRef: req.teacherRef,
        studentRef: req.studentRef,
        resultRecoveryPlanId: req.resultRecoveryPlanId,
        simulationRunId: req.simulationRunId,
        reviewStatus: 'draft',
        safeTeacherReviewSummary: req.safeTeacherReviewSummary,
        teacherReviewNotesJson: req.teacherReviewNotesJson ?? {},
        blockedReasonCodesJson: [],
        sourceRefsJson: req.sourceRefsJson ?? {},
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
        createdAt: now,
        updatedAt: now,
      };

      const created = await this.repo.create(record);
      await this.audit.recordSimulationEvent(ctx, 'TEACHER_SIMULATION_REVIEW_CREATED', 'created', `Teacher simulation review ${created.teacherSimulationReviewId} created`, { teacherSimulationReviewId: created.teacherSimulationReviewId });
      await this.idempotency.markCompleted(ctx.schoolId, 'createTeacherSimulationReview', ctx.idempotencyKey, `Teacher simulation review ${created.teacherSimulationReviewId} created`);

      return { success: true, data: created, status: 'created', idempotencyKey: ctx.idempotencyKey };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, idempotencyKey: ctx.idempotencyKey };
    }
  }

  async getTeacherSimulationReview(schoolId: string, teacherSimulationReviewId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionTeacherReview>> {
    try {
      const record = await this.repo.getById(teacherSimulationReviewId);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Teacher simulation review not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listTeacherSimulationReviewsForPlan(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionTeacherReview[]>> {
    try {
      const records = await this.repo.listByPlanId(schoolId, resultRecoveryPlanId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listTeacherSimulationReviewsForSimulationRun(simulationRunId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionTeacherReview[]>> {
    try {
      const records = await this.repo.listBySimulationRunId(simulationRunId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listTeacherSimulationReviewsByTeacher(schoolId: string, teacherRef: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionTeacherReview[]>> {
    try {
      const records = await this.repo.listByTeacherRef(schoolId, teacherRef);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markTeacherSimulationReviewReady(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, teacherSimulationReviewId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionTeacherReview>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_TEACHER_REVIEW_CREATION');
      const updated = await this.repo.markReviewReady(teacherSimulationReviewId);
      await this.audit.recordSimulationEvent(ctx, 'TEACHER_SIMULATION_REVIEW_REVIEW_READY', 'updated', `Teacher simulation review ${teacherSimulationReviewId} marked review ready`, { teacherSimulationReviewId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async approveTeacherSimulationReviewForFutureUse(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, teacherSimulationReviewId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionTeacherReview>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_TEACHER_REVIEW_CREATION');
      const updated = await this.repo.approveForFutureUse(teacherSimulationReviewId);
      await this.audit.recordSimulationEvent(ctx, 'TEACHER_SIMULATION_REVIEW_APPROVED', 'updated', `Teacher simulation review ${teacherSimulationReviewId} approved for future use`, { teacherSimulationReviewId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async suppressTeacherSimulationReview(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, teacherSimulationReviewId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionTeacherReview>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_TEACHER_REVIEW_CREATION');
      const updated = await this.repo.suppress(teacherSimulationReviewId);
      await this.audit.recordSimulationEvent(ctx, 'TEACHER_SIMULATION_REVIEW_SUPPRESSED', 'updated', `Teacher simulation review ${teacherSimulationReviewId} suppressed`, { teacherSimulationReviewId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async blockTeacherSimulationReview(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, teacherSimulationReviewId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionTeacherReview>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_TEACHER_REVIEW_CREATION');
      const updated = await this.repo.block(teacherSimulationReviewId);
      await this.audit.recordSimulationEvent(ctx, 'TEACHER_SIMULATION_REVIEW_BLOCKED', 'updated', `Teacher simulation review ${teacherSimulationReviewId} blocked`, { teacherSimulationReviewId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async voidTeacherSimulationReview(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, teacherSimulationReviewId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionTeacherReview>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_TEACHER_REVIEW_CREATION');
      const updated = await this.repo.void(teacherSimulationReviewId);
      await this.audit.recordSimulationEvent(ctx, 'TEACHER_SIMULATION_REVIEW_VOIDED', 'updated', `Teacher simulation review ${teacherSimulationReviewId} voided`, { teacherSimulationReviewId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }
}

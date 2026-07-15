import { RecoveryOutcomeActionReadinessRepository } from '../contracts/recoveryOutcomeActionRepositoryContracts';
import { RecoveryOutcomeActionReadiness, CreateActionReadinessRequest, RecoveryOutcomeActionReadinessStatus } from '../contracts/recoveryOutcomeActionReadinessContracts';
import { RecoveryOutcomeActionCommandContext, RecoveryOutcomeActionSafeEnvelope } from '../contracts/recoveryOutcomeActionContracts';
import { RecoveryOutcomeActionSafetyService } from './recoveryOutcomeActionSafetyService';
import { RecoveryOutcomeActionAuditBridge } from './recoveryOutcomeActionAuditBridge';
import { RecoveryOutcomeActionIdempotencyService } from './recoveryOutcomeActionIdempotencyService';
import { v4 as uuid } from 'uuid';

export class RecoveryOutcomeActionReadinessService {
  constructor(
    private repo: RecoveryOutcomeActionReadinessRepository,
    private safety: RecoveryOutcomeActionSafetyService,
    private audit: RecoveryOutcomeActionAuditBridge,
    private idempotency: RecoveryOutcomeActionIdempotencyService,
  ) {}

  async createActionReadiness(
    ctx: RecoveryOutcomeActionCommandContext,
    req: CreateActionReadinessRequest,
  ): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionReadiness>> {
    try {
      this.safety.validateSchoolContext(ctx.schoolId);
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_ACTION_READINESS_CREATION');
      this.safety.validatePackage19Ref(req.recoveryOutcomeDecisionReadinessId, 'recoveryOutcomeDecisionReadinessId');

      const { isDuplicate } = await this.idempotency.processIdempotency(ctx, 'createActionReadiness', req as any);
      if (isDuplicate) {
        return { success: false, status: 'DUPLICATE', message: 'Idempotency key already processed', idempotencyKey: ctx.idempotencyKey };
      }

      const now = new Date();
      const record: RecoveryOutcomeActionReadiness = {
        actionReadinessId: uuid(),
        schoolId: req.schoolId,
        studentRef: req.studentRef,
        resultRecoveryPlanId: req.resultRecoveryPlanId,
        recoveryOutcomeDecisionReadinessId: req.recoveryOutcomeDecisionReadinessId,
        recoveryOutcomeDecisionSummaryId: req.recoveryOutcomeDecisionSummaryId,
        readinessStatus: 'draft',
        safeReadinessSummary: req.safeReadinessSummary,
        readinessChecksJson: req.readinessChecksJson,
        blockedReasonCodesJson: [],
        sourceRefsJson: req.sourceRefsJson ?? {},
        createdByActorId: req.createdByActorId,
        createdByRole: req.createdByRole,
        createdAt: now,
        updatedAt: now,
      };

      const created = await this.repo.create(record);
      await this.audit.record(ctx, 'ACTION_READINESS_CREATED', 'created', `Action readiness ${created.actionReadinessId} created`, { actionReadinessId: created.actionReadinessId });
      await this.idempotency.markCompleted(ctx, 'RecoveryOutcomeActionReadiness', created.actionReadinessId);

      return { success: true, data: created, status: 'created', idempotencyKey: ctx.idempotencyKey };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, idempotencyKey: ctx.idempotencyKey };
    }
  }

  async getActionReadiness(id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionReadiness>> {
    try {
      const record = await this.repo.getById(id);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Action readiness not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listActionReadinessForSchool(schoolId: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionReadiness[]>> {
    try {
      const records = await this.repo.listBySchool(schoolId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listActionReadinessForStudent(schoolId: string, studentRef: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionReadiness[]>> {
    try {
      const records = await this.repo.listByStudentRef(schoolId, studentRef);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listActionReadinessForPlan(schoolId: string, planId: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionReadiness[]>> {
    try {
      const records = await this.repo.listByPlanId(schoolId, planId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listActionReadinessByStatus(schoolId: string, status: RecoveryOutcomeActionReadinessStatus): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionReadiness[]>> {
    try {
      const records = await this.repo.listByStatus(schoolId, status as any);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markActionReadinessReviewReady(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionReadiness>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_ACTION_READINESS_CREATION');
      const updated = await this.repo.markReviewReady(id);
      await this.audit.record(ctx, 'ACTION_READINESS_REVIEW_READY', 'updated', `Action readiness ${id} marked review ready`, { actionReadinessId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async approveActionReadinessForFutureUse(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionReadiness>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_ACTION_READINESS_CREATION');
      const updated = await this.repo.approveForFutureUse(id);
      await this.audit.record(ctx, 'ACTION_READINESS_APPROVED', 'updated', `Action readiness ${id} approved for future use`, { actionReadinessId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async suppressActionReadiness(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionReadiness>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_ACTION_READINESS_CREATION');
      const updated = await this.repo.suppress(id);
      await this.audit.record(ctx, 'ACTION_READINESS_SUPPRESSED', 'updated', `Action readiness ${id} suppressed`, { actionReadinessId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async blockActionReadiness(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionReadiness>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_ACTION_READINESS_CREATION');
      const updated = await this.repo.block(id);
      await this.audit.record(ctx, 'ACTION_READINESS_BLOCKED', 'updated', `Action readiness ${id} blocked`, { actionReadinessId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async voidActionReadiness(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionReadiness>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_ACTION_READINESS_CREATION');
      const updated = await this.repo.void(id);
      await this.audit.record(ctx, 'ACTION_READINESS_VOIDED', 'updated', `Action readiness ${id} voided`, { actionReadinessId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }
}

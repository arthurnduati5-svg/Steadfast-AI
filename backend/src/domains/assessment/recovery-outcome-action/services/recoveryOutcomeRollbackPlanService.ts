import { RecoveryOutcomeRollbackPlanRepository } from '../contracts/recoveryOutcomeActionRepositoryContracts';
import { RecoveryOutcomeRollbackPlan, CreateRollbackPlanRequest, RollbackPlanStatus } from '../contracts/recoveryOutcomeRollbackPlanContracts';
import { RecoveryOutcomeActionCommandContext, RecoveryOutcomeActionSafeEnvelope } from '../contracts/recoveryOutcomeActionContracts';
import { RecoveryOutcomeActionSafetyService } from './recoveryOutcomeActionSafetyService';
import { RecoveryOutcomeActionAuditBridge } from './recoveryOutcomeActionAuditBridge';
import { RecoveryOutcomeActionIdempotencyService } from './recoveryOutcomeActionIdempotencyService';
import { v4 as uuid } from 'uuid';

export class RecoveryOutcomeRollbackPlanService {
  constructor(
    private repo: RecoveryOutcomeRollbackPlanRepository,
    private safety: RecoveryOutcomeActionSafetyService,
    private audit: RecoveryOutcomeActionAuditBridge,
    private idempotency: RecoveryOutcomeActionIdempotencyService,
  ) {}

  async createRollbackPlan(ctx: RecoveryOutcomeActionCommandContext, req: CreateRollbackPlanRequest): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeRollbackPlan>> {
    try {
      this.safety.validateSchoolContext(ctx.schoolId);
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_ROLLBACK_PLAN_CREATION');
      const { isDuplicate } = await this.idempotency.processIdempotency(ctx, 'createRollbackPlan', req as any);
      if (isDuplicate) return { success: false, status: 'DUPLICATE', message: 'Duplicate', idempotencyKey: ctx.idempotencyKey };
      const now = new Date();
      const record: RecoveryOutcomeRollbackPlan = {
        rollbackPlanId: uuid(), schoolId: req.schoolId, studentRef: req.studentRef,
        resultRecoveryPlanId: req.resultRecoveryPlanId, actionBundleId: req.actionBundleId,
        rollbackStatus: 'draft', safeRollbackSummary: req.safeRollbackSummary,
        rollbackStepsJson: req.rollbackStepsJson, rollbackTriggersJson: req.rollbackTriggersJson, blockedReasonCodesJson: [],
        sourceRefsJson: req.sourceRefsJson ?? {}, createdByActorId: req.createdByActorId, createdByRole: req.createdByRole,
        createdAt: now, updatedAt: now,
      };
      const created = await this.repo.create(record);
      await this.audit.record(ctx, 'ROLLBACK_PLAN_CREATED', 'created', `Rollback plan ${created.rollbackPlanId}`, { rollbackPlanId: created.rollbackPlanId });
      await this.idempotency.markCompleted(ctx, 'RecoveryOutcomeRollbackPlan', created.rollbackPlanId);
      return { success: true, data: created, status: 'created', idempotencyKey: ctx.idempotencyKey };
    } catch (err: any) { return { success: false, status: 'error', message: err.message, idempotencyKey: ctx.idempotencyKey }; }
  }

  async getRollbackPlan(id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeRollbackPlan>> {
    try { const d = await this.repo.getById(id); if (!d) return { success: false, status: 'NOT_FOUND' }; return { success: true, data: d, status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listRollbackPlansForPlan(schoolId: string, planId: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeRollbackPlan[]>> {
    try { return { success: true, data: await this.repo.listByPlanId(schoolId, planId), status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listRollbackPlansByStatus(schoolId: string, status: RollbackPlanStatus): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeRollbackPlan[]>> {
    try { return { success: true, data: await this.repo.listByStatus(schoolId, status as any), status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async markRollbackPlanReviewReady(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeRollbackPlan>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_ROLLBACK_PLAN_CREATION');
      const updated = await this.repo.markReviewReady(id);
      await this.audit.record(ctx, 'ROLLBACK_PLAN_REVIEW_READY', 'updated', `Rollback ${id} review ready`, { rollbackPlanId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async approveRollbackPlanForFutureUse(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeRollbackPlan>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_ROLLBACK_PLAN_CREATION');
      const updated = await this.repo.approveForFutureUse(id);
      await this.audit.record(ctx, 'ROLLBACK_PLAN_APPROVED', 'updated', `Rollback ${id} approved`, { rollbackPlanId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async suppressRollbackPlan(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeRollbackPlan>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_ROLLBACK_PLAN_CREATION');
      const updated = await this.repo.suppress(id);
      await this.audit.record(ctx, 'ROLLBACK_PLAN_SUPPRESSED', 'updated', `Rollback ${id} suppressed`, { rollbackPlanId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async blockRollbackPlan(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeRollbackPlan>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_ROLLBACK_PLAN_CREATION');
      const updated = await this.repo.block(id);
      await this.audit.record(ctx, 'ROLLBACK_PLAN_BLOCKED', 'updated', `Rollback ${id} blocked`, { rollbackPlanId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async voidRollbackPlan(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeRollbackPlan>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_ROLLBACK_PLAN_CREATION');
      const updated = await this.repo.void(id);
      await this.audit.record(ctx, 'ROLLBACK_PLAN_VOIDED', 'updated', `Rollback ${id} voided`, { rollbackPlanId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }
}

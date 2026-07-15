import { ISimulationPlanRepository } from '../contracts/recoveryOutcomeExecutionSimulationRepositoryContracts';
import { RecoveryOutcomeExecutionSimulationPlan, CreateSimulationPlanRequest } from '../contracts/recoveryOutcomeExecutionSimulationPlanContracts';
import { RecoveryOutcomeExecutionSimulationCommandContext, RecoveryOutcomeExecutionSimulationSafeEnvelope } from '../contracts/recoveryOutcomeExecutionSimulationContracts';
import { RecoveryOutcomeExecutionSimulationSafetyService } from './recoveryOutcomeExecutionSimulationSafetyService';
import { RecoveryOutcomeExecutionSimulationAuditBridge } from './recoveryOutcomeExecutionSimulationAuditBridge';
import { RecoveryOutcomeExecutionSimulationIdempotencyService } from './recoveryOutcomeExecutionSimulationIdempotencyService';
import { v4 as uuid } from 'uuid';

export class RecoveryOutcomeExecutionSimulationPlanService {
  constructor(
    private repo: ISimulationPlanRepository,
    private safety: RecoveryOutcomeExecutionSimulationSafetyService,
    private audit: RecoveryOutcomeExecutionSimulationAuditBridge,
    private idempotency: RecoveryOutcomeExecutionSimulationIdempotencyService,
  ) {}

  async createSimulationPlan(
    ctx: RecoveryOutcomeExecutionSimulationCommandContext,
    req: CreateSimulationPlanRequest,
  ): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationPlan>> {
    try {
      this.safety.validateSchoolContext(ctx.schoolId);
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_SIMULATION_PLAN_CREATION');

      const existing = await this.idempotency.checkIdempotency(ctx.schoolId, 'createSimulationPlan', ctx.idempotencyKey);
      if (existing && existing.status === 'completed') {
        return { success: false, status: 'DUPLICATE', message: 'Idempotency key already processed', idempotencyKey: ctx.idempotencyKey };
      }

      const blockedCodes = this.safety.validateContent(req.safePlanSummary, req.simulationParametersJson ?? {});
      if (blockedCodes.length > 0) {
        return { success: false, status: 'BLOCKED', message: 'Content validation failed', blockedReasonCodes: blockedCodes, idempotencyKey: ctx.idempotencyKey };
      }

      const requestHash = await this.idempotency.computeRequestHash('createSimulationPlan', req as any);
      await this.idempotency.createIdempotencyEntry(ctx.schoolId, 'createSimulationPlan', ctx.idempotencyKey, requestHash);

      const now = new Date().toISOString();
      const record: Partial<RecoveryOutcomeExecutionSimulationPlan> = {
        simulationPlanId: uuid(),
        schoolId: ctx.schoolId,
        studentRef: req.studentRef,
        resultRecoveryPlanId: req.resultRecoveryPlanId,
        recoveryOutcomeActionBundleId: req.recoveryOutcomeActionBundleId,
        recoveryContinuationActionDraftId: req.recoveryContinuationActionDraftId,
        recoveryIntensificationActionDraftId: req.recoveryIntensificationActionDraftId,
        recoveryPauseActionDraftId: req.recoveryPauseActionDraftId,
        recoveryClosureActionDraftId: req.recoveryClosureActionDraftId,
        planStatus: 'draft',
        safePlanSummary: req.safePlanSummary,
        simulationParametersJson: req.simulationParametersJson ?? {},
        blockedReasonCodesJson: [],
        sourceRefsJson: req.sourceRefsJson ?? {},
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
        createdAt: now,
        updatedAt: now,
      };

      const created = await this.repo.create(record);
      await this.audit.recordSimulationEvent(ctx, 'SIMULATION_PLAN_CREATED', 'created', `Simulation plan ${created.simulationPlanId} created`, { simulationPlanId: created.simulationPlanId });
      await this.idempotency.markCompleted(ctx.schoolId, 'createSimulationPlan', ctx.idempotencyKey, `Simulation plan ${created.simulationPlanId} created`);

      return { success: true, data: created, status: 'created', idempotencyKey: ctx.idempotencyKey };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, idempotencyKey: ctx.idempotencyKey };
    }
  }

  async getSimulationPlan(schoolId: string, simulationPlanId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationPlan>> {
    try {
      const record = await this.repo.getById(simulationPlanId);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Simulation plan not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listSimulationPlansForSchool(schoolId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationPlan[]>> {
    try {
      const records = await this.repo.listBySchool(schoolId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listSimulationPlansForStudent(schoolId: string, studentRef: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationPlan[]>> {
    try {
      const records = await this.repo.listByStudentRef(schoolId, studentRef);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listSimulationPlansForPlan(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationPlan[]>> {
    try {
      const records = await this.repo.listByPlanId(schoolId, resultRecoveryPlanId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listSimulationPlansByStatus(schoolId: string, planStatus: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationPlan[]>> {
    try {
      const records = await this.repo.listByStatus(schoolId, planStatus);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markSimulationPlanReady(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, simulationPlanId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationPlan>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_SIMULATION_PLAN_CREATION');
      const updated = await this.repo.updateStatus(simulationPlanId, 'ready');
      await this.audit.recordSimulationEvent(ctx, 'SIMULATION_PLAN_READY', 'updated', `Simulation plan ${simulationPlanId} marked ready`, { simulationPlanId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markSimulationPlanReviewReady(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, simulationPlanId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationPlan>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_SIMULATION_PLAN_CREATION');
      const updated = await this.repo.markReviewReady(simulationPlanId);
      await this.audit.recordSimulationEvent(ctx, 'SIMULATION_PLAN_REVIEW_READY', 'updated', `Simulation plan ${simulationPlanId} marked review ready`, { simulationPlanId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async approveSimulationPlanForFutureUse(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, simulationPlanId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationPlan>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_SIMULATION_PLAN_CREATION');
      const updated = await this.repo.approveForFutureUse(simulationPlanId);
      await this.audit.recordSimulationEvent(ctx, 'SIMULATION_PLAN_APPROVED', 'updated', `Simulation plan ${simulationPlanId} approved for future use`, { simulationPlanId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async suppressSimulationPlan(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, simulationPlanId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationPlan>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_SIMULATION_PLAN_CREATION');
      const updated = await this.repo.suppress(simulationPlanId);
      await this.audit.recordSimulationEvent(ctx, 'SIMULATION_PLAN_SUPPRESSED', 'updated', `Simulation plan ${simulationPlanId} suppressed`, { simulationPlanId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async blockSimulationPlan(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, simulationPlanId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationPlan>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_SIMULATION_PLAN_CREATION');
      const updated = await this.repo.block(simulationPlanId);
      await this.audit.recordSimulationEvent(ctx, 'SIMULATION_PLAN_BLOCKED', 'updated', `Simulation plan ${simulationPlanId} blocked`, { simulationPlanId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async voidSimulationPlan(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, simulationPlanId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationPlan>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_SIMULATION_PLAN_CREATION');
      const updated = await this.repo.void(simulationPlanId);
      await this.audit.recordSimulationEvent(ctx, 'SIMULATION_PLAN_VOIDED', 'updated', `Simulation plan ${simulationPlanId} voided`, { simulationPlanId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }
}

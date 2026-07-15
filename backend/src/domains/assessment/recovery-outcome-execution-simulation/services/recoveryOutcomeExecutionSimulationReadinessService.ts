import { ISimulationReadinessRepository } from '../contracts/recoveryOutcomeExecutionSimulationRepositoryContracts';
import { RecoveryOutcomeExecutionSimulationReadiness, CreateSimulationReadinessRequest } from '../contracts/recoveryOutcomeExecutionSimulationReadinessContracts';
import { RecoveryOutcomeExecutionSimulationCommandContext, RecoveryOutcomeExecutionSimulationSafeEnvelope } from '../contracts/recoveryOutcomeExecutionSimulationContracts';
import { RecoveryOutcomeExecutionSimulationSafetyService } from './recoveryOutcomeExecutionSimulationSafetyService';
import { RecoveryOutcomeExecutionSimulationAuditBridge } from './recoveryOutcomeExecutionSimulationAuditBridge';
import { RecoveryOutcomeExecutionSimulationIdempotencyService } from './recoveryOutcomeExecutionSimulationIdempotencyService';
import { v4 as uuid } from 'uuid';

export class RecoveryOutcomeExecutionSimulationReadinessService {
  constructor(
    private repo: ISimulationReadinessRepository,
    private safety: RecoveryOutcomeExecutionSimulationSafetyService,
    private audit: RecoveryOutcomeExecutionSimulationAuditBridge,
    private idempotency: RecoveryOutcomeExecutionSimulationIdempotencyService,
  ) {}

  async createSimulationReadiness(
    ctx: RecoveryOutcomeExecutionSimulationCommandContext,
    req: CreateSimulationReadinessRequest,
  ): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationReadiness>> {
    try {
      this.safety.validateSchoolContext(ctx.schoolId);
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_SIMULATION_READINESS_CREATION');
      this.safety.validatePackage21Ref(req.recoveryOutcomeActionReadinessId, 'recoveryOutcomeActionReadinessId');

      const existing = await this.idempotency.checkIdempotency(ctx.schoolId, 'createSimulationReadiness', ctx.idempotencyKey);
      if (existing && existing.status === 'completed') {
        return { success: false, status: 'DUPLICATE', message: 'Idempotency key already processed', idempotencyKey: ctx.idempotencyKey };
      }

      const blockedCodes = this.safety.validateContent(req.safeReadinessSummary, req.readinessChecksJson ?? {});
      if (blockedCodes.length > 0) {
        return { success: false, status: 'BLOCKED', message: 'Content validation failed', blockedReasonCodes: blockedCodes, idempotencyKey: ctx.idempotencyKey };
      }

      const requestHash = await this.idempotency.computeRequestHash('createSimulationReadiness', req as any);
      await this.idempotency.createIdempotencyEntry(ctx.schoolId, 'createSimulationReadiness', ctx.idempotencyKey, requestHash);

      const now = new Date().toISOString();
      const record: Partial<RecoveryOutcomeExecutionSimulationReadiness> = {
        simulationReadinessId: uuid(),
        schoolId: ctx.schoolId,
        studentRef: req.studentRef,
        resultRecoveryPlanId: req.resultRecoveryPlanId,
        recoveryOutcomeActionReadinessId: req.recoveryOutcomeActionReadinessId,
        recoveryOutcomeActionBundleId: req.recoveryOutcomeActionBundleId,
        readinessStatus: 'draft',
        safeReadinessSummary: req.safeReadinessSummary,
        readinessChecksJson: req.readinessChecksJson ?? {},
        blockedReasonCodesJson: [],
        sourceRefsJson: req.sourceRefsJson ?? {},
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
        createdAt: now,
        updatedAt: now,
      };

      const created = await this.repo.create(record);
      await this.audit.recordSimulationEvent(ctx, 'SIMULATION_READINESS_CREATED', 'created', `Simulation readiness ${created.simulationReadinessId} created`, { simulationReadinessId: created.simulationReadinessId });
      await this.idempotency.markCompleted(ctx.schoolId, 'createSimulationReadiness', ctx.idempotencyKey, `Simulation readiness ${created.simulationReadinessId} created`);

      return { success: true, data: created, status: 'created', idempotencyKey: ctx.idempotencyKey };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, idempotencyKey: ctx.idempotencyKey };
    }
  }

  async getSimulationReadiness(schoolId: string, simulationReadinessId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationReadiness>> {
    try {
      const record = await this.repo.getById(simulationReadinessId);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Simulation readiness not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listSimulationReadinessForSchool(schoolId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationReadiness[]>> {
    try {
      const records = await this.repo.listBySchool(schoolId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listSimulationReadinessForStudent(schoolId: string, studentRef: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationReadiness[]>> {
    try {
      const records = await this.repo.listByStudentRef(schoolId, studentRef);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listSimulationReadinessForPlan(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationReadiness[]>> {
    try {
      const records = await this.repo.listByPlanId(schoolId, resultRecoveryPlanId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listSimulationReadinessByStatus(schoolId: string, readinessStatus: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationReadiness[]>> {
    try {
      const records = await this.repo.listByStatus(schoolId, readinessStatus);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markSimulationReadinessReviewReady(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, simulationReadinessId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationReadiness>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_SIMULATION_READINESS_CREATION');
      const updated = await this.repo.markReviewReady(simulationReadinessId);
      await this.audit.recordSimulationEvent(ctx, 'SIMULATION_READINESS_REVIEW_READY', 'updated', `Simulation readiness ${simulationReadinessId} marked review ready`, { simulationReadinessId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async approveSimulationReadinessForFutureUse(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, simulationReadinessId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationReadiness>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_SIMULATION_READINESS_CREATION');
      const updated = await this.repo.approveForFutureUse(simulationReadinessId);
      await this.audit.recordSimulationEvent(ctx, 'SIMULATION_READINESS_APPROVED', 'updated', `Simulation readiness ${simulationReadinessId} approved for future use`, { simulationReadinessId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async suppressSimulationReadiness(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, simulationReadinessId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationReadiness>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_SIMULATION_READINESS_CREATION');
      const updated = await this.repo.suppress(simulationReadinessId);
      await this.audit.recordSimulationEvent(ctx, 'SIMULATION_READINESS_SUPPRESSED', 'updated', `Simulation readiness ${simulationReadinessId} suppressed`, { simulationReadinessId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async blockSimulationReadiness(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, simulationReadinessId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationReadiness>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_SIMULATION_READINESS_CREATION');
      const updated = await this.repo.block(simulationReadinessId);
      await this.audit.recordSimulationEvent(ctx, 'SIMULATION_READINESS_BLOCKED', 'updated', `Simulation readiness ${simulationReadinessId} blocked`, { simulationReadinessId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async voidSimulationReadiness(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, simulationReadinessId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationReadiness>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_SIMULATION_READINESS_CREATION');
      const updated = await this.repo.void(simulationReadinessId);
      await this.audit.recordSimulationEvent(ctx, 'SIMULATION_READINESS_VOIDED', 'updated', `Simulation readiness ${simulationReadinessId} voided`, { simulationReadinessId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }
}

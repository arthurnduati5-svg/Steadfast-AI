import { ISimulationRunRepository } from '../contracts/recoveryOutcomeExecutionSimulationRepositoryContracts';
import { RecoveryOutcomeExecutionSimulationRun, CreateSimulationRunRequest } from '../contracts/recoveryOutcomeExecutionSimulationRunContracts';
import { RecoveryOutcomeExecutionSimulationCommandContext, RecoveryOutcomeExecutionSimulationSafeEnvelope } from '../contracts/recoveryOutcomeExecutionSimulationContracts';
import { RecoveryOutcomeExecutionSimulationSafetyService } from './recoveryOutcomeExecutionSimulationSafetyService';
import { RecoveryOutcomeExecutionSimulationAuditBridge } from './recoveryOutcomeExecutionSimulationAuditBridge';
import { RecoveryOutcomeExecutionSimulationIdempotencyService } from './recoveryOutcomeExecutionSimulationIdempotencyService';
import { v4 as uuid } from 'uuid';

export class RecoveryOutcomeExecutionSimulationRunService {
  constructor(
    private repo: ISimulationRunRepository,
    private safety: RecoveryOutcomeExecutionSimulationSafetyService,
    private audit: RecoveryOutcomeExecutionSimulationAuditBridge,
    private idempotency: RecoveryOutcomeExecutionSimulationIdempotencyService,
  ) {}

  async createSimulationRun(
    ctx: RecoveryOutcomeExecutionSimulationCommandContext,
    req: CreateSimulationRunRequest,
  ): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationRun>> {
    try {
      this.safety.validateSchoolContext(ctx.schoolId);
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_SIMULATION_RUN_CREATION');

      const existing = await this.idempotency.checkIdempotency(ctx.schoolId, 'createSimulationRun', ctx.idempotencyKey);
      if (existing && existing.status === 'completed') {
        return { success: false, status: 'DUPLICATE', message: 'Idempotency key already processed', idempotencyKey: ctx.idempotencyKey };
      }

      const blockedCodes = this.safety.validateContent(req.safeRunSummary, req.runParametersJson ?? {});
      if (blockedCodes.length > 0) {
        return { success: false, status: 'BLOCKED', message: 'Content validation failed', blockedReasonCodes: blockedCodes, idempotencyKey: ctx.idempotencyKey };
      }

      const requestHash = await this.idempotency.computeRequestHash('createSimulationRun', req as any);
      await this.idempotency.createIdempotencyEntry(ctx.schoolId, 'createSimulationRun', ctx.idempotencyKey, requestHash);

      const now = new Date().toISOString();
      const record: Partial<RecoveryOutcomeExecutionSimulationRun> = {
        simulationRunId: uuid(),
        schoolId: ctx.schoolId,
        studentRef: req.studentRef,
        resultRecoveryPlanId: req.resultRecoveryPlanId,
        recoveryOutcomeActionBundleId: req.recoveryOutcomeActionBundleId,
        simulationPlanId: req.simulationPlanId,
        runStatus: 'draft',
        safeRunSummary: req.safeRunSummary,
        runParametersJson: req.runParametersJson ?? {},
        blockedReasonCodesJson: [],
        sourceRefsJson: req.sourceRefsJson ?? {},
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
        createdAt: now,
        updatedAt: now,
      };

      const created = await this.repo.create(record);
      await this.audit.recordSimulationEvent(ctx, 'SIMULATION_RUN_CREATED', 'created', `Simulation run ${created.simulationRunId} created`, { simulationRunId: created.simulationRunId });
      await this.idempotency.markCompleted(ctx.schoolId, 'createSimulationRun', ctx.idempotencyKey, `Simulation run ${created.simulationRunId} created`);

      return { success: true, data: created, status: 'created', idempotencyKey: ctx.idempotencyKey };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, idempotencyKey: ctx.idempotencyKey };
    }
  }

  async getSimulationRun(schoolId: string, simulationRunId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationRun>> {
    try {
      const record = await this.repo.getById(simulationRunId);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Simulation run not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listSimulationRunsForSchool(schoolId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationRun[]>> {
    try {
      const records = await this.repo.listBySchool(schoolId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listSimulationRunsForStudent(schoolId: string, studentRef: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationRun[]>> {
    try {
      const records = await this.repo.listByStudentRef(schoolId, studentRef);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listSimulationRunsForPlan(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationRun[]>> {
    try {
      const records = await this.repo.listByPlanId(schoolId, resultRecoveryPlanId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listSimulationRunsForSimulationPlan(schoolId: string, simulationPlanId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationRun[]>> {
    try {
      const records = await this.repo.listBySimulationPlanId(schoolId, simulationPlanId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listSimulationRunsByStatus(schoolId: string, runStatus: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationRun[]>> {
    try {
      const records = await this.repo.listByStatus(schoolId, runStatus);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markSimulationRunSimulating(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, simulationRunId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationRun>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_SIMULATION_RUN_CREATION');
      const updated = await this.repo.updateStatus(simulationRunId, 'simulating');
      await this.audit.recordSimulationEvent(ctx, 'SIMULATION_RUN_SIMULATING', 'updated', `Simulation run ${simulationRunId} marked simulating`, { simulationRunId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markSimulationRunSimulated(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, simulationRunId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationRun>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_SIMULATION_RUN_CREATION');
      const updated = await this.repo.updateStatus(simulationRunId, 'simulated');
      await this.audit.recordSimulationEvent(ctx, 'SIMULATION_RUN_SIMULATED', 'updated', `Simulation run ${simulationRunId} marked simulated`, { simulationRunId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markSimulationRunReviewReady(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, simulationRunId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationRun>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_SIMULATION_RUN_CREATION');
      const updated = await this.repo.markReviewReady(simulationRunId);
      await this.audit.recordSimulationEvent(ctx, 'SIMULATION_RUN_REVIEW_READY', 'updated', `Simulation run ${simulationRunId} marked review ready`, { simulationRunId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async suppressSimulationRun(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, simulationRunId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationRun>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_SIMULATION_RUN_CREATION');
      const updated = await this.repo.suppress(simulationRunId);
      await this.audit.recordSimulationEvent(ctx, 'SIMULATION_RUN_SUPPRESSED', 'updated', `Simulation run ${simulationRunId} suppressed`, { simulationRunId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async blockSimulationRun(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, simulationRunId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationRun>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_SIMULATION_RUN_CREATION');
      const updated = await this.repo.block(simulationRunId);
      await this.audit.recordSimulationEvent(ctx, 'SIMULATION_RUN_BLOCKED', 'updated', `Simulation run ${simulationRunId} blocked`, { simulationRunId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async voidSimulationRun(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, simulationRunId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationRun>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_SIMULATION_RUN_CREATION');
      const updated = await this.repo.void(simulationRunId);
      await this.audit.recordSimulationEvent(ctx, 'SIMULATION_RUN_VOIDED', 'updated', `Simulation run ${simulationRunId} voided`, { simulationRunId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }
}

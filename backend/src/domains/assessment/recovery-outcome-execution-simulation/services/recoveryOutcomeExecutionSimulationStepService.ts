import { ISimulationStepRepository } from '../contracts/recoveryOutcomeExecutionSimulationRepositoryContracts';
import { RecoveryOutcomeExecutionSimulationStep, CreateSimulationStepRequest } from '../contracts/recoveryOutcomeExecutionSimulationStepContracts';
import { RecoveryOutcomeExecutionSimulationCommandContext, RecoveryOutcomeExecutionSimulationSafeEnvelope } from '../contracts/recoveryOutcomeExecutionSimulationContracts';
import { RecoveryOutcomeExecutionSimulationSafetyService } from './recoveryOutcomeExecutionSimulationSafetyService';
import { RecoveryOutcomeExecutionSimulationAuditBridge } from './recoveryOutcomeExecutionSimulationAuditBridge';
import { RecoveryOutcomeExecutionSimulationIdempotencyService } from './recoveryOutcomeExecutionSimulationIdempotencyService';
import { v4 as uuid } from 'uuid';

export class RecoveryOutcomeExecutionSimulationStepService {
  constructor(
    private repo: ISimulationStepRepository,
    private safety: RecoveryOutcomeExecutionSimulationSafetyService,
    private audit: RecoveryOutcomeExecutionSimulationAuditBridge,
    private idempotency: RecoveryOutcomeExecutionSimulationIdempotencyService,
  ) {}

  async createSimulationStep(
    ctx: RecoveryOutcomeExecutionSimulationCommandContext,
    req: CreateSimulationStepRequest,
  ): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationStep>> {
    try {
      this.safety.validateSchoolContext(ctx.schoolId);
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_SIMULATION_STEP_RECORDING');

      const existing = await this.idempotency.checkIdempotency(ctx.schoolId, 'createSimulationStep', ctx.idempotencyKey);
      if (existing && existing.status === 'completed') {
        return { success: false, status: 'DUPLICATE', message: 'Idempotency key already processed', idempotencyKey: ctx.idempotencyKey };
      }

      const blockedCodes = this.safety.validateContent(req.safeStepSummary, req.stepDetailsJson ?? {});
      if (blockedCodes.length > 0) {
        return { success: false, status: 'BLOCKED', message: 'Content validation failed', blockedReasonCodes: blockedCodes, idempotencyKey: ctx.idempotencyKey };
      }

      const requestHash = await this.idempotency.computeRequestHash('createSimulationStep', req as any);
      await this.idempotency.createIdempotencyEntry(ctx.schoolId, 'createSimulationStep', ctx.idempotencyKey, requestHash);

      const now = new Date().toISOString();
      const record: Partial<RecoveryOutcomeExecutionSimulationStep> = {
        simulationStepId: uuid(),
        schoolId: ctx.schoolId,
        simulationRunId: req.simulationRunId,
        stepSequence: req.stepSequence,
        stepName: req.stepName,
        stepStatus: 'pending',
        safeStepSummary: req.safeStepSummary,
        stepDetailsJson: req.stepDetailsJson ?? {},
        blockedReasonCodesJson: [],
        sourceRefsJson: req.sourceRefsJson ?? {},
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
        createdAt: now,
        updatedAt: now,
      };

      const created = await this.repo.create(record);
      await this.audit.recordSimulationEvent(ctx, 'SIMULATION_STEP_CREATED', 'created', `Simulation step ${created.simulationStepId} created`, {}, undefined, { simulationStepId: created.simulationStepId, simulationRunId: req.simulationRunId });
      await this.idempotency.markCompleted(ctx.schoolId, 'createSimulationStep', ctx.idempotencyKey, `Simulation step ${created.simulationStepId} created`);

      return { success: true, data: created, status: 'created', idempotencyKey: ctx.idempotencyKey };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, idempotencyKey: ctx.idempotencyKey };
    }
  }

  async getSimulationStep(schoolId: string, stepId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationStep>> {
    try {
      const record = await this.repo.getById(stepId);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Simulation step not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listStepsForSimulationRun(simulationRunId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationStep[]>> {
    try {
      const records = await this.repo.listStepsForSimulationRun(simulationRunId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listStepsByStatus(schoolId: string, stepStatus: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationStep[]>> {
    try {
      const records = await this.repo.listByStatus(schoolId, stepStatus);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markStepSimulated(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, stepId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationStep>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_SIMULATION_STEP_RECORDING');
      const updated = await this.repo.updateStatus(stepId, 'simulated');
      await this.audit.recordSimulationEvent(ctx, 'SIMULATION_STEP_SIMULATED', 'updated', `Simulation step ${stepId} marked simulated`, {}, undefined, { stepId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markStepBlocked(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, stepId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationStep>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_SIMULATION_STEP_RECORDING');
      const updated = await this.repo.block(stepId);
      await this.audit.recordSimulationEvent(ctx, 'SIMULATION_STEP_BLOCKED', 'updated', `Simulation step ${stepId} blocked`, {}, undefined, { stepId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async voidStep(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, stepId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationStep>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_SIMULATION_STEP_RECORDING');
      const updated = await this.repo.void(stepId);
      await this.audit.recordSimulationEvent(ctx, 'SIMULATION_STEP_VOIDED', 'updated', `Simulation step ${stepId} voided`, {}, undefined, { stepId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }
}

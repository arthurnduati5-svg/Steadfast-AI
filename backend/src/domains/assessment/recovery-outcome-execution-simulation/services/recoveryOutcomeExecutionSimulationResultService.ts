import { ISimulationResultRepository } from '../contracts/recoveryOutcomeExecutionSimulationRepositoryContracts';
import { RecoveryOutcomeExecutionSimulationResult, CreateSimulationResultRequest } from '../contracts/recoveryOutcomeExecutionSimulationResultContracts';
import { RecoveryOutcomeExecutionSimulationCommandContext, RecoveryOutcomeExecutionSimulationSafeEnvelope } from '../contracts/recoveryOutcomeExecutionSimulationContracts';
import { RecoveryOutcomeExecutionSimulationSafetyService } from './recoveryOutcomeExecutionSimulationSafetyService';
import { RecoveryOutcomeExecutionSimulationAuditBridge } from './recoveryOutcomeExecutionSimulationAuditBridge';
import { RecoveryOutcomeExecutionSimulationIdempotencyService } from './recoveryOutcomeExecutionSimulationIdempotencyService';
import { v4 as uuid } from 'uuid';

export class RecoveryOutcomeExecutionSimulationResultService {
  constructor(
    private repo: ISimulationResultRepository,
    private safety: RecoveryOutcomeExecutionSimulationSafetyService,
    private audit: RecoveryOutcomeExecutionSimulationAuditBridge,
    private idempotency: RecoveryOutcomeExecutionSimulationIdempotencyService,
  ) {}

  async createSimulationResult(
    ctx: RecoveryOutcomeExecutionSimulationCommandContext,
    req: CreateSimulationResultRequest,
  ): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationResult>> {
    try {
      this.safety.validateSchoolContext(ctx.schoolId);
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_SIMULATION_RESULT_CREATION');

      const existing = await this.idempotency.checkIdempotency(ctx.schoolId, 'createSimulationResult', ctx.idempotencyKey);
      if (existing && existing.status === 'completed') {
        return { success: false, status: 'DUPLICATE', message: 'Idempotency key already processed', idempotencyKey: ctx.idempotencyKey };
      }

      const blockedCodes = this.safety.validateContent(req.safeOutcomeSummary, req.simulationOutcomeDetailsJson ?? {});
      if (blockedCodes.length > 0) {
        return { success: false, status: 'BLOCKED', message: 'Content validation failed', blockedReasonCodes: blockedCodes, idempotencyKey: ctx.idempotencyKey };
      }

      const requestHash = await this.idempotency.computeRequestHash('createSimulationResult', req as any);
      await this.idempotency.createIdempotencyEntry(ctx.schoolId, 'createSimulationResult', ctx.idempotencyKey, requestHash);

      const now = new Date().toISOString();
      const record: Partial<RecoveryOutcomeExecutionSimulationResult> = {
        simulationResultId: uuid(),
        schoolId: ctx.schoolId,
        studentRef: req.studentRef,
        resultRecoveryPlanId: req.resultRecoveryPlanId,
        simulationRunId: req.simulationRunId,
        outcomeStatus: 'pending',
        safeOutcomeSummary: req.safeOutcomeSummary,
        simulationOutcomeDetailsJson: req.simulationOutcomeDetailsJson ?? {},
        blockedReasonCodesJson: [],
        sourceRefsJson: req.sourceRefsJson ?? {},
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
        createdAt: now,
        updatedAt: now,
      };

      const created = await this.repo.create(record);
      await this.audit.recordSimulationEvent(ctx, 'SIMULATION_RESULT_CREATED', 'created', `Simulation result ${created.simulationResultId} created`, { simulationResultId: created.simulationResultId });
      await this.idempotency.markCompleted(ctx.schoolId, 'createSimulationResult', ctx.idempotencyKey, `Simulation result ${created.simulationResultId} created`);

      return { success: true, data: created, status: 'created', idempotencyKey: ctx.idempotencyKey };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, idempotencyKey: ctx.idempotencyKey };
    }
  }

  async getSimulationResult(schoolId: string, simulationResultId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationResult>> {
    try {
      const record = await this.repo.getById(simulationResultId);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Simulation result not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listResultsForSimulationRun(simulationRunId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationResult[]>> {
    try {
      const records = await this.repo.listBySimulationRunId(simulationRunId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listResultsForPlan(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationResult[]>> {
    try {
      const records = await this.repo.listByPlanId(schoolId, resultRecoveryPlanId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listResultsByOutcome(schoolId: string, outcomeStatus: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationResult[]>> {
    try {
      const records = await this.repo.listByOutcome(schoolId, outcomeStatus);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markSimulationResultReviewReady(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, simulationResultId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationResult>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_SIMULATION_RESULT_CREATION');
      const updated = await this.repo.markReviewReady(simulationResultId);
      await this.audit.recordSimulationEvent(ctx, 'SIMULATION_RESULT_REVIEW_READY', 'updated', `Simulation result ${simulationResultId} marked review ready`, { simulationResultId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async voidSimulationResult(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, simulationResultId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationResult>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_SIMULATION_RESULT_CREATION');
      const updated = await this.repo.void(simulationResultId);
      await this.audit.recordSimulationEvent(ctx, 'SIMULATION_RESULT_VOIDED', 'updated', `Simulation result ${simulationResultId} voided`, { simulationResultId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }
}

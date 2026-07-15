import { IReadinessVerdictRepository } from '../contracts/recoveryOutcomeExecutionSimulationRepositoryContracts';
import { RecoveryOutcomeExecutionReadinessVerdict, CreateReadinessVerdictRequest } from '../contracts/recoveryOutcomeExecutionReadinessVerdictContracts';
import { RecoveryOutcomeExecutionSimulationCommandContext, RecoveryOutcomeExecutionSimulationSafeEnvelope } from '../contracts/recoveryOutcomeExecutionSimulationContracts';
import { RecoveryOutcomeExecutionSimulationSafetyService } from './recoveryOutcomeExecutionSimulationSafetyService';
import { RecoveryOutcomeExecutionSimulationAuditBridge } from './recoveryOutcomeExecutionSimulationAuditBridge';
import { RecoveryOutcomeExecutionSimulationIdempotencyService } from './recoveryOutcomeExecutionSimulationIdempotencyService';
import { v4 as uuid } from 'uuid';

export class RecoveryOutcomeExecutionReadinessVerdictService {
  constructor(
    private repo: IReadinessVerdictRepository,
    private safety: RecoveryOutcomeExecutionSimulationSafetyService,
    private audit: RecoveryOutcomeExecutionSimulationAuditBridge,
    private idempotency: RecoveryOutcomeExecutionSimulationIdempotencyService,
  ) {}

  async createReadinessVerdict(
    ctx: RecoveryOutcomeExecutionSimulationCommandContext,
    req: CreateReadinessVerdictRequest,
  ): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionReadinessVerdict>> {
    try {
      this.safety.validateSchoolContext(ctx.schoolId);
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_READINESS_VERDICT_CREATION');

      const existing = await this.idempotency.checkIdempotency(ctx.schoolId, 'createReadinessVerdict', ctx.idempotencyKey);
      if (existing && existing.status === 'completed') {
        return { success: false, status: 'DUPLICATE', message: 'Idempotency key already processed', idempotencyKey: ctx.idempotencyKey };
      }

      const blockedCodes = this.safety.validateContent(req.safeVerdictSummary, req.verdictDetailsJson ?? {});
      if (blockedCodes.length > 0) {
        return { success: false, status: 'BLOCKED', message: 'Content validation failed', blockedReasonCodes: blockedCodes, idempotencyKey: ctx.idempotencyKey };
      }

      const requestHash = await this.idempotency.computeRequestHash('createReadinessVerdict', req as any);
      await this.idempotency.createIdempotencyEntry(ctx.schoolId, 'createReadinessVerdict', ctx.idempotencyKey, requestHash);

      const now = new Date().toISOString();
      const record: Partial<RecoveryOutcomeExecutionReadinessVerdict> = {
        readinessVerdictId: uuid(),
        schoolId: ctx.schoolId,
        studentRef: req.studentRef,
        resultRecoveryPlanId: req.resultRecoveryPlanId,
        simulationRunId: req.simulationRunId,
        verdictStatus: 'draft',
        safeVerdictSummary: req.safeVerdictSummary,
        verdictDetailsJson: req.verdictDetailsJson ?? {},
        blockedReasonCodesJson: [],
        sourceRefsJson: req.sourceRefsJson ?? {},
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
        createdAt: now,
        updatedAt: now,
      };

      const created = await this.repo.create(record);
      await this.audit.recordSimulationEvent(ctx, 'READINESS_VERDICT_CREATED', 'created', `Readiness verdict ${created.readinessVerdictId} created`, { readinessVerdictId: created.readinessVerdictId });
      await this.idempotency.markCompleted(ctx.schoolId, 'createReadinessVerdict', ctx.idempotencyKey, `Readiness verdict ${created.readinessVerdictId} created`);

      return { success: true, data: created, status: 'created', idempotencyKey: ctx.idempotencyKey };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, idempotencyKey: ctx.idempotencyKey };
    }
  }

  async getReadinessVerdict(schoolId: string, readinessVerdictId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionReadinessVerdict>> {
    try {
      const record = await this.repo.getById(readinessVerdictId);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Readiness verdict not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listReadinessVerdictsForPlan(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionReadinessVerdict[]>> {
    try {
      const records = await this.repo.listByPlanId(schoolId, resultRecoveryPlanId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listReadinessVerdictsForSimulationRun(simulationRunId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionReadinessVerdict[]>> {
    try {
      const records = await this.repo.listBySimulationRunId(simulationRunId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listReadinessVerdictsByStatus(schoolId: string, verdictStatus: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionReadinessVerdict[]>> {
    try {
      const records = await this.repo.listByStatus(schoolId, verdictStatus);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markReadinessVerdictReviewReady(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, readinessVerdictId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionReadinessVerdict>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_READINESS_VERDICT_CREATION');
      const updated = await this.repo.markReviewReady(readinessVerdictId);
      await this.audit.recordSimulationEvent(ctx, 'READINESS_VERDICT_REVIEW_READY', 'updated', `Readiness verdict ${readinessVerdictId} marked review ready`, { readinessVerdictId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async approveReadinessVerdictForFutureUse(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, readinessVerdictId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionReadinessVerdict>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_READINESS_VERDICT_CREATION');
      const updated = await this.repo.approveForFutureUse(readinessVerdictId);
      await this.audit.recordSimulationEvent(ctx, 'READINESS_VERDICT_APPROVED', 'updated', `Readiness verdict ${readinessVerdictId} approved for future use`, { readinessVerdictId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async suppressReadinessVerdict(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, readinessVerdictId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionReadinessVerdict>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_READINESS_VERDICT_CREATION');
      const updated = await this.repo.suppress(readinessVerdictId);
      await this.audit.recordSimulationEvent(ctx, 'READINESS_VERDICT_SUPPRESSED', 'updated', `Readiness verdict ${readinessVerdictId} suppressed`, { readinessVerdictId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async blockReadinessVerdict(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, readinessVerdictId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionReadinessVerdict>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_READINESS_VERDICT_CREATION');
      const updated = await this.repo.block(readinessVerdictId);
      await this.audit.recordSimulationEvent(ctx, 'READINESS_VERDICT_BLOCKED', 'updated', `Readiness verdict ${readinessVerdictId} blocked`, { readinessVerdictId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async voidReadinessVerdict(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, readinessVerdictId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionReadinessVerdict>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_READINESS_VERDICT_CREATION');
      const updated = await this.repo.void(readinessVerdictId);
      await this.audit.recordSimulationEvent(ctx, 'READINESS_VERDICT_VOIDED', 'updated', `Readiness verdict ${readinessVerdictId} voided`, { readinessVerdictId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }
}

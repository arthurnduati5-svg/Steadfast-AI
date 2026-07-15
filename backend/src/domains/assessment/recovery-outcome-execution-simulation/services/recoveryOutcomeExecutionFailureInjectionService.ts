import { IFailureInjectionRepository } from '../contracts/recoveryOutcomeExecutionSimulationRepositoryContracts';
import { RecoveryOutcomeExecutionFailureInjection, CreateFailureInjectionRequest } from '../contracts/recoveryOutcomeExecutionFailureInjectionContracts';
import { RecoveryOutcomeExecutionSimulationCommandContext, RecoveryOutcomeExecutionSimulationSafeEnvelope } from '../contracts/recoveryOutcomeExecutionSimulationContracts';
import { RecoveryOutcomeExecutionSimulationSafetyService } from './recoveryOutcomeExecutionSimulationSafetyService';
import { RecoveryOutcomeExecutionSimulationAuditBridge } from './recoveryOutcomeExecutionSimulationAuditBridge';
import { RecoveryOutcomeExecutionSimulationIdempotencyService } from './recoveryOutcomeExecutionSimulationIdempotencyService';
import { v4 as uuid } from 'uuid';

export class RecoveryOutcomeExecutionFailureInjectionService {
  constructor(
    private repo: IFailureInjectionRepository,
    private safety: RecoveryOutcomeExecutionSimulationSafetyService,
    private audit: RecoveryOutcomeExecutionSimulationAuditBridge,
    private idempotency: RecoveryOutcomeExecutionSimulationIdempotencyService,
  ) {}

  async createFailureInjectionScenario(
    ctx: RecoveryOutcomeExecutionSimulationCommandContext,
    req: CreateFailureInjectionRequest,
  ): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionFailureInjection>> {
    try {
      this.safety.validateSchoolContext(ctx.schoolId);
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_FAILURE_INJECTION_CREATION');

      const existing = await this.idempotency.checkIdempotency(ctx.schoolId, 'createFailureInjectionScenario', ctx.idempotencyKey);
      if (existing && existing.status === 'completed') {
        return { success: false, status: 'DUPLICATE', message: 'Idempotency key already processed', idempotencyKey: ctx.idempotencyKey };
      }

      const blockedCodes = this.safety.validateContent(req.safeInjectionSummary, { ...req.injectionParametersJson, ...req.expectedFailureBehaviorJson });
      if (blockedCodes.length > 0) {
        return { success: false, status: 'BLOCKED', message: 'Content validation failed', blockedReasonCodes: blockedCodes, idempotencyKey: ctx.idempotencyKey };
      }

      const requestHash = await this.idempotency.computeRequestHash('createFailureInjectionScenario', req as any);
      await this.idempotency.createIdempotencyEntry(ctx.schoolId, 'createFailureInjectionScenario', ctx.idempotencyKey, requestHash);

      const now = new Date().toISOString();
      const record: Partial<RecoveryOutcomeExecutionFailureInjection> = {
        failureInjectionId: uuid(),
        schoolId: ctx.schoolId,
        studentRef: req.studentRef,
        resultRecoveryPlanId: req.resultRecoveryPlanId,
        simulationPlanId: req.simulationPlanId,
        injectionType: req.injectionType,
        injectionStatus: 'draft',
        safeInjectionSummary: req.safeInjectionSummary,
        injectionParametersJson: req.injectionParametersJson ?? {},
        expectedFailureBehaviorJson: req.expectedFailureBehaviorJson ?? {},
        blockedReasonCodesJson: [],
        sourceRefsJson: req.sourceRefsJson ?? {},
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
        createdAt: now,
        updatedAt: now,
      };

      const created = await this.repo.create(record);
      await this.audit.recordSimulationEvent(ctx, 'FAILURE_INJECTION_CREATED', 'created', `Failure injection ${created.failureInjectionId} created`, { failureInjectionId: created.failureInjectionId });
      await this.idempotency.markCompleted(ctx.schoolId, 'createFailureInjectionScenario', ctx.idempotencyKey, `Failure injection ${created.failureInjectionId} created`);

      return { success: true, data: created, status: 'created', idempotencyKey: ctx.idempotencyKey };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, idempotencyKey: ctx.idempotencyKey };
    }
  }

  async getFailureInjectionScenario(schoolId: string, failureInjectionId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionFailureInjection>> {
    try {
      const record = await this.repo.getById(failureInjectionId);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Failure injection not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listFailureInjectionScenariosForPlan(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionFailureInjection[]>> {
    try {
      const records = await this.repo.listByPlanId(schoolId, resultRecoveryPlanId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listFailureInjectionScenariosByType(schoolId: string, injectionType: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionFailureInjection[]>> {
    try {
      const records = await this.repo.listByType(schoolId, injectionType);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markFailureInjectionReviewReady(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, failureInjectionId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionFailureInjection>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_FAILURE_INJECTION_CREATION');
      const updated = await this.repo.markReviewReady(failureInjectionId);
      await this.audit.recordSimulationEvent(ctx, 'FAILURE_INJECTION_REVIEW_READY', 'updated', `Failure injection ${failureInjectionId} marked review ready`, { failureInjectionId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async approveFailureInjectionForFutureUse(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, failureInjectionId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionFailureInjection>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_FAILURE_INJECTION_CREATION');
      const updated = await this.repo.approveForFutureUse(failureInjectionId);
      await this.audit.recordSimulationEvent(ctx, 'FAILURE_INJECTION_APPROVED', 'updated', `Failure injection ${failureInjectionId} approved for future use`, { failureInjectionId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async suppressFailureInjection(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, failureInjectionId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionFailureInjection>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_FAILURE_INJECTION_CREATION');
      const updated = await this.repo.suppress(failureInjectionId);
      await this.audit.recordSimulationEvent(ctx, 'FAILURE_INJECTION_SUPPRESSED', 'updated', `Failure injection ${failureInjectionId} suppressed`, { failureInjectionId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async blockFailureInjection(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, failureInjectionId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionFailureInjection>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_FAILURE_INJECTION_CREATION');
      const updated = await this.repo.block(failureInjectionId);
      await this.audit.recordSimulationEvent(ctx, 'FAILURE_INJECTION_BLOCKED', 'updated', `Failure injection ${failureInjectionId} blocked`, { failureInjectionId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async voidFailureInjection(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, failureInjectionId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionFailureInjection>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_FAILURE_INJECTION_CREATION');
      const updated = await this.repo.void(failureInjectionId);
      await this.audit.recordSimulationEvent(ctx, 'FAILURE_INJECTION_VOIDED', 'updated', `Failure injection ${failureInjectionId} voided`, { failureInjectionId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }
}

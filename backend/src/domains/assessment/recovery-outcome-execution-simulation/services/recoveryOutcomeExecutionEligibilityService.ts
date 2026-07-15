import { IEligibilityCheckRepository } from '../contracts/recoveryOutcomeExecutionSimulationRepositoryContracts';
import { RecoveryOutcomeExecutionEligibilityCheck, CreateEligibilityCheckRequest } from '../contracts/recoveryOutcomeExecutionEligibilityContracts';
import { RecoveryOutcomeExecutionSimulationCommandContext, RecoveryOutcomeExecutionSimulationSafeEnvelope } from '../contracts/recoveryOutcomeExecutionSimulationContracts';
import { RecoveryOutcomeExecutionSimulationSafetyService } from './recoveryOutcomeExecutionSimulationSafetyService';
import { RecoveryOutcomeExecutionSimulationAuditBridge } from './recoveryOutcomeExecutionSimulationAuditBridge';
import { RecoveryOutcomeExecutionSimulationIdempotencyService } from './recoveryOutcomeExecutionSimulationIdempotencyService';
import { v4 as uuid } from 'uuid';

export class RecoveryOutcomeExecutionEligibilityService {
  constructor(
    private repo: IEligibilityCheckRepository,
    private safety: RecoveryOutcomeExecutionSimulationSafetyService,
    private audit: RecoveryOutcomeExecutionSimulationAuditBridge,
    private idempotency: RecoveryOutcomeExecutionSimulationIdempotencyService,
  ) {}

  async createEligibilityCheck(
    ctx: RecoveryOutcomeExecutionSimulationCommandContext,
    req: CreateEligibilityCheckRequest,
  ): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionEligibilityCheck>> {
    try {
      this.safety.validateSchoolContext(ctx.schoolId);
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_ELIGIBILITY_CHECK_CREATION');

      const existing = await this.idempotency.checkIdempotency(ctx.schoolId, 'createEligibilityCheck', ctx.idempotencyKey);
      if (existing && existing.status === 'completed') {
        return { success: false, status: 'DUPLICATE', message: 'Idempotency key already processed', idempotencyKey: ctx.idempotencyKey };
      }

      const blockedCodes = this.safety.validateContent(req.safeEligibilitySummary, req.eligibilityChecksJson ?? {});
      if (blockedCodes.length > 0) {
        return { success: false, status: 'BLOCKED', message: 'Content validation failed', blockedReasonCodes: blockedCodes, idempotencyKey: ctx.idempotencyKey };
      }

      const requestHash = await this.idempotency.computeRequestHash('createEligibilityCheck', req as any);
      await this.idempotency.createIdempotencyEntry(ctx.schoolId, 'createEligibilityCheck', ctx.idempotencyKey, requestHash);

      const now = new Date().toISOString();
      const record: Partial<RecoveryOutcomeExecutionEligibilityCheck> = {
        eligibilityCheckId: uuid(),
        schoolId: ctx.schoolId,
        studentRef: req.studentRef,
        resultRecoveryPlanId: req.resultRecoveryPlanId,
        recoveryOutcomeActionBundleId: req.recoveryOutcomeActionBundleId,
        recoveryOutcomeActionReadinessId: req.recoveryOutcomeActionReadinessId,
        eligibilityStatus: 'pending',
        safeEligibilitySummary: req.safeEligibilitySummary,
        eligibilityChecksJson: req.eligibilityChecksJson ?? {},
        blockedReasonCodesJson: [],
        sourceRefsJson: req.sourceRefsJson ?? {},
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
        createdAt: now,
        updatedAt: now,
      };

      const created = await this.repo.create(record);
      await this.audit.recordSimulationEvent(ctx, 'ELIGIBILITY_CHECK_CREATED', 'created', `Eligibility check ${created.eligibilityCheckId} created`, { eligibilityCheckId: created.eligibilityCheckId });
      await this.idempotency.markCompleted(ctx.schoolId, 'createEligibilityCheck', ctx.idempotencyKey, `Eligibility check ${created.eligibilityCheckId} created`);

      return { success: true, data: created, status: 'created', idempotencyKey: ctx.idempotencyKey };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, idempotencyKey: ctx.idempotencyKey };
    }
  }

  async getEligibilityCheck(schoolId: string, eligibilityCheckId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionEligibilityCheck>> {
    try {
      const record = await this.repo.getById(eligibilityCheckId);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Eligibility check not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listEligibilityChecksForPlan(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionEligibilityCheck[]>> {
    try {
      const records = await this.repo.listByPlanId(schoolId, resultRecoveryPlanId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listEligibilityChecksForActionBundle(schoolId: string, bundleId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionEligibilityCheck[]>> {
    try {
      const records = await this.repo.listByActionBundleId(schoolId, bundleId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listEligibilityChecksByResult(schoolId: string, eligibilityStatus: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionEligibilityCheck[]>> {
    try {
      const records = await this.repo.listByResult(schoolId, eligibilityStatus);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markEligibilityCheckReviewReady(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, eligibilityCheckId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionEligibilityCheck>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_ELIGIBILITY_CHECK_CREATION');
      const updated = await this.repo.markReviewReady(eligibilityCheckId);
      await this.audit.recordSimulationEvent(ctx, 'ELIGIBILITY_CHECK_REVIEW_READY', 'updated', `Eligibility check ${eligibilityCheckId} marked review ready`, { eligibilityCheckId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async voidEligibilityCheck(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, eligibilityCheckId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionEligibilityCheck>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_ELIGIBILITY_CHECK_CREATION');
      const updated = await this.repo.void(eligibilityCheckId);
      await this.audit.recordSimulationEvent(ctx, 'ELIGIBILITY_CHECK_VOIDED', 'updated', `Eligibility check ${eligibilityCheckId} voided`, { eligibilityCheckId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }
}

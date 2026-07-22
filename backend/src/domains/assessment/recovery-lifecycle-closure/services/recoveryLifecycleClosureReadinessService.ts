import {
  RecoveryLifecycleClosureReadiness,
  CreateRecoveryLifecycleClosureReadinessRequest,
} from '../contracts/recoveryLifecycleClosureReadinessContracts';
import {
  RecoveryLifecycleClosureCommandContext,
  RecoveryLifecycleClosureSafeEnvelope,
} from '../contracts/recoveryLifecycleClosureContracts';
import { IRecoveryLifecycleClosureRepositories } from '../contracts/recoveryLifecycleClosureRepositoryContracts';
import { RecoveryLifecycleClosurePolicyEnforcer } from '../policies/recoveryLifecycleClosurePolicyDefinitions';
import { RecoveryLifecycleClosureSafetyService } from './recoveryLifecycleClosureSafetyService';
import { RecoveryLifecycleClosureAuditBridge } from './recoveryLifecycleClosureAuditBridge';
import { RecoveryLifecycleClosureIdempotencyService } from './recoveryLifecycleClosureIdempotencyService';
import { v4 as uuid } from 'uuid';

export class RecoveryLifecycleClosureReadinessService {
  constructor(
    private repos: IRecoveryLifecycleClosureRepositories,
    private policyEnforcer: RecoveryLifecycleClosurePolicyEnforcer,
    private safety: RecoveryLifecycleClosureSafetyService,
    private audit: RecoveryLifecycleClosureAuditBridge,
    private idempotency: RecoveryLifecycleClosureIdempotencyService,
  ) {}

  async createClosureReadiness(
    ctx: RecoveryLifecycleClosureCommandContext,
    request: CreateRecoveryLifecycleClosureReadinessRequest,
  ): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryLifecycleClosureReadiness>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_LIFECYCLE_CLOSURE_READINESS_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, idempotencyKey: ctx.idempotencyKey };
      }

      const idleCheck = await this.idempotency.checkIdempotency(ctx.schoolId, 'createClosureReadiness', ctx.idempotencyKey);
      if (idleCheck.exists) {
        return { success: false, status: 'DUPLICATE', message: 'Idempotency key already processed', idempotencyKey: ctx.idempotencyKey };
      }

      const blockedCodes = this.safety.validateClosureReadinessContent(request);
      if (blockedCodes.length > 0) {
        return { success: false, status: 'BLOCKED', message: 'Content validation failed', blockedReasonCodes: blockedCodes, idempotencyKey: ctx.idempotencyKey };
      }

      const requestHash = JSON.stringify({ operation: 'createClosureReadiness', request });
      await this.idempotency.recordIdempotency(ctx.schoolId, 'createClosureReadiness', ctx.idempotencyKey, requestHash);

      const now = new Date().toISOString();
      const record: Partial<RecoveryLifecycleClosureReadiness> = {
        closureReadinessId: uuid(),
        schoolId: ctx.schoolId,
        studentRef: request.studentRef,
        resultRecoveryPlanId: request.resultRecoveryPlanId,
        recoveryOutcomeExecutionSimulationReadinessId: request.recoveryOutcomeExecutionSimulationReadinessId,
        recoveryOutcomeExecutionSimulationPlanId: request.recoveryOutcomeExecutionSimulationPlanId,
        recoveryOutcomeExecutionSimulationRunId: request.recoveryOutcomeExecutionSimulationRunId,
        recoveryOutcomeExecutionSimulationResultId: request.recoveryOutcomeExecutionSimulationResultId,
        recoveryOutcomeExecutionSimulationSummaryId: request.recoveryOutcomeExecutionSimulationSummaryId,
        closureReadinessStatus: 'draft',
        safeReadinessSummary: request.safeReadinessSummary,
        readinessChecksJson: request.readinessChecksJson ?? {},
        blockedReasonCodesJson: [],
        sourceRefsJson: request.sourceRefsJson ?? {},
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
        createdAt: now,
        updatedAt: now,
      };

      const created = await this.repos.closureReadiness.create(record);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'CLOSURE_READINESS_CREATED',
        decision: 'created',
        safeSummary: `Closure readiness ${created.closureReadinessId} created`,
        closureReadinessId: created.closureReadinessId,
        correlationId: ctx.correlationId,
        metadata: { request },
      });
      await this.idempotency.completeIdempotency(ctx.schoolId, 'createClosureReadiness', ctx.idempotencyKey, 'closureReadiness', created.closureReadinessId, `Closure readiness ${created.closureReadinessId} created`);

      return { success: true, data: created, status: 'created', idempotencyKey: ctx.idempotencyKey };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, idempotencyKey: ctx.idempotencyKey };
    }
  }

  async getClosureReadiness(schoolId: string, readinessId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryLifecycleClosureReadiness>> {
    try {
      const record = await this.repos.closureReadiness.getById(readinessId);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Closure readiness not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listClosureReadinessForSchool(schoolId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryLifecycleClosureReadiness[]>> {
    try {
      const records = await this.repos.closureReadiness.listBySchool(schoolId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listClosureReadinessForStudent(schoolId: string, studentRef: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryLifecycleClosureReadiness[]>> {
    try {
      const records = await this.repos.closureReadiness.listByStudentRef(schoolId, studentRef);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listClosureReadinessForPlan(schoolId: string, planId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryLifecycleClosureReadiness[]>> {
    try {
      const records = await this.repos.closureReadiness.listByPlanId(schoolId, planId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listClosureReadinessByStatus(schoolId: string, status: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryLifecycleClosureReadiness[]>> {
    try {
      const records = await this.repos.closureReadiness.listByStatus(schoolId, status);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markClosureReadinessReviewReady(ctx: RecoveryLifecycleClosureCommandContext, readinessId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryLifecycleClosureReadiness>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_LIFECYCLE_CLOSURE_READINESS_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.closureReadiness.markReviewReady(readinessId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'CLOSURE_READINESS_REVIEW_READY',
        decision: 'updated',
        safeSummary: `Closure readiness ${readinessId} marked review ready`,
        closureReadinessId: readinessId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markClosureReadinessHandoffReady(ctx: RecoveryLifecycleClosureCommandContext, readinessId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryLifecycleClosureReadiness>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_LIFECYCLE_CLOSURE_READINESS_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const record = await this.repos.closureReadiness.getById(readinessId);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Closure readiness not found' };
      const updated = await this.repos.closureReadiness.update(readinessId, { closureReadinessStatus: 'handoff_ready' } as any);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'CLOSURE_READINESS_HANDOFF_READY',
        decision: 'updated',
        safeSummary: `Closure readiness ${readinessId} marked handoff ready`,
        closureReadinessId: readinessId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async approveClosureReadinessForFutureUse(ctx: RecoveryLifecycleClosureCommandContext, readinessId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryLifecycleClosureReadiness>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_LIFECYCLE_CLOSURE_READINESS_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.closureReadiness.approveForFutureUse(readinessId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'CLOSURE_READINESS_APPROVED',
        decision: 'updated',
        safeSummary: `Closure readiness ${readinessId} approved for future use`,
        closureReadinessId: readinessId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async suppressClosureReadiness(ctx: RecoveryLifecycleClosureCommandContext, readinessId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryLifecycleClosureReadiness>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_LIFECYCLE_CLOSURE_READINESS_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.closureReadiness.suppress(readinessId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'CLOSURE_READINESS_SUPPRESSED',
        decision: 'updated',
        safeSummary: `Closure readiness ${readinessId} suppressed`,
        closureReadinessId: readinessId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async blockClosureReadiness(ctx: RecoveryLifecycleClosureCommandContext, readinessId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryLifecycleClosureReadiness>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_LIFECYCLE_CLOSURE_READINESS_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.closureReadiness.block(readinessId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'CLOSURE_READINESS_BLOCKED',
        decision: 'updated',
        safeSummary: `Closure readiness ${readinessId} blocked`,
        closureReadinessId: readinessId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async voidClosureReadiness(ctx: RecoveryLifecycleClosureCommandContext, readinessId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryLifecycleClosureReadiness>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_LIFECYCLE_CLOSURE_READINESS_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.closureReadiness.void(readinessId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'CLOSURE_READINESS_VOIDED',
        decision: 'updated',
        safeSummary: `Closure readiness ${readinessId} voided`,
        closureReadinessId: readinessId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }
}

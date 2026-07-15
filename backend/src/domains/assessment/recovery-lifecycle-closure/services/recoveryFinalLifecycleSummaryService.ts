import {
  RecoveryFinalLifecycleSummary,
  CreateRecoveryFinalLifecycleSummaryRequest,
} from '../contracts/recoveryFinalLifecycleSummaryContracts';
import {
  RecoveryLifecycleClosureCommandContext,
  RecoveryLifecycleClosureSafeEnvelope,
} from '../contracts/recoveryLifecycleClosureContracts';
import { InMemoryRecoveryLifecycleClosureRepositories } from '../repositories/inMemoryRecoveryLifecycleClosureRepositories';
import { RecoveryLifecycleClosurePolicyEnforcer } from '../policies/recoveryLifecycleClosurePolicyDefinitions';
import { RecoveryLifecycleClosureSafetyService } from './recoveryLifecycleClosureSafetyService';
import { RecoveryLifecycleClosureAuditBridge } from './recoveryLifecycleClosureAuditBridge';
import { RecoveryLifecycleClosureIdempotencyService } from './recoveryLifecycleClosureIdempotencyService';
import { v4 as uuid } from 'uuid';

export class RecoveryFinalLifecycleSummaryService {
  constructor(
    private repos: InMemoryRecoveryLifecycleClosureRepositories,
    private policyEnforcer: RecoveryLifecycleClosurePolicyEnforcer,
    private safety: RecoveryLifecycleClosureSafetyService,
    private audit: RecoveryLifecycleClosureAuditBridge,
    private idempotency: RecoveryLifecycleClosureIdempotencyService,
  ) {}

  async createFinalLifecycleSummary(
    ctx: RecoveryLifecycleClosureCommandContext,
    request: CreateRecoveryFinalLifecycleSummaryRequest,
  ): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryFinalLifecycleSummary>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_FINAL_LIFECYCLE_SUMMARY_MUTATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, idempotencyKey: ctx.idempotencyKey };
      }

      const idleCheck = await this.idempotency.checkIdempotency(ctx.schoolId, 'createFinalLifecycleSummary', ctx.idempotencyKey);
      if (idleCheck.exists) {
        return { success: false, status: 'DUPLICATE', message: 'Idempotency key already processed', idempotencyKey: ctx.idempotencyKey };
      }

      const blockedCodes = this.safety.validateFinalLifecycleSummaryContent(request);
      if (blockedCodes.length > 0) {
        return { success: false, status: 'BLOCKED', message: 'Content validation failed', blockedReasonCodes: blockedCodes, idempotencyKey: ctx.idempotencyKey };
      }

      const requestHash = JSON.stringify({ operation: 'createFinalLifecycleSummary', request });
      await this.idempotency.recordIdempotency(ctx.schoolId, 'createFinalLifecycleSummary', ctx.idempotencyKey, requestHash);

      const now = new Date().toISOString();
      const record: Partial<RecoveryFinalLifecycleSummary> = {
        finalLifecycleSummaryId: uuid(),
        schoolId: ctx.schoolId,
        studentRef: request.studentRef,
        resultRecoveryPlanId: request.resultRecoveryPlanId,
        recoveryOutcomeExecutionSimulationSummaryId: request.recoveryOutcomeExecutionSimulationSummaryId,
        summaryStatus: 'draft',
        safeSummary: request.safeSummary,
        lifecycleOverviewJson: request.lifecycleOverviewJson ?? {},
        outcomesJson: request.outcomesJson ?? {},
        nextStepsJson: request.nextStepsJson ?? {},
        blockedReasonCodesJson: [],
        sourceRefsJson: request.sourceRefsJson ?? {},
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
        createdAt: now,
        updatedAt: now,
      };

      const created = await this.repos.finalLifecycleSummary.create(record);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'FINAL_LIFECYCLE_SUMMARY_CREATED',
        decision: 'created',
        safeSummary: `Final lifecycle summary ${created.finalLifecycleSummaryId} created`,
        finalLifecycleSummaryId: created.finalLifecycleSummaryId,
        correlationId: ctx.correlationId,
        metadata: { request },
      });
      await this.idempotency.completeIdempotency(ctx.schoolId, 'createFinalLifecycleSummary', ctx.idempotencyKey, 'finalLifecycleSummary', created.finalLifecycleSummaryId, `Final lifecycle summary ${created.finalLifecycleSummaryId} created`);

      return { success: true, data: created, status: 'created', idempotencyKey: ctx.idempotencyKey };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, idempotencyKey: ctx.idempotencyKey };
    }
  }

  async getFinalLifecycleSummary(schoolId: string, summaryId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryFinalLifecycleSummary>> {
    try {
      const record = await this.repos.finalLifecycleSummary.getById(summaryId);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Final lifecycle summary not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listFinalLifecycleSummariesForSchool(schoolId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryFinalLifecycleSummary[]>> {
    try {
      const records = await this.repos.finalLifecycleSummary.listBySchool(schoolId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listFinalLifecycleSummariesForStudent(schoolId: string, studentRef: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryFinalLifecycleSummary[]>> {
    try {
      const records = await this.repos.finalLifecycleSummary.listByStudentRef(schoolId, studentRef);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listFinalLifecycleSummariesForPlan(schoolId: string, planId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryFinalLifecycleSummary[]>> {
    try {
      const records = await this.repos.finalLifecycleSummary.listByPlanId(schoolId, planId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async refreshFinalLifecycleSummary(ctx: RecoveryLifecycleClosureCommandContext, finalLifecycleSummaryId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryFinalLifecycleSummary>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_FINAL_LIFECYCLE_SUMMARY_MUTATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.finalLifecycleSummary.refresh(finalLifecycleSummaryId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'FINAL_LIFECYCLE_SUMMARY_REFRESHED',
        decision: 'updated',
        safeSummary: `Final lifecycle summary ${finalLifecycleSummaryId} refreshed`,
        finalLifecycleSummaryId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markFinalLifecycleSummaryStale(ctx: RecoveryLifecycleClosureCommandContext, finalLifecycleSummaryId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryFinalLifecycleSummary>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_FINAL_LIFECYCLE_SUMMARY_MUTATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.finalLifecycleSummary.markStale(finalLifecycleSummaryId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'FINAL_LIFECYCLE_SUMMARY_STALE',
        decision: 'updated',
        safeSummary: `Final lifecycle summary ${finalLifecycleSummaryId} marked stale`,
        finalLifecycleSummaryId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markFinalLifecycleSummaryReviewReady(ctx: RecoveryLifecycleClosureCommandContext, finalLifecycleSummaryId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryFinalLifecycleSummary>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_FINAL_LIFECYCLE_SUMMARY_MUTATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.finalLifecycleSummary.markReviewReady(finalLifecycleSummaryId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'FINAL_LIFECYCLE_SUMMARY_REVIEW_READY',
        decision: 'updated',
        safeSummary: `Final lifecycle summary ${finalLifecycleSummaryId} marked review ready`,
        finalLifecycleSummaryId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async approveFinalLifecycleSummaryForFutureUse(ctx: RecoveryLifecycleClosureCommandContext, finalLifecycleSummaryId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryFinalLifecycleSummary>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_FINAL_LIFECYCLE_SUMMARY_MUTATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.finalLifecycleSummary.approveForFutureUse(finalLifecycleSummaryId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'FINAL_LIFECYCLE_SUMMARY_APPROVED',
        decision: 'updated',
        safeSummary: `Final lifecycle summary ${finalLifecycleSummaryId} approved for future use`,
        finalLifecycleSummaryId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async blockFinalLifecycleSummary(ctx: RecoveryLifecycleClosureCommandContext, finalLifecycleSummaryId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryFinalLifecycleSummary>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_FINAL_LIFECYCLE_SUMMARY_MUTATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.finalLifecycleSummary.block(finalLifecycleSummaryId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'FINAL_LIFECYCLE_SUMMARY_BLOCKED',
        decision: 'updated',
        safeSummary: `Final lifecycle summary ${finalLifecycleSummaryId} blocked`,
        finalLifecycleSummaryId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async voidFinalLifecycleSummary(ctx: RecoveryLifecycleClosureCommandContext, finalLifecycleSummaryId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryFinalLifecycleSummary>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_FINAL_LIFECYCLE_SUMMARY_MUTATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.finalLifecycleSummary.void(finalLifecycleSummaryId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'FINAL_LIFECYCLE_SUMMARY_VOIDED',
        decision: 'updated',
        safeSummary: `Final lifecycle summary ${finalLifecycleSummaryId} voided`,
        finalLifecycleSummaryId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }
}

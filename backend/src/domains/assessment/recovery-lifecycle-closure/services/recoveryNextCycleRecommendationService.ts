import {
  RecoveryNextCycleRecommendationDraft,
  CreateRecoveryNextCycleRecommendationDraftRequest,
} from '../contracts/recoveryNextCycleRecommendationContracts';
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

export class RecoveryNextCycleRecommendationService {
  constructor(
    private repos: InMemoryRecoveryLifecycleClosureRepositories,
    private policyEnforcer: RecoveryLifecycleClosurePolicyEnforcer,
    private safety: RecoveryLifecycleClosureSafetyService,
    private audit: RecoveryLifecycleClosureAuditBridge,
    private idempotency: RecoveryLifecycleClosureIdempotencyService,
  ) {}

  async createNextCycleRecommendationDraft(
    ctx: RecoveryLifecycleClosureCommandContext,
    request: CreateRecoveryNextCycleRecommendationDraftRequest,
  ): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryNextCycleRecommendationDraft>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_NEXT_CYCLE_RECOMMENDATION_DRAFT_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, idempotencyKey: ctx.idempotencyKey };
      }

      const idleCheck = await this.idempotency.checkIdempotency(ctx.schoolId, 'createNextCycleRecommendationDraft', ctx.idempotencyKey);
      if (idleCheck.exists) {
        return { success: false, status: 'DUPLICATE', message: 'Idempotency key already processed', idempotencyKey: ctx.idempotencyKey };
      }

      const blockedCodes = this.safety.validateNextCycleRecommendationContent(request);
      if (blockedCodes.length > 0) {
        return { success: false, status: 'BLOCKED', message: 'Content validation failed', blockedReasonCodes: blockedCodes, idempotencyKey: ctx.idempotencyKey };
      }

      const requestHash = JSON.stringify({ operation: 'createNextCycleRecommendationDraft', request });
      await this.idempotency.recordIdempotency(ctx.schoolId, 'createNextCycleRecommendationDraft', ctx.idempotencyKey, requestHash);

      const now = new Date().toISOString();
      const record: Partial<RecoveryNextCycleRecommendationDraft> = {
        nextCycleRecommendationId: uuid(),
        schoolId: ctx.schoolId,
        studentRef: request.studentRef,
        resultRecoveryPlanId: request.resultRecoveryPlanId,
        recoveryOutcomeExecutionSimulationSummaryId: request.recoveryOutcomeExecutionSimulationSummaryId,
        recommendationType: request.recommendationType,
        recommendationStatus: 'draft',
        safeRecommendationSummary: request.safeRecommendationSummary,
        recommendationDetailsJson: request.recommendationDetailsJson ?? {},
        blockedReasonCodesJson: [],
        sourceRefsJson: request.sourceRefsJson ?? {},
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
        createdAt: now,
        updatedAt: now,
      };

      const created = await this.repos.nextCycleRecommendationDraft.create(record);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'NEXT_CYCLE_RECOMMENDATION_DRAFT_CREATED',
        decision: 'created',
        safeSummary: `Next cycle recommendation draft ${created.nextCycleRecommendationId} created`,
        nextCycleRecommendationId: created.nextCycleRecommendationId,
        correlationId: ctx.correlationId,
        metadata: { request },
      });
      await this.idempotency.completeIdempotency(ctx.schoolId, 'createNextCycleRecommendationDraft', ctx.idempotencyKey, 'nextCycleRecommendation', created.nextCycleRecommendationId, `Next cycle recommendation draft ${created.nextCycleRecommendationId} created`);

      return { success: true, data: created, status: 'created', idempotencyKey: ctx.idempotencyKey };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, idempotencyKey: ctx.idempotencyKey };
    }
  }

  async getNextCycleRecommendationDraft(schoolId: string, recommendationId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryNextCycleRecommendationDraft>> {
    try {
      const record = await this.repos.nextCycleRecommendationDraft.getById(recommendationId);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Next cycle recommendation draft not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listNextCycleRecommendationDraftsForPlan(schoolId: string, planId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryNextCycleRecommendationDraft[]>> {
    try {
      const records = await this.repos.nextCycleRecommendationDraft.listByPlanId(schoolId, planId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listNextCycleRecommendationDraftsForStudent(schoolId: string, studentRef: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryNextCycleRecommendationDraft[]>> {
    try {
      const records = await this.repos.nextCycleRecommendationDraft.listByStudentRef(schoolId, studentRef);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listNextCycleRecommendationDraftsByType(schoolId: string, recommendationType: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryNextCycleRecommendationDraft[]>> {
    try {
      const records = await this.repos.nextCycleRecommendationDraft.listByType(schoolId, recommendationType);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markNextCycleRecommendationReviewReady(ctx: RecoveryLifecycleClosureCommandContext, recommendationId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryNextCycleRecommendationDraft>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_NEXT_CYCLE_RECOMMENDATION_DRAFT_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.nextCycleRecommendationDraft.markReviewReady(recommendationId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'NEXT_CYCLE_RECOMMENDATION_REVIEW_READY',
        decision: 'updated',
        safeSummary: `Next cycle recommendation draft ${recommendationId} marked review ready`,
        nextCycleRecommendationId: recommendationId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async approveNextCycleRecommendationForFutureUse(ctx: RecoveryLifecycleClosureCommandContext, recommendationId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryNextCycleRecommendationDraft>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_NEXT_CYCLE_RECOMMENDATION_DRAFT_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.nextCycleRecommendationDraft.approveForFutureUse(recommendationId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'NEXT_CYCLE_RECOMMENDATION_APPROVED',
        decision: 'updated',
        safeSummary: `Next cycle recommendation draft ${recommendationId} approved for future use`,
        nextCycleRecommendationId: recommendationId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async suppressNextCycleRecommendation(ctx: RecoveryLifecycleClosureCommandContext, recommendationId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryNextCycleRecommendationDraft>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_NEXT_CYCLE_RECOMMENDATION_DRAFT_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.nextCycleRecommendationDraft.suppress(recommendationId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'NEXT_CYCLE_RECOMMENDATION_SUPPRESSED',
        decision: 'updated',
        safeSummary: `Next cycle recommendation draft ${recommendationId} suppressed`,
        nextCycleRecommendationId: recommendationId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async blockNextCycleRecommendation(ctx: RecoveryLifecycleClosureCommandContext, recommendationId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryNextCycleRecommendationDraft>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_NEXT_CYCLE_RECOMMENDATION_DRAFT_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.nextCycleRecommendationDraft.block(recommendationId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'NEXT_CYCLE_RECOMMENDATION_BLOCKED',
        decision: 'updated',
        safeSummary: `Next cycle recommendation draft ${recommendationId} blocked`,
        nextCycleRecommendationId: recommendationId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async voidNextCycleRecommendation(ctx: RecoveryLifecycleClosureCommandContext, recommendationId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryNextCycleRecommendationDraft>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_NEXT_CYCLE_RECOMMENDATION_DRAFT_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.nextCycleRecommendationDraft.void(recommendationId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'NEXT_CYCLE_RECOMMENDATION_VOIDED',
        decision: 'updated',
        safeSummary: `Next cycle recommendation draft ${recommendationId} voided`,
        nextCycleRecommendationId: recommendationId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }
}

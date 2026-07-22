import {
  RecoveryStudentClosureReflectionDraft,
  RecoveryParentClosureGuidanceDraft,
  CreateRecoveryStudentClosureReflectionDraftRequest,
  CreateRecoveryParentClosureGuidanceDraftRequest,
} from '../contracts/recoveryStakeholderClosureDraftContracts';
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

export class RecoveryStakeholderClosureDraftService {
  constructor(
    private repos: IRecoveryLifecycleClosureRepositories,
    private policyEnforcer: RecoveryLifecycleClosurePolicyEnforcer,
    private safety: RecoveryLifecycleClosureSafetyService,
    private audit: RecoveryLifecycleClosureAuditBridge,
    private idempotency: RecoveryLifecycleClosureIdempotencyService,
  ) {}

  async createStudentClosureReflectionDraft(
    ctx: RecoveryLifecycleClosureCommandContext,
    request: CreateRecoveryStudentClosureReflectionDraftRequest,
  ): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryStudentClosureReflectionDraft>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_STUDENT_CLOSURE_REFLECTION_DRAFT_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, idempotencyKey: ctx.idempotencyKey };
      }

      const idleCheck = await this.idempotency.checkIdempotency(ctx.schoolId, 'createStudentClosureReflectionDraft', ctx.idempotencyKey);
      if (idleCheck.exists) {
        return { success: false, status: 'DUPLICATE', message: 'Idempotency key already processed', idempotencyKey: ctx.idempotencyKey };
      }

      const blockedCodes = this.safety.validateStudentClosureReflectionContent(request);
      if (blockedCodes.length > 0) {
        return { success: false, status: 'BLOCKED', message: 'Content validation failed', blockedReasonCodes: blockedCodes, idempotencyKey: ctx.idempotencyKey };
      }

      const requestHash = JSON.stringify({ operation: 'createStudentClosureReflectionDraft', request });
      await this.idempotency.recordIdempotency(ctx.schoolId, 'createStudentClosureReflectionDraft', ctx.idempotencyKey, requestHash);

      const now = new Date().toISOString();
      const record: Partial<RecoveryStudentClosureReflectionDraft> = {
        studentClosureReflectionDraftId: uuid(),
        schoolId: ctx.schoolId,
        studentRef: request.studentRef,
        resultRecoveryPlanId: request.resultRecoveryPlanId,
        recoveryOutcomeExecutionSimulationRunId: request.recoveryOutcomeExecutionSimulationRunId,
        draftStatus: 'draft',
        safeStudentReflectionSummary: request.safeStudentReflectionSummary,
        reflectionContentJson: request.reflectionContentJson ?? {},
        blockedReasonCodesJson: [],
        sourceRefsJson: request.sourceRefsJson ?? {},
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
        createdAt: now,
        updatedAt: now,
      };

      const created = await this.repos.studentClosureReflectionDraft.create(record);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'STUDENT_CLOSURE_REFLECTION_DRAFT_CREATED',
        decision: 'created',
        safeSummary: `Student closure reflection draft ${created.studentClosureReflectionDraftId} created`,
        studentClosureReflectionDraftId: created.studentClosureReflectionDraftId,
        correlationId: ctx.correlationId,
        metadata: { request },
      });
      await this.idempotency.completeIdempotency(ctx.schoolId, 'createStudentClosureReflectionDraft', ctx.idempotencyKey, 'studentClosureReflectionDraft', created.studentClosureReflectionDraftId, `Student closure reflection draft ${created.studentClosureReflectionDraftId} created`);

      return { success: true, data: created, status: 'created', idempotencyKey: ctx.idempotencyKey };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, idempotencyKey: ctx.idempotencyKey };
    }
  }

  async getStudentClosureReflectionDraft(schoolId: string, draftId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryStudentClosureReflectionDraft>> {
    try {
      const record = await this.repos.studentClosureReflectionDraft.getById(draftId);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Student closure reflection draft not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listStudentClosureReflectionDraftsForPlan(schoolId: string, planId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryStudentClosureReflectionDraft[]>> {
    try {
      const records = await this.repos.studentClosureReflectionDraft.listByPlanId(schoolId, planId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listStudentClosureReflectionDraftsByStatus(schoolId: string, status: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryStudentClosureReflectionDraft[]>> {
    try {
      const records = await this.repos.studentClosureReflectionDraft.listByStatus(schoolId, status);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markStudentClosureReflectionReviewReady(ctx: RecoveryLifecycleClosureCommandContext, draftId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryStudentClosureReflectionDraft>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_STUDENT_CLOSURE_REFLECTION_DRAFT_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.studentClosureReflectionDraft.markReviewReady(draftId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'STUDENT_CLOSURE_REFLECTION_REVIEW_READY',
        decision: 'updated',
        safeSummary: `Student closure reflection draft ${draftId} marked review ready`,
        studentClosureReflectionDraftId: draftId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async approveStudentClosureReflectionForFutureUse(ctx: RecoveryLifecycleClosureCommandContext, draftId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryStudentClosureReflectionDraft>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_STUDENT_CLOSURE_REFLECTION_DRAFT_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.studentClosureReflectionDraft.approveForFutureUse(draftId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'STUDENT_CLOSURE_REFLECTION_APPROVED',
        decision: 'updated',
        safeSummary: `Student closure reflection draft ${draftId} approved for future use`,
        studentClosureReflectionDraftId: draftId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async suppressStudentClosureReflection(ctx: RecoveryLifecycleClosureCommandContext, draftId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryStudentClosureReflectionDraft>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_STUDENT_CLOSURE_REFLECTION_DRAFT_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.studentClosureReflectionDraft.suppress(draftId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'STUDENT_CLOSURE_REFLECTION_SUPPRESSED',
        decision: 'updated',
        safeSummary: `Student closure reflection draft ${draftId} suppressed`,
        studentClosureReflectionDraftId: draftId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async blockStudentClosureReflection(ctx: RecoveryLifecycleClosureCommandContext, draftId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryStudentClosureReflectionDraft>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_STUDENT_CLOSURE_REFLECTION_DRAFT_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.studentClosureReflectionDraft.block(draftId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'STUDENT_CLOSURE_REFLECTION_BLOCKED',
        decision: 'updated',
        safeSummary: `Student closure reflection draft ${draftId} blocked`,
        studentClosureReflectionDraftId: draftId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async voidStudentClosureReflection(ctx: RecoveryLifecycleClosureCommandContext, draftId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryStudentClosureReflectionDraft>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_STUDENT_CLOSURE_REFLECTION_DRAFT_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.studentClosureReflectionDraft.void(draftId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'STUDENT_CLOSURE_REFLECTION_VOIDED',
        decision: 'updated',
        safeSummary: `Student closure reflection draft ${draftId} voided`,
        studentClosureReflectionDraftId: draftId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async createParentClosureGuidanceDraft(
    ctx: RecoveryLifecycleClosureCommandContext,
    request: CreateRecoveryParentClosureGuidanceDraftRequest,
  ): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryParentClosureGuidanceDraft>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_PARENT_CLOSURE_GUIDANCE_DRAFT_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, idempotencyKey: ctx.idempotencyKey };
      }

      const idleCheck = await this.idempotency.checkIdempotency(ctx.schoolId, 'createParentClosureGuidanceDraft', ctx.idempotencyKey);
      if (idleCheck.exists) {
        return { success: false, status: 'DUPLICATE', message: 'Idempotency key already processed', idempotencyKey: ctx.idempotencyKey };
      }

      const blockedCodes = this.safety.validateParentClosureGuidanceContent(request);
      if (blockedCodes.length > 0) {
        return { success: false, status: 'BLOCKED', message: 'Content validation failed', blockedReasonCodes: blockedCodes, idempotencyKey: ctx.idempotencyKey };
      }

      const requestHash = JSON.stringify({ operation: 'createParentClosureGuidanceDraft', request });
      await this.idempotency.recordIdempotency(ctx.schoolId, 'createParentClosureGuidanceDraft', ctx.idempotencyKey, requestHash);

      const now = new Date().toISOString();
      const record: Partial<RecoveryParentClosureGuidanceDraft> = {
        parentClosureGuidanceDraftId: uuid(),
        schoolId: ctx.schoolId,
        studentRef: request.studentRef,
        resultRecoveryPlanId: request.resultRecoveryPlanId,
        recoveryOutcomeExecutionSimulationRunId: request.recoveryOutcomeExecutionSimulationRunId,
        draftStatus: 'draft',
        safeParentGuidanceSummary: request.safeParentGuidanceSummary,
        guidanceContentJson: request.guidanceContentJson ?? {},
        blockedReasonCodesJson: [],
        sourceRefsJson: request.sourceRefsJson ?? {},
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
        createdAt: now,
        updatedAt: now,
      };

      const created = await this.repos.parentClosureGuidanceDraft.create(record);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'PARENT_CLOSURE_GUIDANCE_DRAFT_CREATED',
        decision: 'created',
        safeSummary: `Parent closure guidance draft ${created.parentClosureGuidanceDraftId} created`,
        parentClosureGuidanceDraftId: created.parentClosureGuidanceDraftId,
        correlationId: ctx.correlationId,
        metadata: { request },
      });
      await this.idempotency.completeIdempotency(ctx.schoolId, 'createParentClosureGuidanceDraft', ctx.idempotencyKey, 'parentClosureGuidanceDraft', created.parentClosureGuidanceDraftId, `Parent closure guidance draft ${created.parentClosureGuidanceDraftId} created`);

      return { success: true, data: created, status: 'created', idempotencyKey: ctx.idempotencyKey };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, idempotencyKey: ctx.idempotencyKey };
    }
  }

  async getParentClosureGuidanceDraft(schoolId: string, draftId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryParentClosureGuidanceDraft>> {
    try {
      const record = await this.repos.parentClosureGuidanceDraft.getById(draftId);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Parent closure guidance draft not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listParentClosureGuidanceDraftsForPlan(schoolId: string, planId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryParentClosureGuidanceDraft[]>> {
    try {
      const records = await this.repos.parentClosureGuidanceDraft.listByPlanId(schoolId, planId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listParentClosureGuidanceDraftsByStatus(schoolId: string, status: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryParentClosureGuidanceDraft[]>> {
    try {
      const records = await this.repos.parentClosureGuidanceDraft.listByStatus(schoolId, status);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markParentClosureGuidanceReviewReady(ctx: RecoveryLifecycleClosureCommandContext, draftId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryParentClosureGuidanceDraft>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_PARENT_CLOSURE_GUIDANCE_DRAFT_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.parentClosureGuidanceDraft.markReviewReady(draftId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'PARENT_CLOSURE_GUIDANCE_REVIEW_READY',
        decision: 'updated',
        safeSummary: `Parent closure guidance draft ${draftId} marked review ready`,
        parentClosureGuidanceDraftId: draftId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async approveParentClosureGuidanceForFutureUse(ctx: RecoveryLifecycleClosureCommandContext, draftId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryParentClosureGuidanceDraft>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_PARENT_CLOSURE_GUIDANCE_DRAFT_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.parentClosureGuidanceDraft.approveForFutureUse(draftId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'PARENT_CLOSURE_GUIDANCE_APPROVED',
        decision: 'updated',
        safeSummary: `Parent closure guidance draft ${draftId} approved for future use`,
        parentClosureGuidanceDraftId: draftId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async suppressParentClosureGuidance(ctx: RecoveryLifecycleClosureCommandContext, draftId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryParentClosureGuidanceDraft>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_PARENT_CLOSURE_GUIDANCE_DRAFT_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.parentClosureGuidanceDraft.suppress(draftId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'PARENT_CLOSURE_GUIDANCE_SUPPRESSED',
        decision: 'updated',
        safeSummary: `Parent closure guidance draft ${draftId} suppressed`,
        parentClosureGuidanceDraftId: draftId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async blockParentClosureGuidance(ctx: RecoveryLifecycleClosureCommandContext, draftId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryParentClosureGuidanceDraft>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_PARENT_CLOSURE_GUIDANCE_DRAFT_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.parentClosureGuidanceDraft.block(draftId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'PARENT_CLOSURE_GUIDANCE_BLOCKED',
        decision: 'updated',
        safeSummary: `Parent closure guidance draft ${draftId} blocked`,
        parentClosureGuidanceDraftId: draftId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async voidParentClosureGuidance(ctx: RecoveryLifecycleClosureCommandContext, draftId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryParentClosureGuidanceDraft>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_PARENT_CLOSURE_GUIDANCE_DRAFT_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.parentClosureGuidanceDraft.void(draftId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'PARENT_CLOSURE_GUIDANCE_VOIDED',
        decision: 'updated',
        safeSummary: `Parent closure guidance draft ${draftId} voided`,
        parentClosureGuidanceDraftId: draftId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }
}

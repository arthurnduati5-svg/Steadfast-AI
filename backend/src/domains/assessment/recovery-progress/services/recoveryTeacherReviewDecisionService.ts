import { randomUUID } from 'crypto';
import type { RecoveryProgressCommandContext, RecoveryProgressSafeEnvelope, RecoveryTeacherReviewDecision } from '../contracts/recoveryProgressContracts';
import type { CreateTeacherReviewDecisionRequest, UpdateTeacherReviewDecisionRequest } from '../contracts/recoveryTeacherReviewDecisionContracts';
import { RecoveryProgressPolicyEnforcer } from '../policies/recoveryProgressPolicyDefinitions';
import { RecoveryProgressSafetyService } from './recoveryProgressSafetyService';
import { RecoveryProgressIdempotencyService } from './recoveryProgressIdempotencyService';
import { RecoveryProgressAuditBridge } from './recoveryProgressAuditBridge';

export interface TeacherReviewDecisionRepository {
  create(data: RecoveryTeacherReviewDecision): Promise<RecoveryTeacherReviewDecision>;
  getById(id: string): Promise<RecoveryTeacherReviewDecision | null>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryTeacherReviewDecision[]>;
  listByTeacherRef(schoolId: string, teacherRef: string): Promise<RecoveryTeacherReviewDecision[]>;
  listByAdjustmentDraftId(adjustmentDraftId: string): Promise<RecoveryTeacherReviewDecision[]>;
  listByEvaluationId(evaluationId: string): Promise<RecoveryTeacherReviewDecision[]>;
  update(id: string, data: Partial<RecoveryTeacherReviewDecision>): Promise<RecoveryTeacherReviewDecision>;
  updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryTeacherReviewDecision>;
}

export class RecoveryTeacherReviewDecisionService {
  private policyEnforcer = new RecoveryProgressPolicyEnforcer();

  constructor(
    private decisionRepo: TeacherReviewDecisionRepository,
    private safetyService: RecoveryProgressSafetyService,
    private auditBridge: RecoveryProgressAuditBridge,
    private idempotencyService: RecoveryProgressIdempotencyService,
  ) {}

  private envelope(ctx: RecoveryProgressCommandContext, overrides: Partial<RecoveryProgressSafeEnvelope>): RecoveryProgressSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createDecision(ctx: RecoveryProgressCommandContext, input: CreateTeacherReviewDecisionRequest): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RECOVERY_TEACHER_REVIEW_DECISION_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });

    const idempotencyKey = ctx.idempotencyKey || randomUUID();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createDecision', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const now = new Date().toISOString();
    const record: RecoveryTeacherReviewDecision = {
      recoveryTeacherReviewDecisionId: randomUUID(),
      schoolId: ctx.schoolId,
      studentRef: input.studentRef,
      teacherRef: input.teacherRef,
      resultRecoveryPlanId: input.resultRecoveryPlanId,
      recoveryPlanAdjustmentDraftId: input.recoveryPlanAdjustmentDraftId,
      recoveryCheckpointEvaluationId: input.recoveryCheckpointEvaluationId,
      recoveryEvidenceRollupId: input.recoveryEvidenceRollupId,
      decisionStatus: 'draft',
      decisionType: input.decisionType as any,
      safeDecisionSummary: input.safeDecisionSummary,
      decisionReasonCodesJson: (input.decisionReasonCodesJson || {}) as Record<string, unknown>,
      approvedFutureUseRefsJson: (input.approvedFutureUseRefsJson || {}) as Record<string, unknown>,
      blockedReasonCodesJson: input.blockedReasonCodesJson || [],
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
      createdAt: now,
      updatedAt: now,
      reviewedAt: now,
      approvedForFutureUseAt: undefined,
      suppressedAt: undefined,
      blockedAt: undefined,
      voidedAt: undefined,
    };
    const created = await this.decisionRepo.create(record);
    await this.idempotencyService.startOperation(ctx.schoolId, 'createDecision', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createDecision', idempotencyKey, 'RecoveryTeacherReviewDecision', created.recoveryTeacherReviewDecisionId, 'Teacher review decision created');
    await this.auditBridge.recordTeacherReviewDecisionCreated(ctx.schoolId, created.recoveryTeacherReviewDecisionId, ctx.actorId, ctx.actorRole, ctx.requestId, ctx.correlationId);
    return this.envelope(ctx, { resourceId: created.recoveryTeacherReviewDecisionId, status: created.decisionStatus, safeMessage: 'Teacher review decision created', reasonCode: 'DECISION_CREATED', data: created });
  }

  async getDecision(ctx: RecoveryProgressCommandContext, decisionId: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.decisionRepo.getById(decisionId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Decision not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: decisionId, status: record.decisionStatus, safeMessage: 'Decision found', data: record });
  }

  async listDecisionsForPlan(ctx: RecoveryProgressCommandContext, planId: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.decisionRepo.listByPlanId(ctx.schoolId, planId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} decisions for plan`, data: records });
  }

  async listDecisionsForTeacher(ctx: RecoveryProgressCommandContext, teacherRef: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.decisionRepo.listByTeacherRef(ctx.schoolId, teacherRef);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} decisions for teacher`, data: records });
  }

  async listDecisionsForAdjustmentDraft(ctx: RecoveryProgressCommandContext, adjustmentDraftId: string): Promise<RecoveryProgressSafeEnvelope> {
    const records = await this.decisionRepo.listByAdjustmentDraftId(adjustmentDraftId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} decisions for adjustment draft`, data: records });
  }

  async listDecisionsForEvaluation(ctx: RecoveryProgressCommandContext, evaluationId: string): Promise<RecoveryProgressSafeEnvelope> {
    const records = await this.decisionRepo.listByEvaluationId(evaluationId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} decisions for evaluation`, data: records });
  }

  async markDecisionReviewed(ctx: RecoveryProgressCommandContext, decisionId: string, reasonCode: string, safeMessage: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RECOVERY_TEACHER_REVIEW_DECISION_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.decisionRepo.getById(decisionId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Decision not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.decisionStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot review voided decision', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.decisionRepo.updateStatus(decisionId, 'reviewed', now);
    await this.decisionRepo.update(decisionId, { reviewedAt: now } as any);
    return this.envelope(ctx, { resourceId: decisionId, status: 'reviewed', safeMessage: safeMessage || 'Decision reviewed', reasonCode: reasonCode || 'DECISION_REVIEWED' });
  }

  async markDecisionApprovedForFutureUse(ctx: RecoveryProgressCommandContext, decisionId: string, reasonCode: string, safeMessage: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RECOVERY_TEACHER_REVIEW_DECISION_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.decisionRepo.getById(decisionId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Decision not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.decisionStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot approve voided decision', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.decisionRepo.updateStatus(decisionId, 'approved_for_future_use', now);
    await this.decisionRepo.update(decisionId, { approvedForFutureUseAt: now } as any);
    return this.envelope(ctx, { resourceId: decisionId, status: 'approved_for_future_use', safeMessage: safeMessage || 'Decision approved', reasonCode: reasonCode || 'DECISION_APPROVED' });
  }

  async suppressDecision(ctx: RecoveryProgressCommandContext, decisionId: string, reasonCode: string, safeMessage: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.decisionRepo.getById(decisionId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Decision not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.decisionStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot suppress voided decision', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.decisionRepo.updateStatus(decisionId, 'suppressed', now);
    await this.decisionRepo.update(decisionId, { suppressedAt: now } as any);
    return this.envelope(ctx, { resourceId: decisionId, status: 'suppressed', safeMessage: safeMessage || 'Decision suppressed', reasonCode: reasonCode || 'DECISION_SUPPRESSED' });
  }

  async blockDecision(ctx: RecoveryProgressCommandContext, decisionId: string, reasonCode: string, safeMessage: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.decisionRepo.getById(decisionId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Decision not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.decisionStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided decision', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.decisionRepo.updateStatus(decisionId, 'blocked', now);
    await this.decisionRepo.update(decisionId, { blockedAt: now } as any);
    return this.envelope(ctx, { resourceId: decisionId, status: 'blocked', safeMessage: safeMessage || 'Decision blocked', reasonCode: reasonCode || 'DECISION_BLOCKED' });
  }

  async voidDecision(ctx: RecoveryProgressCommandContext, decisionId: string, reasonCode: string, safeMessage: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.decisionRepo.getById(decisionId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Decision not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.decisionStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.decisionRepo.updateStatus(decisionId, 'void', now);
    await this.decisionRepo.update(decisionId, { voidedAt: now } as any);
    return this.envelope(ctx, { resourceId: decisionId, status: 'void', safeMessage: safeMessage || 'Decision voided', reasonCode: reasonCode || 'DECISION_VOIDED' });
  }
}

import { randomUUID } from 'crypto';
import type { RecoveryProgressCommandContext, RecoveryProgressSafeEnvelope, RecoveryPlanAdjustmentDraft } from '../contracts/recoveryProgressContracts';
import type { CreatePlanAdjustmentDraftRequest, UpdatePlanAdjustmentDraftRequest } from '../contracts/recoveryPlanAdjustmentDraftContracts';
import { RecoveryProgressPolicyEnforcer } from '../policies/recoveryProgressPolicyDefinitions';
import { RecoveryProgressSafetyService } from './recoveryProgressSafetyService';
import { RecoveryProgressIdempotencyService } from './recoveryProgressIdempotencyService';
import { RecoveryProgressAuditBridge } from './recoveryProgressAuditBridge';

export interface PlanAdjustmentDraftRepository {
  create(data: RecoveryPlanAdjustmentDraft): Promise<RecoveryPlanAdjustmentDraft>;
  getById(id: string): Promise<RecoveryPlanAdjustmentDraft | null>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryPlanAdjustmentDraft[]>;
  listByObservationId(observationId: string): Promise<RecoveryPlanAdjustmentDraft[]>;
  listByEvaluationId(evaluationId: string): Promise<RecoveryPlanAdjustmentDraft[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryPlanAdjustmentDraft[]>;
  update(id: string, data: Partial<RecoveryPlanAdjustmentDraft>): Promise<RecoveryPlanAdjustmentDraft>;
  updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryPlanAdjustmentDraft>;
}

export class RecoveryPlanAdjustmentDraftService {
  private policyEnforcer = new RecoveryProgressPolicyEnforcer();

  constructor(
    private adjustmentRepo: PlanAdjustmentDraftRepository,
    private safetyService: RecoveryProgressSafetyService,
    private auditBridge: RecoveryProgressAuditBridge,
    private idempotencyService: RecoveryProgressIdempotencyService,
  ) {}

  private envelope(ctx: RecoveryProgressCommandContext, overrides: Partial<RecoveryProgressSafeEnvelope>): RecoveryProgressSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createAdjustmentDraft(ctx: RecoveryProgressCommandContext, input: CreatePlanAdjustmentDraftRequest): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RECOVERY_PLAN_ADJUSTMENT_DRAFT_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });

    const safetyCheck = this.safetyService.assertObservationUsesReferencesOnly(input as unknown as Record<string, unknown>);
    if (!safetyCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: safetyCheck.safeMessage, reasonCode: safetyCheck.reasonCode, status: 'blocked' });

    const idempotencyKey = ctx.idempotencyKey || randomUUID();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createAdjustmentDraft', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const now = new Date().toISOString();
    const record: RecoveryPlanAdjustmentDraft = {
      recoveryPlanAdjustmentDraftId: randomUUID(),
      schoolId: ctx.schoolId,
      studentRef: input.studentRef,
      resultRecoveryPlanId: input.resultRecoveryPlanId,
      recoveryCheckpointEvaluationId: input.recoveryCheckpointEvaluationId,
      recoveryProgressObservationId: input.recoveryProgressObservationId,
      adjustmentStatus: 'draft',
      adjustmentType: input.adjustmentType as any,
      safeAdjustmentSummary: input.safeAdjustmentSummary,
      proposedChangesJson: (input.proposedChangesJson || {}) as Record<string, unknown>,
      reasonCodesJson: (input.reasonCodesJson || {}) as Record<string, unknown>,
      teacherReviewNotesJson: (input.teacherReviewNotesJson || {}) as Record<string, unknown>,
      blockedReasonCodesJson: input.blockedReasonCodesJson || [],
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
      createdAt: now,
      updatedAt: now,
      reviewReadyAt: undefined,
      approvedForFutureUseAt: undefined,
      suppressedAt: undefined,
      blockedAt: undefined,
      voidedAt: undefined,
    };
    const created = await this.adjustmentRepo.create(record);
    await this.idempotencyService.startOperation(ctx.schoolId, 'createAdjustmentDraft', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createAdjustmentDraft', idempotencyKey, 'RecoveryPlanAdjustmentDraft', created.recoveryPlanAdjustmentDraftId, 'Adjustment draft created');
    await this.auditBridge.recordPlanAdjustmentDraftCreated(ctx.schoolId, created.recoveryPlanAdjustmentDraftId, ctx.actorId, ctx.actorRole, ctx.requestId, ctx.correlationId);
    return this.envelope(ctx, { resourceId: created.recoveryPlanAdjustmentDraftId, status: created.adjustmentStatus, safeMessage: 'Plan adjustment draft created', reasonCode: 'ADJUSTMENT_DRAFT_CREATED', data: created });
  }

  async getAdjustmentDraft(ctx: RecoveryProgressCommandContext, draftId: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.adjustmentRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Adjustment draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: draftId, status: record.adjustmentStatus, safeMessage: 'Adjustment draft found', data: record });
  }

  async listAdjustmentDraftsForPlan(ctx: RecoveryProgressCommandContext, planId: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.adjustmentRepo.listByPlanId(ctx.schoolId, planId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} adjustment drafts for plan`, data: records });
  }

  async listAdjustmentDraftsForObservation(ctx: RecoveryProgressCommandContext, observationId: string): Promise<RecoveryProgressSafeEnvelope> {
    const records = await this.adjustmentRepo.listByObservationId(observationId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} adjustment drafts for observation`, data: records });
  }

  async listAdjustmentDraftsForEvaluation(ctx: RecoveryProgressCommandContext, evaluationId: string): Promise<RecoveryProgressSafeEnvelope> {
    const records = await this.adjustmentRepo.listByEvaluationId(evaluationId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} adjustment drafts for evaluation`, data: records });
  }

  async listAdjustmentDraftsForStudent(ctx: RecoveryProgressCommandContext, studentRef: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.adjustmentRepo.listByStudentRef(ctx.schoolId, studentRef);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} adjustment drafts for student`, data: records });
  }

  async markAdjustmentDraftReviewReady(ctx: RecoveryProgressCommandContext, draftId: string, reasonCode: string, safeMessage: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RECOVERY_PLAN_ADJUSTMENT_DRAFT_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.adjustmentRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Adjustment draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.adjustmentStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot review voided adjustment draft', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.adjustmentRepo.updateStatus(draftId, 'review_ready', now);
    await this.adjustmentRepo.update(draftId, { reviewReadyAt: now } as any);
    await this.auditBridge.recordPlanAdjustmentDraftReviewReady(ctx.schoolId, draftId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: draftId, status: 'review_ready', safeMessage: safeMessage || 'Adjustment draft review ready', reasonCode: reasonCode || 'ADJUSTMENT_DRAFT_REVIEW_READY' });
  }

  async suppressAdjustmentDraft(ctx: RecoveryProgressCommandContext, draftId: string, reasonCode: string, safeMessage: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.adjustmentRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Adjustment draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.adjustmentStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot suppress voided adjustment draft', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.adjustmentRepo.updateStatus(draftId, 'suppressed', now);
    await this.adjustmentRepo.update(draftId, { suppressedAt: now } as any);
    return this.envelope(ctx, { resourceId: draftId, status: 'suppressed', safeMessage: safeMessage || 'Adjustment draft suppressed', reasonCode: reasonCode || 'ADJUSTMENT_DRAFT_SUPPRESSED' });
  }

  async blockAdjustmentDraft(ctx: RecoveryProgressCommandContext, draftId: string, reasonCode: string, safeMessage: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.adjustmentRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Adjustment draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.adjustmentStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided adjustment draft', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.adjustmentRepo.updateStatus(draftId, 'blocked', now);
    await this.adjustmentRepo.update(draftId, { blockedAt: now } as any);
    return this.envelope(ctx, { resourceId: draftId, status: 'blocked', safeMessage: safeMessage || 'Adjustment draft blocked', reasonCode: reasonCode || 'ADJUSTMENT_DRAFT_BLOCKED' });
  }

  async voidAdjustmentDraft(ctx: RecoveryProgressCommandContext, draftId: string, reasonCode: string, safeMessage: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.adjustmentRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Adjustment draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.adjustmentStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.adjustmentRepo.updateStatus(draftId, 'void', now);
    await this.adjustmentRepo.update(draftId, { voidedAt: now } as any);
    return this.envelope(ctx, { resourceId: draftId, status: 'void', safeMessage: safeMessage || 'Adjustment draft voided', reasonCode: reasonCode || 'ADJUSTMENT_DRAFT_VOIDED' });
  }
}

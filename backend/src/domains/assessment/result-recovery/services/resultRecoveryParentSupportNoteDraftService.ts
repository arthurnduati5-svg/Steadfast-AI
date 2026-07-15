import { randomUUID } from 'crypto';
import type { ResultRecoveryCommandContext, ResultRecoverySafeEnvelope } from '../contracts/resultRecoveryContracts';
import { ResultRecoveryPolicyEnforcer } from '../policies/resultRecoveryPolicyDefinitions';
import { ResultRecoverySafetyService } from './resultRecoverySafetyService';
import { ResultRecoveryIdempotencyService } from './resultRecoveryIdempotencyService';
import { ResultRecoveryAuditBridge } from './resultRecoveryAuditBridge';

export interface ParentSupportNoteDraftInput {
  resultRecoveryPlanId: string;
  studentRef: string;
  safeParentNoteSummary: string;
  parentRef?: string;
  guidanceJson?: Record<string, unknown>;
}

export interface ParentSupportNoteDraft {
  resultRecoveryParentSupportNoteDraftId: string;
  schoolId: string;
  resultRecoveryPlanId: string;
  studentRef: string;
  parentRef: string | null;
  draftStatus: string;
  safeParentNoteSummary: string;
  guidanceJson: Record<string, unknown> | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  reviewReadyAt: string | null;
  approvedForFutureUseAt: string | null;
  suppressedAt: string | null;
  blockedAt: string | null;
  voidedAt: string | null;
}

export interface ParentSupportNoteDraftPreview {
  resultRecoveryParentSupportNoteDraftId: string;
  resultRecoveryPlanId: string;
  studentRef: string;
  draftStatus: string;
  safeParentNoteSummary: string;
  createdAt: string;
}

export interface ParentSupportNoteDraftRepository {
  create(input: ParentSupportNoteDraftInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ParentSupportNoteDraft>;
  getById(draftId: string): Promise<ParentSupportNoteDraft | null>;
  listByPlanId(planId: string): Promise<ParentSupportNoteDraftPreview[]>;
  update(draftId: string, data: Partial<ParentSupportNoteDraft>): Promise<ParentSupportNoteDraft>;
  updateStatus(draftId: string, draftStatus: string, reasonCode: string, safeMessage: string): Promise<ParentSupportNoteDraft>;
  markReviewReady(draftId: string): Promise<ParentSupportNoteDraft>;
  approveForFutureUse(draftId: string): Promise<ParentSupportNoteDraft>;
  suppress(draftId: string, reasonCode: string, safeMessage: string): Promise<ParentSupportNoteDraft>;
  block(draftId: string, reasonCode: string, safeMessage: string): Promise<ParentSupportNoteDraft>;
  void(draftId: string, reasonCode: string, safeMessage: string): Promise<ParentSupportNoteDraft>;
}

export class ResultRecoveryParentSupportNoteDraftService {
  private policyEnforcer = new ResultRecoveryPolicyEnforcer();

  constructor(
    private parentSupportRepo: ParentSupportNoteDraftRepository,
    private safetyService: ResultRecoverySafetyService,
    private auditBridge: ResultRecoveryAuditBridge,
    private idempotencyService: ResultRecoveryIdempotencyService,
  ) {}

  private envelope(ctx: ResultRecoveryCommandContext, overrides: Partial<ResultRecoverySafeEnvelope>): ResultRecoverySafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createParentSupportNoteDraft(ctx: ResultRecoveryCommandContext, input: ParentSupportNoteDraftInput): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RESULT_RECOVERY_PARENT_SUPPORT_NOTE_DRAFT_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });

    const safetyCheck = this.safetyService.assertParentSupportNoteSafe(input as unknown as Record<string, unknown>);
    if (!safetyCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: safetyCheck.safeMessage, reasonCode: safetyCheck.reasonCode, status: 'blocked' });

    const idempotencyKey = ctx.idempotencyKey || randomUUID();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createParentSupportNoteDraft', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const createInput: ParentSupportNoteDraftInput & { schoolId: string; createdByActorId: string; createdByRole: string } = {
      ...input,
      schoolId: ctx.schoolId,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    };
    const record = await this.parentSupportRepo.create(createInput);
    await this.idempotencyService.startOperation(ctx.schoolId, 'createParentSupportNoteDraft', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createParentSupportNoteDraft', idempotencyKey, 'ParentSupportNoteDraft', record.resultRecoveryParentSupportNoteDraftId, 'Parent support note draft created');
    await this.auditBridge.recordParentSupportNoteDraftCreated(ctx.schoolId, record.resultRecoveryPlanId, record.resultRecoveryParentSupportNoteDraftId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: record.resultRecoveryParentSupportNoteDraftId, status: record.draftStatus, safeMessage: 'Parent support note draft created', reasonCode: 'PARENT_SUPPORT_CREATED', data: record });
  }

  async getParentSupportNoteDraft(ctx: ResultRecoveryCommandContext, draftId: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.parentSupportRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Parent support note draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: draftId, status: record.draftStatus, safeMessage: 'Parent support note draft found', data: record });
  }

  async listParentSupportNoteDraftsForPlan(ctx: ResultRecoveryCommandContext, planId: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.parentSupportRepo.listByPlanId(planId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} parent support note drafts for plan`, data: records });
  }

  async markParentSupportNoteReviewReady(ctx: ResultRecoveryCommandContext, draftId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RESULT_RECOVERY_PARENT_SUPPORT_NOTE_DRAFT_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.parentSupportRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Parent support note draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot review voided parent support note draft', reasonCode: 'INVALID_STATUS', status: 'error' });

    const idempotencyKey = ctx.idempotencyKey || randomUUID();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'markParentSupportNoteReviewReady', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    await this.parentSupportRepo.markReviewReady(draftId);
    await this.idempotencyService.startOperation(ctx.schoolId, 'markParentSupportNoteReviewReady', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'markParentSupportNoteReviewReady', idempotencyKey, 'ParentSupportNoteDraft', draftId, 'Parent support note draft review ready');
    return this.envelope(ctx, { resourceId: draftId, status: 'review_ready', safeMessage: safeMessage || 'Parent support note draft review ready', reasonCode: reasonCode || 'PARENT_SUPPORT_REVIEW_READY' });
  }

  async approveParentSupportNoteForFutureUse(ctx: ResultRecoveryCommandContext, draftId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RESULT_RECOVERY_PARENT_SUPPORT_NOTE_DRAFT_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.parentSupportRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Parent support note draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot approve voided parent support note draft', reasonCode: 'INVALID_STATUS', status: 'error' });

    const idempotencyKey = ctx.idempotencyKey || randomUUID();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'approveParentSupportNoteForFutureUse', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    await this.parentSupportRepo.approveForFutureUse(draftId);
    await this.idempotencyService.startOperation(ctx.schoolId, 'approveParentSupportNoteForFutureUse', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'approveParentSupportNoteForFutureUse', idempotencyKey, 'ParentSupportNoteDraft', draftId, 'Parent support note draft approved');
    await this.auditBridge.recordParentSupportNoteApprovedForFutureUse(ctx.schoolId, record.resultRecoveryPlanId, draftId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: draftId, status: 'approved_for_future_use', safeMessage: safeMessage || 'Parent support note approved for future use', reasonCode: reasonCode || 'PARENT_SUPPORT_APPROVED' });
  }

  async suppressParentSupportNoteDraft(ctx: ResultRecoveryCommandContext, draftId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.parentSupportRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Parent support note draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot suppress voided parent support note draft', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.parentSupportRepo.suppress(draftId, reasonCode || 'SUPPRESSED', safeMessage || 'Parent support note draft suppressed');
    return this.envelope(ctx, { resourceId: draftId, status: 'suppressed', safeMessage: safeMessage || 'Parent support note draft suppressed', reasonCode: reasonCode || 'PARENT_SUPPORT_SUPPRESSED' });
  }

  async blockParentSupportNoteDraft(ctx: ResultRecoveryCommandContext, draftId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.parentSupportRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Parent support note draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided parent support note draft', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.parentSupportRepo.block(draftId, reasonCode || 'BLOCKED', safeMessage || 'Parent support note draft blocked');
    return this.envelope(ctx, { resourceId: draftId, status: 'blocked', safeMessage: safeMessage || 'Parent support note draft blocked', reasonCode: reasonCode || 'PARENT_SUPPORT_BLOCKED' });
  }

  async voidParentSupportNoteDraft(ctx: ResultRecoveryCommandContext, draftId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.parentSupportRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Parent support note draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.parentSupportRepo.void(draftId, reasonCode || 'VOIDED', safeMessage || 'Parent support note draft voided');
    return this.envelope(ctx, { resourceId: draftId, status: 'void', safeMessage: safeMessage || 'Parent support note draft voided', reasonCode: reasonCode || 'PARENT_SUPPORT_VOIDED' });
  }
}

import { randomUUID } from 'crypto';
import type { ResultRecoveryCommandContext, ResultRecoverySafeEnvelope } from '../contracts/resultRecoveryContracts';
import { ResultRecoveryPolicyEnforcer } from '../policies/resultRecoveryPolicyDefinitions';
import { ResultRecoverySafetyService } from './resultRecoverySafetyService';
import { ResultRecoveryIdempotencyService } from './resultRecoveryIdempotencyService';
import { ResultRecoveryAuditBridge } from './resultRecoveryAuditBridge';

export interface PracticeDraftInput {
  resultRecoveryPlanId: string;
  resultRecoveryObjectiveId?: string;
  resultRecoveryStepId?: string;
  studentRef: string;
  safePracticeDraftSummary: string;
  approvedContentRefsJson?: Record<string, unknown>;
  successCriteriaJson?: Record<string, unknown>;
}

export interface PracticeDraft {
  resultRecoveryPracticeDraftId: string;
  schoolId: string;
  resultRecoveryPlanId: string;
  resultRecoveryObjectiveId: string | null;
  resultRecoveryStepId: string | null;
  studentRef: string;
  draftStatus: string;
  safePracticeDraftSummary: string;
  approvedContentRefsJson: Record<string, unknown> | null;
  successCriteriaJson: Record<string, unknown> | null;
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

export interface PracticeDraftPreview {
  resultRecoveryPracticeDraftId: string;
  resultRecoveryPlanId: string;
  studentRef: string;
  draftStatus: string;
  safePracticeDraftSummary: string;
  createdAt: string;
}

export interface PracticeDraftRepository {
  create(input: PracticeDraftInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<PracticeDraft>;
  getById(draftId: string): Promise<PracticeDraft | null>;
  listByPlanId(planId: string): Promise<PracticeDraftPreview[]>;
  listByObjectiveId(objectiveId: string): Promise<PracticeDraftPreview[]>;
  listByStepId(stepId: string): Promise<PracticeDraftPreview[]>;
  update(draftId: string, data: Partial<PracticeDraft>): Promise<PracticeDraft>;
  updateStatus(draftId: string, draftStatus: string, reasonCode: string, safeMessage: string): Promise<PracticeDraft>;
  markReviewReady(draftId: string): Promise<PracticeDraft>;
  approveForFutureUse(draftId: string): Promise<PracticeDraft>;
  suppress(draftId: string, reasonCode: string, safeMessage: string): Promise<PracticeDraft>;
  block(draftId: string, reasonCode: string, safeMessage: string): Promise<PracticeDraft>;
  void(draftId: string, reasonCode: string, safeMessage: string): Promise<PracticeDraft>;
}

export class ResultRecoveryPracticeDraftService {
  private policyEnforcer = new ResultRecoveryPolicyEnforcer();

  constructor(
    private practiceDraftRepo: PracticeDraftRepository,
    private safetyService: ResultRecoverySafetyService,
    private auditBridge: ResultRecoveryAuditBridge,
    private idempotencyService: ResultRecoveryIdempotencyService,
  ) {}

  private envelope(ctx: ResultRecoveryCommandContext, overrides: Partial<ResultRecoverySafeEnvelope>): ResultRecoverySafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createPracticeDraft(ctx: ResultRecoveryCommandContext, input: PracticeDraftInput): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RESULT_RECOVERY_PRACTICE_DRAFT_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });

    const safetyCheck = this.safetyService.assertPracticeDraftUsesReferencesOnly(input as unknown as Record<string, unknown>);
    if (!safetyCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: safetyCheck.safeMessage, reasonCode: safetyCheck.reasonCode, status: 'blocked' });

    const idempotencyKey = ctx.idempotencyKey || randomUUID();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createPracticeDraft', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const createInput: PracticeDraftInput & { schoolId: string; createdByActorId: string; createdByRole: string } = {
      ...input,
      schoolId: ctx.schoolId,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    };
    const record = await this.practiceDraftRepo.create(createInput);
    await this.idempotencyService.startOperation(ctx.schoolId, 'createPracticeDraft', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createPracticeDraft', idempotencyKey, 'PracticeDraft', record.resultRecoveryPracticeDraftId, 'Practice draft created');
    await this.auditBridge.recordPracticeDraftCreated(ctx.schoolId, record.resultRecoveryPlanId, record.resultRecoveryPracticeDraftId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: record.resultRecoveryPracticeDraftId, status: record.draftStatus, safeMessage: 'Practice draft created', reasonCode: 'PRACTICE_DRAFT_CREATED', data: record });
  }

  async getPracticeDraft(ctx: ResultRecoveryCommandContext, draftId: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.practiceDraftRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Practice draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: draftId, status: record.draftStatus, safeMessage: 'Practice draft found', data: record });
  }

  async listPracticeDraftsForPlan(ctx: ResultRecoveryCommandContext, planId: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.practiceDraftRepo.listByPlanId(planId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} practice drafts for plan`, data: records });
  }

  async listPracticeDraftsForObjective(ctx: ResultRecoveryCommandContext, objectiveId: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.practiceDraftRepo.listByObjectiveId(objectiveId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} practice drafts for objective`, data: records });
  }

  async listPracticeDraftsForStep(ctx: ResultRecoveryCommandContext, stepId: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.practiceDraftRepo.listByStepId(stepId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} practice drafts for step`, data: records });
  }

  async markPracticeDraftReviewReady(ctx: ResultRecoveryCommandContext, draftId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RESULT_RECOVERY_PRACTICE_DRAFT_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.practiceDraftRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Practice draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot review voided practice draft', reasonCode: 'INVALID_STATUS', status: 'error' });

    const idempotencyKey = ctx.idempotencyKey || randomUUID();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'markPracticeDraftReviewReady', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    await this.practiceDraftRepo.markReviewReady(draftId);
    await this.idempotencyService.startOperation(ctx.schoolId, 'markPracticeDraftReviewReady', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'markPracticeDraftReviewReady', idempotencyKey, 'PracticeDraft', draftId, 'Practice draft review ready');
    return this.envelope(ctx, { resourceId: draftId, status: 'review_ready', safeMessage: safeMessage || 'Practice draft review ready', reasonCode: reasonCode || 'PRACTICE_DRAFT_REVIEW_READY' });
  }

  async approvePracticeDraftForFutureUse(ctx: ResultRecoveryCommandContext, draftId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RESULT_RECOVERY_PRACTICE_DRAFT_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.practiceDraftRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Practice draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot approve voided practice draft', reasonCode: 'INVALID_STATUS', status: 'error' });

    const idempotencyKey = ctx.idempotencyKey || randomUUID();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'approvePracticeDraftForFutureUse', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    await this.practiceDraftRepo.approveForFutureUse(draftId);
    await this.idempotencyService.startOperation(ctx.schoolId, 'approvePracticeDraftForFutureUse', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'approvePracticeDraftForFutureUse', idempotencyKey, 'PracticeDraft', draftId, 'Practice draft approved');
    await this.auditBridge.recordPracticeDraftApprovedForFutureUse(ctx.schoolId, record.resultRecoveryPlanId, draftId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: draftId, status: 'approved_for_future_use', safeMessage: safeMessage || 'Practice draft approved for future use', reasonCode: reasonCode || 'PRACTICE_DRAFT_APPROVED' });
  }

  async suppressPracticeDraft(ctx: ResultRecoveryCommandContext, draftId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.practiceDraftRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Practice draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot suppress voided practice draft', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.practiceDraftRepo.suppress(draftId, reasonCode || 'SUPPRESSED', safeMessage || 'Practice draft suppressed');
    return this.envelope(ctx, { resourceId: draftId, status: 'suppressed', safeMessage: safeMessage || 'Practice draft suppressed', reasonCode: reasonCode || 'PRACTICE_DRAFT_SUPPRESSED' });
  }

  async blockPracticeDraft(ctx: ResultRecoveryCommandContext, draftId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.practiceDraftRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Practice draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided practice draft', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.practiceDraftRepo.block(draftId, reasonCode || 'BLOCKED', safeMessage || 'Practice draft blocked');
    return this.envelope(ctx, { resourceId: draftId, status: 'blocked', safeMessage: safeMessage || 'Practice draft blocked', reasonCode: reasonCode || 'PRACTICE_DRAFT_BLOCKED' });
  }

  async voidPracticeDraft(ctx: ResultRecoveryCommandContext, draftId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.practiceDraftRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Practice draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.practiceDraftRepo.void(draftId, reasonCode || 'VOIDED', safeMessage || 'Practice draft voided');
    return this.envelope(ctx, { resourceId: draftId, status: 'void', safeMessage: safeMessage || 'Practice draft voided', reasonCode: reasonCode || 'PRACTICE_DRAFT_VOIDED' });
  }
}

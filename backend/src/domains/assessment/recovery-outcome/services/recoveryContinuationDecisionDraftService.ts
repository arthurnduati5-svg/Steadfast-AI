import { randomUUID } from 'crypto';
import type { RecoveryOutcomeCommandContext, RecoveryOutcomeSafeEnvelope } from '../contracts/recoveryOutcomeContracts';
import type { RecoveryContinuationDecisionDraft } from '../contracts/recoveryDecisionDraftContracts';
import { RecoveryOutcomePolicyEnforcer } from '../policies/recoveryOutcomePolicyDefinitions';
import { RecoveryOutcomeSafetyService } from './recoveryOutcomeSafetyService';
import { RecoveryOutcomeIdempotencyService } from './recoveryOutcomeIdempotencyService';
import { RecoveryOutcomeAuditBridge } from './recoveryOutcomeAuditBridge';

export interface ContinuationDecisionDraftRepository {
  create(data: RecoveryContinuationDecisionDraft): Promise<RecoveryContinuationDecisionDraft>;
  getById(id: string): Promise<RecoveryContinuationDecisionDraft | null>;
  listBySchool(schoolId: string): Promise<RecoveryContinuationDecisionDraft[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryContinuationDecisionDraft[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryContinuationDecisionDraft[]>;
  listByStatus(schoolId: string, status: string): Promise<RecoveryContinuationDecisionDraft[]>;
  update(id: string, data: Partial<RecoveryContinuationDecisionDraft>): Promise<RecoveryContinuationDecisionDraft>;
  updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryContinuationDecisionDraft>;
}

export class RecoveryContinuationDecisionDraftService {
  private policyEnforcer = new RecoveryOutcomePolicyEnforcer();

  constructor(
    private draftRepo: ContinuationDecisionDraftRepository,
    private safetyService: RecoveryOutcomeSafetyService,
    private auditBridge: RecoveryOutcomeAuditBridge,
    private idempotencyService: RecoveryOutcomeIdempotencyService,
  ) {}

  private envelope(ctx: RecoveryOutcomeCommandContext, overrides: Partial<RecoveryOutcomeSafeEnvelope>): RecoveryOutcomeSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createContinuationDecisionDraft(ctx: RecoveryOutcomeCommandContext, input: {
    schoolId: string;
    studentRef: string;
    resultRecoveryPlanId: string;
    recoveryProgressSummaryId?: string;
    recoveryEvidenceRollupId?: string;
    safeDecisionSummary: string;
    rationaleJson: Record<string, unknown>;
    sourceRefsJson: Record<string, unknown>;
  }): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RECOVERY_CONTINUATION_DRAFT_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });

    const schoolCheck = this.safetyService.assertSchoolContext(input.schoolId);
    if (!schoolCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: schoolCheck.safeMessage, reasonCode: schoolCheck.reasonCode, status: 'blocked' });

    const leakageCheck = this.safetyService.checkAllLeakageCategories(input.safeDecisionSummary, input.sourceRefsJson);
    if (!leakageCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: leakageCheck.safeMessage, reasonCode: leakageCheck.reasonCode, status: 'blocked' });

    const idempotencyKey = ctx.idempotencyKey || randomUUID();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createContinuationDecisionDraft', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const now = new Date().toISOString();
    const record: RecoveryContinuationDecisionDraft = {
      recoveryContinuationDecisionDraftId: randomUUID(),
      schoolId: ctx.schoolId,
      studentRef: input.studentRef,
      resultRecoveryPlanId: input.resultRecoveryPlanId,
      recoveryProgressSummaryId: input.recoveryProgressSummaryId,
      recoveryEvidenceRollupId: input.recoveryEvidenceRollupId,
      draftStatus: 'draft',
      safeDecisionSummary: input.safeDecisionSummary,
      rationaleJson: input.rationaleJson,
      blockedReasonCodesJson: [],
      sourceRefsJson: input.sourceRefsJson,
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
    const created = await this.draftRepo.create(record);
    await this.idempotencyService.startOperation(ctx.schoolId, 'createContinuationDecisionDraft', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createContinuationDecisionDraft', idempotencyKey, 'RecoveryContinuationDecisionDraft', created.recoveryContinuationDecisionDraftId, 'Continuation decision draft created');
    await this.auditBridge.recordContinuationDecisionDraftCreated(ctx.schoolId, created.recoveryContinuationDecisionDraftId, ctx.actorId, ctx.actorRole, ctx.requestId, ctx.correlationId);
    return this.envelope(ctx, { resourceId: created.recoveryContinuationDecisionDraftId, status: created.draftStatus, safeMessage: 'Continuation decision draft created', reasonCode: 'CONTINUATION_DRAFT_CREATED', data: created });
  }

  async getDecisionDraft(ctx: RecoveryOutcomeCommandContext, draftId: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.draftRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Continuation decision draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: draftId, status: record.draftStatus, safeMessage: 'Continuation decision draft found', data: record });
  }

  async listDecisionDraftsForSchool(ctx: RecoveryOutcomeCommandContext): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.draftRepo.listBySchool(ctx.schoolId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} continuation decision drafts for school`, data: records });
  }

  async listDecisionDraftsForPlan(ctx: RecoveryOutcomeCommandContext, planId: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.draftRepo.listByPlanId(ctx.schoolId, planId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} continuation decision drafts for plan`, data: records });
  }

  async listDecisionDraftsForStudent(ctx: RecoveryOutcomeCommandContext, studentRef: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.draftRepo.listByStudentRef(ctx.schoolId, studentRef);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} continuation decision drafts for student`, data: records });
  }

  async listDecisionDraftsByStatus(ctx: RecoveryOutcomeCommandContext, status: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.draftRepo.listByStatus(ctx.schoolId, status);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} continuation decision drafts with status ${status}`, data: records });
  }

  async markDecisionDraftReviewReady(ctx: RecoveryOutcomeCommandContext, draftId: string, reasonCode?: string, safeMessage?: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RECOVERY_CONTINUATION_DRAFT_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.draftRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot review voided draft', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.draftRepo.updateStatus(draftId, 'review_ready', now);
    await this.draftRepo.update(draftId, { reviewReadyAt: now } as any);
    await this.auditBridge.recordContinuationDecisionDraftReviewReady(ctx.schoolId, draftId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: draftId, status: 'review_ready', safeMessage: safeMessage || 'Continuation decision draft review ready', reasonCode: reasonCode || 'CONTINUATION_DRAFT_REVIEW_READY' });
  }

  async approveDecisionDraftForFutureUse(ctx: RecoveryOutcomeCommandContext, draftId: string, reasonCode?: string, safeMessage?: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RECOVERY_CONTINUATION_DRAFT_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.draftRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot approve voided draft', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.draftRepo.updateStatus(draftId, 'approved_for_future_use', now);
    await this.draftRepo.update(draftId, { approvedForFutureUseAt: now } as any);
    await this.auditBridge.recordContinuationDecisionDraftApprovedForFutureUse(ctx.schoolId, draftId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: draftId, status: 'approved_for_future_use', safeMessage: safeMessage || 'Continuation decision draft approved', reasonCode: reasonCode || 'CONTINUATION_DRAFT_APPROVED' });
  }

  async suppressDecisionDraft(ctx: RecoveryOutcomeCommandContext, draftId: string, reasonCode?: string, safeMessage?: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.draftRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot suppress voided draft', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.draftRepo.updateStatus(draftId, 'suppressed', now);
    await this.draftRepo.update(draftId, { suppressedAt: now } as any);
    return this.envelope(ctx, { resourceId: draftId, status: 'suppressed', safeMessage: safeMessage || 'Continuation decision draft suppressed', reasonCode: reasonCode || 'CONTINUATION_DRAFT_SUPPRESSED' });
  }

  async blockDecisionDraft(ctx: RecoveryOutcomeCommandContext, draftId: string, reasonCode?: string, safeMessage?: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.draftRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided draft', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.draftRepo.updateStatus(draftId, 'blocked', now);
    await this.draftRepo.update(draftId, { blockedAt: now, blockedReasonCodesJson: reasonCode ? [reasonCode] : [] } as any);
    return this.envelope(ctx, { resourceId: draftId, status: 'blocked', safeMessage: safeMessage || 'Continuation decision draft blocked', reasonCode: reasonCode || 'CONTINUATION_DRAFT_BLOCKED' });
  }

  async voidDecisionDraft(ctx: RecoveryOutcomeCommandContext, draftId: string, reasonCode?: string, safeMessage?: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.draftRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.draftRepo.updateStatus(draftId, 'void', now);
    await this.draftRepo.update(draftId, { voidedAt: now } as any);
    return this.envelope(ctx, { resourceId: draftId, status: 'void', safeMessage: safeMessage || 'Continuation decision draft voided', reasonCode: reasonCode || 'CONTINUATION_DRAFT_VOIDED' });
  }
}

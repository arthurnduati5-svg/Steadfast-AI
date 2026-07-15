import { randomUUID } from 'crypto';
import type { RecoveryOutcomeCommandContext, RecoveryOutcomeSafeEnvelope } from '../contracts/recoveryOutcomeContracts';
import type { RecoveryOutcomeParentUpdateDraft, RecoveryOutcomeParentUpdateDraftCreateRequest } from '../contracts/recoveryOutcomeParentUpdateDraftContracts';
import { RecoveryOutcomePolicyEnforcer } from '../policies/recoveryOutcomePolicyDefinitions';
import { RecoveryOutcomeSafetyService } from './recoveryOutcomeSafetyService';
import { RecoveryOutcomeIdempotencyService } from './recoveryOutcomeIdempotencyService';
import { RecoveryOutcomeAuditBridge } from './recoveryOutcomeAuditBridge';
import { FORBIDDEN_OUTCOME_FIELDS } from '../contracts/recoveryOutcomeContracts';

export interface ParentUpdateDraftRepository {
  create(data: RecoveryOutcomeParentUpdateDraft): Promise<RecoveryOutcomeParentUpdateDraft>;
  getById(id: string): Promise<RecoveryOutcomeParentUpdateDraft | null>;
  listBySchool(schoolId: string): Promise<RecoveryOutcomeParentUpdateDraft[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeParentUpdateDraft[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeParentUpdateDraft[]>;
  listByParentRef(schoolId: string, parentRef: string): Promise<RecoveryOutcomeParentUpdateDraft[]>;
  listByStatus(schoolId: string, status: string): Promise<RecoveryOutcomeParentUpdateDraft[]>;
  update(id: string, data: Partial<RecoveryOutcomeParentUpdateDraft>): Promise<RecoveryOutcomeParentUpdateDraft>;
  updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryOutcomeParentUpdateDraft>;
}

export class RecoveryOutcomeParentUpdateDraftService {
  private policyEnforcer = new RecoveryOutcomePolicyEnforcer();

  constructor(
    private draftRepo: ParentUpdateDraftRepository,
    private safetyService: RecoveryOutcomeSafetyService,
    private auditBridge: RecoveryOutcomeAuditBridge,
    private idempotencyService: RecoveryOutcomeIdempotencyService,
  ) {}

  private envelope(ctx: RecoveryOutcomeCommandContext, overrides: Partial<RecoveryOutcomeSafeEnvelope>): RecoveryOutcomeSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createParentUpdateDraft(ctx: RecoveryOutcomeCommandContext, input: RecoveryOutcomeParentUpdateDraftCreateRequest): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RECOVERY_OUTCOME_PARENT_UPDATE_DRAFT_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });

    const schoolCheck = this.safetyService.assertSchoolContext(input.schoolId);
    if (!schoolCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: schoolCheck.safeMessage, reasonCode: schoolCheck.reasonCode, status: 'blocked' });

    const leakageCheck = this.safetyService.checkAllLeakageCategories(input.safeUpdateSummary, input.sourceRefsJson);
    if (!leakageCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: leakageCheck.safeMessage, reasonCode: leakageCheck.reasonCode, status: 'blocked' });

    const idempotencyKey = ctx.idempotencyKey || randomUUID();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createParentUpdateDraft', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const now = new Date().toISOString();
    const blockedFields = [...FORBIDDEN_OUTCOME_FIELDS];
    const blockedFieldNames = input.allowedFieldNamesJson
      ? blockedFields.filter(f => !input.allowedFieldNamesJson!.includes(f))
      : blockedFields;

    const record: RecoveryOutcomeParentUpdateDraft = {
      recoveryOutcomeParentUpdateDraftId: randomUUID(),
      schoolId: ctx.schoolId,
      studentRef: input.studentRef,
      resultRecoveryPlanId: input.resultRecoveryPlanId,
      parentRef: input.parentRef,
      recoveryOutcomeDecisionSummaryId: input.recoveryOutcomeDecisionSummaryId,
      draftStatus: 'draft',
      safeUpdateSummary: input.safeUpdateSummary,
      updateBodyJson: input.updateBodyJson,
      allowedFieldNamesJson: input.allowedFieldNamesJson || [],
      blockedFieldNamesJson: blockedFieldNames,
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
    await this.idempotencyService.startOperation(ctx.schoolId, 'createParentUpdateDraft', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createParentUpdateDraft', idempotencyKey, 'RecoveryOutcomeParentUpdateDraft', created.recoveryOutcomeParentUpdateDraftId, 'Parent update draft created');
    await this.auditBridge.recordParentUpdateDraftCreated(ctx.schoolId, created.recoveryOutcomeParentUpdateDraftId, ctx.actorId, ctx.actorRole, ctx.requestId, ctx.correlationId);
    return this.envelope(ctx, { resourceId: created.recoveryOutcomeParentUpdateDraftId, status: created.draftStatus, safeMessage: 'Parent update draft created', reasonCode: 'PARENT_UPDATE_DRAFT_CREATED', data: created });
  }

  async getParentUpdateDraft(ctx: RecoveryOutcomeCommandContext, draftId: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.draftRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Parent update draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: draftId, status: record.draftStatus, safeMessage: 'Parent update draft found', data: record });
  }

  async listDraftsForSchool(ctx: RecoveryOutcomeCommandContext): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.draftRepo.listBySchool(ctx.schoolId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} parent update drafts for school`, data: records });
  }

  async listDraftsForStudent(ctx: RecoveryOutcomeCommandContext, studentRef: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.draftRepo.listByStudentRef(ctx.schoolId, studentRef);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} parent update drafts for student`, data: records });
  }

  async listDraftsForPlan(ctx: RecoveryOutcomeCommandContext, planId: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.draftRepo.listByPlanId(ctx.schoolId, planId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} parent update drafts for plan`, data: records });
  }

  async listDraftsByStatus(ctx: RecoveryOutcomeCommandContext, status: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.draftRepo.listByStatus(ctx.schoolId, status);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} parent update drafts with status ${status}`, data: records });
  }

  async listDraftsForParent(ctx: RecoveryOutcomeCommandContext, parentRef: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.draftRepo.listByParentRef(ctx.schoolId, parentRef);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} parent update drafts for parent`, data: records });
  }

  async markDraftReviewReady(ctx: RecoveryOutcomeCommandContext, draftId: string, reasonCode?: string, safeMessage?: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RECOVERY_OUTCOME_PARENT_UPDATE_DRAFT_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.draftRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot review voided draft', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.draftRepo.updateStatus(draftId, 'review_ready', now);
    await this.draftRepo.update(draftId, { reviewReadyAt: now } as any);
    await this.auditBridge.recordParentUpdateDraftReviewReady(ctx.schoolId, draftId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: draftId, status: 'review_ready', safeMessage: safeMessage || 'Parent update draft review ready', reasonCode: reasonCode || 'PARENT_UPDATE_DRAFT_REVIEW_READY' });
  }

  async approveDraftForFutureUse(ctx: RecoveryOutcomeCommandContext, draftId: string, reasonCode?: string, safeMessage?: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RECOVERY_OUTCOME_PARENT_UPDATE_DRAFT_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.draftRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot approve voided draft', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.draftRepo.updateStatus(draftId, 'approved_for_future_use', now);
    await this.draftRepo.update(draftId, { approvedForFutureUseAt: now } as any);
    await this.auditBridge.recordParentUpdateDraftApprovedForFutureUse(ctx.schoolId, draftId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: draftId, status: 'approved_for_future_use', safeMessage: safeMessage || 'Parent update draft approved', reasonCode: reasonCode || 'PARENT_UPDATE_DRAFT_APPROVED' });
  }

  async suppressDraft(ctx: RecoveryOutcomeCommandContext, draftId: string, reasonCode?: string, safeMessage?: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.draftRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot suppress voided draft', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.draftRepo.updateStatus(draftId, 'suppressed', now);
    await this.draftRepo.update(draftId, { suppressedAt: now } as any);
    return this.envelope(ctx, { resourceId: draftId, status: 'suppressed', safeMessage: safeMessage || 'Parent update draft suppressed', reasonCode: reasonCode || 'PARENT_UPDATE_DRAFT_SUPPRESSED' });
  }

  async blockDraft(ctx: RecoveryOutcomeCommandContext, draftId: string, reasonCode?: string, safeMessage?: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.draftRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided draft', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.draftRepo.updateStatus(draftId, 'blocked', now);
    await this.draftRepo.update(draftId, { blockedAt: now, blockedReasonCodesJson: reasonCode ? [reasonCode] : [] } as any);
    return this.envelope(ctx, { resourceId: draftId, status: 'blocked', safeMessage: safeMessage || 'Parent update draft blocked', reasonCode: reasonCode || 'PARENT_UPDATE_DRAFT_BLOCKED' });
  }

  async voidDraft(ctx: RecoveryOutcomeCommandContext, draftId: string, reasonCode?: string, safeMessage?: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.draftRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.draftRepo.updateStatus(draftId, 'void', now);
    await this.draftRepo.update(draftId, { voidedAt: now } as any);
    return this.envelope(ctx, { resourceId: draftId, status: 'void', safeMessage: safeMessage || 'Parent update draft voided', reasonCode: reasonCode || 'PARENT_UPDATE_DRAFT_VOIDED' });
  }
}

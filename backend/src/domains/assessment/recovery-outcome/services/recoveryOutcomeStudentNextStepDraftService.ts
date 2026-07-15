import { randomUUID } from 'crypto';
import type { RecoveryOutcomeCommandContext, RecoveryOutcomeSafeEnvelope } from '../contracts/recoveryOutcomeContracts';
import type { RecoveryOutcomeStudentNextStepDraft, RecoveryOutcomeStudentNextStepDraftCreateRequest } from '../contracts/recoveryOutcomeStudentNextStepDraftContracts';
import { RecoveryOutcomePolicyEnforcer } from '../policies/recoveryOutcomePolicyDefinitions';
import { RecoveryOutcomeSafetyService } from './recoveryOutcomeSafetyService';
import { RecoveryOutcomeIdempotencyService } from './recoveryOutcomeIdempotencyService';
import { RecoveryOutcomeAuditBridge } from './recoveryOutcomeAuditBridge';

export interface StudentNextStepDraftRepository {
  create(data: RecoveryOutcomeStudentNextStepDraft): Promise<RecoveryOutcomeStudentNextStepDraft>;
  getById(id: string): Promise<RecoveryOutcomeStudentNextStepDraft | null>;
  listBySchool(schoolId: string): Promise<RecoveryOutcomeStudentNextStepDraft[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeStudentNextStepDraft[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeStudentNextStepDraft[]>;
  listByStatus(schoolId: string, status: string): Promise<RecoveryOutcomeStudentNextStepDraft[]>;
  update(id: string, data: Partial<RecoveryOutcomeStudentNextStepDraft>): Promise<RecoveryOutcomeStudentNextStepDraft>;
  updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryOutcomeStudentNextStepDraft>;
}

export class RecoveryOutcomeStudentNextStepDraftService {
  private policyEnforcer = new RecoveryOutcomePolicyEnforcer();

  constructor(
    private draftRepo: StudentNextStepDraftRepository,
    private safetyService: RecoveryOutcomeSafetyService,
    private auditBridge: RecoveryOutcomeAuditBridge,
    private idempotencyService: RecoveryOutcomeIdempotencyService,
  ) {}

  private envelope(ctx: RecoveryOutcomeCommandContext, overrides: Partial<RecoveryOutcomeSafeEnvelope>): RecoveryOutcomeSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createStudentNextStepDraft(ctx: RecoveryOutcomeCommandContext, input: RecoveryOutcomeStudentNextStepDraftCreateRequest): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RECOVERY_OUTCOME_STUDENT_NEXT_STEP_DRAFT_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });

    const schoolCheck = this.safetyService.assertSchoolContext(input.schoolId);
    if (!schoolCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: schoolCheck.safeMessage, reasonCode: schoolCheck.reasonCode, status: 'blocked' });

    const leakageCheck = this.safetyService.checkAllLeakageCategories(input.safeNextStepSummary, input.sourceRefsJson);
    if (!leakageCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: leakageCheck.safeMessage, reasonCode: leakageCheck.reasonCode, status: 'blocked' });

    const idempotencyKey = ctx.idempotencyKey || randomUUID();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createStudentNextStepDraft', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const now = new Date().toISOString();
    const record: RecoveryOutcomeStudentNextStepDraft = {
      recoveryOutcomeStudentNextStepDraftId: randomUUID(),
      schoolId: ctx.schoolId,
      studentRef: input.studentRef,
      resultRecoveryPlanId: input.resultRecoveryPlanId,
      recoveryOutcomeDecisionSummaryId: input.recoveryOutcomeDecisionSummaryId,
      draftStatus: 'draft',
      safeNextStepSummary: input.safeNextStepSummary,
      socraticPromptJson: input.socraticPromptJson,
      allowedReflectionsJson: input.allowedReflectionsJson,
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
    await this.idempotencyService.startOperation(ctx.schoolId, 'createStudentNextStepDraft', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createStudentNextStepDraft', idempotencyKey, 'RecoveryOutcomeStudentNextStepDraft', created.recoveryOutcomeStudentNextStepDraftId, 'Student next-step draft created');
    await this.auditBridge.recordStudentNextStepDraftCreated(ctx.schoolId, created.recoveryOutcomeStudentNextStepDraftId, ctx.actorId, ctx.actorRole, ctx.requestId, ctx.correlationId);
    return this.envelope(ctx, { resourceId: created.recoveryOutcomeStudentNextStepDraftId, status: created.draftStatus, safeMessage: 'Student next-step draft created', reasonCode: 'STUDENT_NEXT_STEP_DRAFT_CREATED', data: created });
  }

  async getStudentNextStepDraft(ctx: RecoveryOutcomeCommandContext, draftId: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.draftRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Student next-step draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: draftId, status: record.draftStatus, safeMessage: 'Student next-step draft found', data: record });
  }

  async listDraftsForSchool(ctx: RecoveryOutcomeCommandContext): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.draftRepo.listBySchool(ctx.schoolId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} student next-step drafts for school`, data: records });
  }

  async listDraftsForStudent(ctx: RecoveryOutcomeCommandContext, studentRef: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.draftRepo.listByStudentRef(ctx.schoolId, studentRef);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} student next-step drafts for student`, data: records });
  }

  async listDraftsForPlan(ctx: RecoveryOutcomeCommandContext, planId: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.draftRepo.listByPlanId(ctx.schoolId, planId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} student next-step drafts for plan`, data: records });
  }

  async listDraftsByStatus(ctx: RecoveryOutcomeCommandContext, status: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.draftRepo.listByStatus(ctx.schoolId, status);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} student next-step drafts with status ${status}`, data: records });
  }

  async markDraftReviewReady(ctx: RecoveryOutcomeCommandContext, draftId: string, reasonCode?: string, safeMessage?: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RECOVERY_OUTCOME_STUDENT_NEXT_STEP_DRAFT_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.draftRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot review voided draft', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.draftRepo.updateStatus(draftId, 'review_ready', now);
    await this.draftRepo.update(draftId, { reviewReadyAt: now } as any);
    await this.auditBridge.recordStudentNextStepDraftReviewReady(ctx.schoolId, draftId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: draftId, status: 'review_ready', safeMessage: safeMessage || 'Student next-step draft review ready', reasonCode: reasonCode || 'STUDENT_NEXT_STEP_DRAFT_REVIEW_READY' });
  }

  async approveDraftForFutureUse(ctx: RecoveryOutcomeCommandContext, draftId: string, reasonCode?: string, safeMessage?: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RECOVERY_OUTCOME_STUDENT_NEXT_STEP_DRAFT_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.draftRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot approve voided draft', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.draftRepo.updateStatus(draftId, 'approved_for_future_use', now);
    await this.draftRepo.update(draftId, { approvedForFutureUseAt: now } as any);
    await this.auditBridge.recordStudentNextStepDraftApprovedForFutureUse(ctx.schoolId, draftId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: draftId, status: 'approved_for_future_use', safeMessage: safeMessage || 'Student next-step draft approved', reasonCode: reasonCode || 'STUDENT_NEXT_STEP_DRAFT_APPROVED' });
  }

  async suppressDraft(ctx: RecoveryOutcomeCommandContext, draftId: string, reasonCode?: string, safeMessage?: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.draftRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot suppress voided draft', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.draftRepo.updateStatus(draftId, 'suppressed', now);
    await this.draftRepo.update(draftId, { suppressedAt: now } as any);
    return this.envelope(ctx, { resourceId: draftId, status: 'suppressed', safeMessage: safeMessage || 'Student next-step draft suppressed', reasonCode: reasonCode || 'STUDENT_NEXT_STEP_DRAFT_SUPPRESSED' });
  }

  async blockDraft(ctx: RecoveryOutcomeCommandContext, draftId: string, reasonCode?: string, safeMessage?: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.draftRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided draft', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.draftRepo.updateStatus(draftId, 'blocked', now);
    await this.draftRepo.update(draftId, { blockedAt: now, blockedReasonCodesJson: reasonCode ? [reasonCode] : [] } as any);
    return this.envelope(ctx, { resourceId: draftId, status: 'blocked', safeMessage: safeMessage || 'Student next-step draft blocked', reasonCode: reasonCode || 'STUDENT_NEXT_STEP_DRAFT_BLOCKED' });
  }

  async voidDraft(ctx: RecoveryOutcomeCommandContext, draftId: string, reasonCode?: string, safeMessage?: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.draftRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.draftRepo.updateStatus(draftId, 'void', now);
    await this.draftRepo.update(draftId, { voidedAt: now } as any);
    return this.envelope(ctx, { resourceId: draftId, status: 'void', safeMessage: safeMessage || 'Student next-step draft voided', reasonCode: reasonCode || 'STUDENT_NEXT_STEP_DRAFT_VOIDED' });
  }
}

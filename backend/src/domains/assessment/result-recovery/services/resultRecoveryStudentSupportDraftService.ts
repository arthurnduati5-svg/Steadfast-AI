import { randomUUID } from 'crypto';
import type { ResultRecoveryCommandContext, ResultRecoverySafeEnvelope } from '../contracts/resultRecoveryContracts';
import { ResultRecoveryPolicyEnforcer } from '../policies/resultRecoveryPolicyDefinitions';
import { ResultRecoverySafetyService } from './resultRecoverySafetyService';
import { ResultRecoveryIdempotencyService } from './resultRecoveryIdempotencyService';
import { ResultRecoveryAuditBridge } from './resultRecoveryAuditBridge';

export interface StudentSupportDraftInput {
  resultRecoveryPlanId: string;
  studentRef: string;
  safeSupportDraftSummary: string;
  supportType?: string;
  guidanceJson?: Record<string, unknown>;
}

export interface StudentSupportDraft {
  resultRecoveryStudentSupportDraftId: string;
  schoolId: string;
  resultRecoveryPlanId: string;
  studentRef: string;
  draftStatus: string;
  supportType: string | null;
  safeSupportDraftSummary: string;
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

export interface StudentSupportDraftPreview {
  resultRecoveryStudentSupportDraftId: string;
  resultRecoveryPlanId: string;
  studentRef: string;
  draftStatus: string;
  safeSupportDraftSummary: string;
  createdAt: string;
}

export interface StudentSupportDraftRepository {
  create(input: StudentSupportDraftInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<StudentSupportDraft>;
  getById(draftId: string): Promise<StudentSupportDraft | null>;
  listByPlanId(planId: string): Promise<StudentSupportDraftPreview[]>;
  update(draftId: string, data: Partial<StudentSupportDraft>): Promise<StudentSupportDraft>;
  updateStatus(draftId: string, draftStatus: string, reasonCode: string, safeMessage: string): Promise<StudentSupportDraft>;
  markReviewReady(draftId: string): Promise<StudentSupportDraft>;
  approveForFutureUse(draftId: string): Promise<StudentSupportDraft>;
  suppress(draftId: string, reasonCode: string, safeMessage: string): Promise<StudentSupportDraft>;
  block(draftId: string, reasonCode: string, safeMessage: string): Promise<StudentSupportDraft>;
  void(draftId: string, reasonCode: string, safeMessage: string): Promise<StudentSupportDraft>;
}

export class ResultRecoveryStudentSupportDraftService {
  private policyEnforcer = new ResultRecoveryPolicyEnforcer();

  constructor(
    private studentSupportRepo: StudentSupportDraftRepository,
    private safetyService: ResultRecoverySafetyService,
    private auditBridge: ResultRecoveryAuditBridge,
    private idempotencyService: ResultRecoveryIdempotencyService,
  ) {}

  private envelope(ctx: ResultRecoveryCommandContext, overrides: Partial<ResultRecoverySafeEnvelope>): ResultRecoverySafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createStudentSupportDraft(ctx: ResultRecoveryCommandContext, input: StudentSupportDraftInput): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RESULT_RECOVERY_STUDENT_SUPPORT_DRAFT_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });

    const safetyCheck = this.safetyService.assertStudentSupportDraftSafe(input as unknown as Record<string, unknown>);
    if (!safetyCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: safetyCheck.safeMessage, reasonCode: safetyCheck.reasonCode, status: 'blocked' });

    const idempotencyKey = ctx.idempotencyKey || randomUUID();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createStudentSupportDraft', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const createInput: StudentSupportDraftInput & { schoolId: string; createdByActorId: string; createdByRole: string } = {
      ...input,
      schoolId: ctx.schoolId,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    };
    const record = await this.studentSupportRepo.create(createInput);
    await this.idempotencyService.startOperation(ctx.schoolId, 'createStudentSupportDraft', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createStudentSupportDraft', idempotencyKey, 'StudentSupportDraft', record.resultRecoveryStudentSupportDraftId, 'Student support draft created');
    await this.auditBridge.recordStudentSupportDraftCreated(ctx.schoolId, record.resultRecoveryPlanId, record.resultRecoveryStudentSupportDraftId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: record.resultRecoveryStudentSupportDraftId, status: record.draftStatus, safeMessage: 'Student support draft created', reasonCode: 'STUDENT_SUPPORT_CREATED', data: record });
  }

  async getStudentSupportDraft(ctx: ResultRecoveryCommandContext, draftId: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.studentSupportRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Student support draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: draftId, status: record.draftStatus, safeMessage: 'Student support draft found', data: record });
  }

  async listStudentSupportDraftsForPlan(ctx: ResultRecoveryCommandContext, planId: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.studentSupportRepo.listByPlanId(planId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} student support drafts for plan`, data: records });
  }

  async markStudentSupportDraftReviewReady(ctx: ResultRecoveryCommandContext, draftId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RESULT_RECOVERY_STUDENT_SUPPORT_DRAFT_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.studentSupportRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Student support draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot review voided student support draft', reasonCode: 'INVALID_STATUS', status: 'error' });

    const idempotencyKey = ctx.idempotencyKey || randomUUID();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'markStudentSupportDraftReviewReady', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    await this.studentSupportRepo.markReviewReady(draftId);
    await this.idempotencyService.startOperation(ctx.schoolId, 'markStudentSupportDraftReviewReady', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'markStudentSupportDraftReviewReady', idempotencyKey, 'StudentSupportDraft', draftId, 'Student support draft review ready');
    return this.envelope(ctx, { resourceId: draftId, status: 'review_ready', safeMessage: safeMessage || 'Student support draft review ready', reasonCode: reasonCode || 'STUDENT_SUPPORT_REVIEW_READY' });
  }

  async approveStudentSupportDraftForFutureUse(ctx: ResultRecoveryCommandContext, draftId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RESULT_RECOVERY_STUDENT_SUPPORT_DRAFT_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.studentSupportRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Student support draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot approve voided student support draft', reasonCode: 'INVALID_STATUS', status: 'error' });

    const idempotencyKey = ctx.idempotencyKey || randomUUID();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'approveStudentSupportDraftForFutureUse', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    await this.studentSupportRepo.approveForFutureUse(draftId);
    await this.idempotencyService.startOperation(ctx.schoolId, 'approveStudentSupportDraftForFutureUse', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'approveStudentSupportDraftForFutureUse', idempotencyKey, 'StudentSupportDraft', draftId, 'Student support draft approved');
    await this.auditBridge.recordStudentSupportDraftApprovedForFutureUse(ctx.schoolId, record.resultRecoveryPlanId, draftId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: draftId, status: 'approved_for_future_use', safeMessage: safeMessage || 'Student support draft approved for future use', reasonCode: reasonCode || 'STUDENT_SUPPORT_APPROVED' });
  }

  async suppressStudentSupportDraft(ctx: ResultRecoveryCommandContext, draftId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.studentSupportRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Student support draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot suppress voided student support draft', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.studentSupportRepo.suppress(draftId, reasonCode || 'SUPPRESSED', safeMessage || 'Student support draft suppressed');
    return this.envelope(ctx, { resourceId: draftId, status: 'suppressed', safeMessage: safeMessage || 'Student support draft suppressed', reasonCode: reasonCode || 'STUDENT_SUPPORT_SUPPRESSED' });
  }

  async blockStudentSupportDraft(ctx: ResultRecoveryCommandContext, draftId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.studentSupportRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Student support draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided student support draft', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.studentSupportRepo.block(draftId, reasonCode || 'BLOCKED', safeMessage || 'Student support draft blocked');
    return this.envelope(ctx, { resourceId: draftId, status: 'blocked', safeMessage: safeMessage || 'Student support draft blocked', reasonCode: reasonCode || 'STUDENT_SUPPORT_BLOCKED' });
  }

  async voidStudentSupportDraft(ctx: ResultRecoveryCommandContext, draftId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.studentSupportRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Student support draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.studentSupportRepo.void(draftId, reasonCode || 'VOIDED', safeMessage || 'Student support draft voided');
    return this.envelope(ctx, { resourceId: draftId, status: 'void', safeMessage: safeMessage || 'Student support draft voided', reasonCode: reasonCode || 'STUDENT_SUPPORT_VOIDED' });
  }
}

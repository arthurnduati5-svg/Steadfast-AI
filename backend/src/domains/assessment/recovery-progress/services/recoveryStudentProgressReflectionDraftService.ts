import { randomUUID } from 'crypto';
import type { RecoveryProgressCommandContext, RecoveryProgressSafeEnvelope, RecoveryStudentProgressReflectionDraft } from '../contracts/recoveryProgressContracts';
import type { CreateStudentProgressReflectionDraftRequest, UpdateStudentProgressReflectionDraftRequest } from '../contracts/recoveryStudentProgressReflectionDraftContracts';
import { RecoveryProgressPolicyEnforcer } from '../policies/recoveryProgressPolicyDefinitions';
import { RecoveryProgressSafetyService } from './recoveryProgressSafetyService';
import { RecoveryProgressIdempotencyService } from './recoveryProgressIdempotencyService';
import { RecoveryProgressAuditBridge } from './recoveryProgressAuditBridge';

export interface StudentProgressReflectionDraftRepository {
  create(data: RecoveryStudentProgressReflectionDraft): Promise<RecoveryStudentProgressReflectionDraft>;
  getById(id: string): Promise<RecoveryStudentProgressReflectionDraft | null>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryStudentProgressReflectionDraft[]>;
  listByObservationId(observationId: string): Promise<RecoveryStudentProgressReflectionDraft[]>;
  listByEvaluationId(evaluationId: string): Promise<RecoveryStudentProgressReflectionDraft[]>;
  update(id: string, data: Partial<RecoveryStudentProgressReflectionDraft>): Promise<RecoveryStudentProgressReflectionDraft>;
  updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryStudentProgressReflectionDraft>;
}

export class RecoveryStudentProgressReflectionDraftService {
  private policyEnforcer = new RecoveryProgressPolicyEnforcer();

  constructor(
    private reflectionRepo: StudentProgressReflectionDraftRepository,
    private safetyService: RecoveryProgressSafetyService,
    private auditBridge: RecoveryProgressAuditBridge,
    private idempotencyService: RecoveryProgressIdempotencyService,
  ) {}

  private envelope(ctx: RecoveryProgressCommandContext, overrides: Partial<RecoveryProgressSafeEnvelope>): RecoveryProgressSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createReflectionDraft(ctx: RecoveryProgressCommandContext, input: CreateStudentProgressReflectionDraftRequest): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RECOVERY_STUDENT_PROGRESS_REFLECTION_DRAFT_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });

    const safetyCheck = this.safetyService.assertReflectionDraftSafe(input as unknown as Record<string, unknown>);
    if (!safetyCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: safetyCheck.safeMessage, reasonCode: safetyCheck.reasonCode, status: 'blocked' });

    const idempotencyKey = ctx.idempotencyKey || randomUUID();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createReflectionDraft', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const now = new Date().toISOString();
    const record: RecoveryStudentProgressReflectionDraft = {
      recoveryStudentProgressReflectionDraftId: randomUUID(),
      schoolId: ctx.schoolId,
      studentRef: input.studentRef,
      resultRecoveryPlanId: input.resultRecoveryPlanId,
      recoveryProgressObservationId: input.recoveryProgressObservationId,
      recoveryCheckpointEvaluationId: input.recoveryCheckpointEvaluationId,
      draftStatus: 'draft',
      safeReflectionSummary: input.safeReflectionSummary,
      studentReflectionPromptJson: (input.studentReflectionPromptJson || {}) as Record<string, unknown>,
      scaffoldStepsJson: (input.scaffoldStepsJson || {}) as Record<string, unknown>,
      blockedFieldNamesJson: input.blockedFieldNamesJson || [],
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
    const created = await this.reflectionRepo.create(record);
    await this.idempotencyService.startOperation(ctx.schoolId, 'createReflectionDraft', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createReflectionDraft', idempotencyKey, 'RecoveryStudentProgressReflectionDraft', created.recoveryStudentProgressReflectionDraftId, 'Reflection draft created');
    await this.auditBridge.recordReflectionDraftCreated(ctx.schoolId, created.recoveryStudentProgressReflectionDraftId, ctx.actorId, ctx.actorRole, ctx.requestId, ctx.correlationId);
    return this.envelope(ctx, { resourceId: created.recoveryStudentProgressReflectionDraftId, status: created.draftStatus, safeMessage: 'Student progress reflection draft created', reasonCode: 'REFLECTION_DRAFT_CREATED', data: created });
  }

  async getReflectionDraft(ctx: RecoveryProgressCommandContext, draftId: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.reflectionRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Reflection draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: draftId, status: record.draftStatus, safeMessage: 'Reflection draft found', data: record });
  }

  async listReflectionDraftsForPlan(ctx: RecoveryProgressCommandContext, planId: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.reflectionRepo.listByPlanId(ctx.schoolId, planId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} reflection drafts for plan`, data: records });
  }

  async listReflectionDraftsForObservation(ctx: RecoveryProgressCommandContext, observationId: string): Promise<RecoveryProgressSafeEnvelope> {
    const records = await this.reflectionRepo.listByObservationId(observationId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} reflection drafts for observation`, data: records });
  }

  async listReflectionDraftsForEvaluation(ctx: RecoveryProgressCommandContext, evaluationId: string): Promise<RecoveryProgressSafeEnvelope> {
    const records = await this.reflectionRepo.listByEvaluationId(evaluationId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} reflection drafts for evaluation`, data: records });
  }

  async markReflectionDraftReviewReady(ctx: RecoveryProgressCommandContext, draftId: string, reasonCode: string, safeMessage: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RECOVERY_STUDENT_PROGRESS_REFLECTION_DRAFT_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.reflectionRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Reflection draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot review voided reflection draft', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.reflectionRepo.updateStatus(draftId, 'review_ready', now);
    await this.reflectionRepo.update(draftId, { reviewReadyAt: now } as any);
    return this.envelope(ctx, { resourceId: draftId, status: 'review_ready', safeMessage: safeMessage || 'Reflection draft review ready', reasonCode: reasonCode || 'REFLECTION_DRAFT_REVIEW_READY' });
  }

  async suppressReflectionDraft(ctx: RecoveryProgressCommandContext, draftId: string, reasonCode: string, safeMessage: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.reflectionRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Reflection draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot suppress voided reflection draft', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.reflectionRepo.updateStatus(draftId, 'suppressed', now);
    await this.reflectionRepo.update(draftId, { suppressedAt: now } as any);
    return this.envelope(ctx, { resourceId: draftId, status: 'suppressed', safeMessage: safeMessage || 'Reflection draft suppressed', reasonCode: reasonCode || 'REFLECTION_DRAFT_SUPPRESSED' });
  }

  async blockReflectionDraft(ctx: RecoveryProgressCommandContext, draftId: string, reasonCode: string, safeMessage: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.reflectionRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Reflection draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided reflection draft', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.reflectionRepo.updateStatus(draftId, 'blocked', now);
    await this.reflectionRepo.update(draftId, { blockedAt: now } as any);
    return this.envelope(ctx, { resourceId: draftId, status: 'blocked', safeMessage: safeMessage || 'Reflection draft blocked', reasonCode: reasonCode || 'REFLECTION_DRAFT_BLOCKED' });
  }

  async voidReflectionDraft(ctx: RecoveryProgressCommandContext, draftId: string, reasonCode: string, safeMessage: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.reflectionRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Reflection draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.reflectionRepo.updateStatus(draftId, 'void', now);
    await this.reflectionRepo.update(draftId, { voidedAt: now } as any);
    return this.envelope(ctx, { resourceId: draftId, status: 'void', safeMessage: safeMessage || 'Reflection draft voided', reasonCode: reasonCode || 'REFLECTION_DRAFT_VOIDED' });
  }
}

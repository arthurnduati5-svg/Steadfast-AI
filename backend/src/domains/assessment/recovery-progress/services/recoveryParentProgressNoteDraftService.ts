import { randomUUID } from 'crypto';
import type { RecoveryProgressCommandContext, RecoveryProgressSafeEnvelope, RecoveryParentProgressNoteDraft } from '../contracts/recoveryProgressContracts';
import type { CreateParentProgressNoteDraftRequest, UpdateParentProgressNoteDraftRequest } from '../contracts/recoveryParentProgressNoteDraftContracts';
import { RecoveryProgressPolicyEnforcer } from '../policies/recoveryProgressPolicyDefinitions';
import { RecoveryProgressSafetyService } from './recoveryProgressSafetyService';
import { RecoveryProgressIdempotencyService } from './recoveryProgressIdempotencyService';
import { RecoveryProgressAuditBridge } from './recoveryProgressAuditBridge';

export interface ParentProgressNoteDraftRepository {
  create(data: RecoveryParentProgressNoteDraft): Promise<RecoveryParentProgressNoteDraft>;
  getById(id: string): Promise<RecoveryParentProgressNoteDraft | null>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryParentProgressNoteDraft[]>;
  listByObservationId(observationId: string): Promise<RecoveryParentProgressNoteDraft[]>;
  listByEvaluationId(evaluationId: string): Promise<RecoveryParentProgressNoteDraft[]>;
  update(id: string, data: Partial<RecoveryParentProgressNoteDraft>): Promise<RecoveryParentProgressNoteDraft>;
  updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryParentProgressNoteDraft>;
}

export class RecoveryParentProgressNoteDraftService {
  private policyEnforcer = new RecoveryProgressPolicyEnforcer();

  constructor(
    private parentNoteRepo: ParentProgressNoteDraftRepository,
    private safetyService: RecoveryProgressSafetyService,
    private auditBridge: RecoveryProgressAuditBridge,
    private idempotencyService: RecoveryProgressIdempotencyService,
  ) {}

  private envelope(ctx: RecoveryProgressCommandContext, overrides: Partial<RecoveryProgressSafeEnvelope>): RecoveryProgressSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createParentNoteDraft(ctx: RecoveryProgressCommandContext, input: CreateParentProgressNoteDraftRequest): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RECOVERY_PARENT_PROGRESS_NOTE_DRAFT_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });

    const safetyCheck = this.safetyService.assertParentNoteDraftSafe(input as unknown as Record<string, unknown>);
    if (!safetyCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: safetyCheck.safeMessage, reasonCode: safetyCheck.reasonCode, status: 'blocked' });

    const idempotencyKey = ctx.idempotencyKey || randomUUID();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createParentNoteDraft', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const now = new Date().toISOString();
    const record: RecoveryParentProgressNoteDraft = {
      recoveryParentProgressNoteDraftId: randomUUID(),
      schoolId: ctx.schoolId,
      studentRef: input.studentRef,
      resultRecoveryPlanId: input.resultRecoveryPlanId,
      recoveryProgressObservationId: input.recoveryProgressObservationId,
      recoveryCheckpointEvaluationId: input.recoveryCheckpointEvaluationId,
      audienceType: input.audienceType,
      draftStatus: 'draft',
      safeProgressSummary: input.safeProgressSummary,
      parentProgressBodyJson: (input.parentProgressBodyJson || {}) as Record<string, unknown>,
      allowedFieldNamesJson: input.allowedFieldNamesJson || [],
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
    const created = await this.parentNoteRepo.create(record);
    await this.idempotencyService.startOperation(ctx.schoolId, 'createParentNoteDraft', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createParentNoteDraft', idempotencyKey, 'RecoveryParentProgressNoteDraft', created.recoveryParentProgressNoteDraftId, 'Parent note draft created');
    await this.auditBridge.recordParentNoteDraftCreated(ctx.schoolId, created.recoveryParentProgressNoteDraftId, ctx.actorId, ctx.actorRole, ctx.requestId, ctx.correlationId);
    return this.envelope(ctx, { resourceId: created.recoveryParentProgressNoteDraftId, status: created.draftStatus, safeMessage: 'Parent progress note draft created', reasonCode: 'PARENT_NOTE_DRAFT_CREATED', data: created });
  }

  async getParentNoteDraft(ctx: RecoveryProgressCommandContext, draftId: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.parentNoteRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Parent note draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: draftId, status: record.draftStatus, safeMessage: 'Parent note draft found', data: record });
  }

  async listParentNoteDraftsForPlan(ctx: RecoveryProgressCommandContext, planId: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.parentNoteRepo.listByPlanId(ctx.schoolId, planId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} parent note drafts for plan`, data: records });
  }

  async listParentNoteDraftsForObservation(ctx: RecoveryProgressCommandContext, observationId: string): Promise<RecoveryProgressSafeEnvelope> {
    const records = await this.parentNoteRepo.listByObservationId(observationId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} parent note drafts for observation`, data: records });
  }

  async listParentNoteDraftsForEvaluation(ctx: RecoveryProgressCommandContext, evaluationId: string): Promise<RecoveryProgressSafeEnvelope> {
    const records = await this.parentNoteRepo.listByEvaluationId(evaluationId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} parent note drafts for evaluation`, data: records });
  }

  async markParentNoteDraftReviewReady(ctx: RecoveryProgressCommandContext, draftId: string, reasonCode: string, safeMessage: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RECOVERY_PARENT_PROGRESS_NOTE_DRAFT_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.parentNoteRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Parent note draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot review voided parent note draft', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.parentNoteRepo.updateStatus(draftId, 'review_ready', now);
    await this.parentNoteRepo.update(draftId, { reviewReadyAt: now } as any);
    return this.envelope(ctx, { resourceId: draftId, status: 'review_ready', safeMessage: safeMessage || 'Parent note draft review ready', reasonCode: reasonCode || 'PARENT_NOTE_REVIEW_READY' });
  }

  async suppressParentNoteDraft(ctx: RecoveryProgressCommandContext, draftId: string, reasonCode: string, safeMessage: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.parentNoteRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Parent note draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot suppress voided parent note draft', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.parentNoteRepo.updateStatus(draftId, 'suppressed', now);
    await this.parentNoteRepo.update(draftId, { suppressedAt: now } as any);
    return this.envelope(ctx, { resourceId: draftId, status: 'suppressed', safeMessage: safeMessage || 'Parent note draft suppressed', reasonCode: reasonCode || 'PARENT_NOTE_SUPPRESSED' });
  }

  async blockParentNoteDraft(ctx: RecoveryProgressCommandContext, draftId: string, reasonCode: string, safeMessage: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.parentNoteRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Parent note draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided parent note draft', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.parentNoteRepo.updateStatus(draftId, 'blocked', now);
    await this.parentNoteRepo.update(draftId, { blockedAt: now } as any);
    return this.envelope(ctx, { resourceId: draftId, status: 'blocked', safeMessage: safeMessage || 'Parent note draft blocked', reasonCode: reasonCode || 'PARENT_NOTE_BLOCKED' });
  }

  async voidParentNoteDraft(ctx: RecoveryProgressCommandContext, draftId: string, reasonCode: string, safeMessage: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.parentNoteRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Parent note draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.parentNoteRepo.updateStatus(draftId, 'void', now);
    await this.parentNoteRepo.update(draftId, { voidedAt: now } as any);
    return this.envelope(ctx, { resourceId: draftId, status: 'void', safeMessage: safeMessage || 'Parent note draft voided', reasonCode: reasonCode || 'PARENT_NOTE_VOIDED' });
  }
}

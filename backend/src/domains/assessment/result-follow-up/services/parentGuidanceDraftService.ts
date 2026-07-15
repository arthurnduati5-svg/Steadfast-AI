import { v4 as uuidv4 } from 'uuid';
import type { ResultFollowUpCommandContext, ResultFollowUpSafeEnvelope } from '../contracts/resultFollowUpContracts';
import type { CreateParentGuidanceDraftInput } from '../contracts/parentGuidanceDraftContracts';
import type { ParentGuidanceDraftRepository } from '../contracts/resultFollowUpRepositoryContracts';
import { ResultFollowUpPolicyEnforcer } from '../policies/resultFollowUpPolicyDefinitions';
import { ResultFollowUpSafetyService } from './resultFollowUpSafetyService';
import { ResultFollowUpIdempotencyService } from './resultFollowUpIdempotencyService';
import { ResultFollowUpAuditBridge } from './resultFollowUpAuditBridge';

export class ParentGuidanceDraftService {
  private policyEnforcer = new ResultFollowUpPolicyEnforcer();

  constructor(
    private draftRepo: ParentGuidanceDraftRepository,
    private safetyService: ResultFollowUpSafetyService,
    private auditBridge: ResultFollowUpAuditBridge,
    private idempotencyService: ResultFollowUpIdempotencyService,
  ) {}

  private envelope(ctx: ResultFollowUpCommandContext, overrides: Partial<ResultFollowUpSafeEnvelope>): ResultFollowUpSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createParentGuidanceDraft(ctx: ResultFollowUpCommandContext, input: Omit<CreateParentGuidanceDraftInput, 'schoolId' | 'createdByActorId' | 'createdByRole'>): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('PARENT_GUIDANCE_DRAFT_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });

    const idempotencyKey = ctx.idempotencyKey || uuidv4();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createParentGuidanceDraft', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const createInput: CreateParentGuidanceDraftInput & { schoolId: string; createdByActorId: string; createdByRole: string } = {
      ...input,
      schoolId: ctx.schoolId,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    };
    const safePayload = (input.safeGuidanceBody || {}) as Record<string, unknown>;
    const safetyCheck = this.safetyService.assertParentGuidanceSafe(safePayload);
    if (!safetyCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: safetyCheck.safeMessage, reasonCode: safetyCheck.reasonCode, status: 'blocked' });

    const record = await this.draftRepo.create(createInput);
    await this.idempotencyService.startOperation(ctx.schoolId, 'createParentGuidanceDraft', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createParentGuidanceDraft', idempotencyKey, 'ParentGuidanceDraft', record.parentGuidanceDraftId, 'Parent guidance draft created');
    await this.auditBridge.recordParentGuidanceDraftCreated(ctx.schoolId, record.resultFollowUpCaseId, record.parentGuidanceDraftId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: record.parentGuidanceDraftId, status: record.draftStatus, safeMessage: 'Parent guidance draft created', reasonCode: 'DRAFT_CREATED', data: record });
  }

  async getParentGuidanceDraft(ctx: ResultFollowUpCommandContext, draftId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.draftRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Parent guidance draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: draftId, status: record.draftStatus, safeMessage: 'Parent guidance draft found', data: record });
  }

  async listParentGuidanceDraftsForSchool(ctx: ResultFollowUpCommandContext): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.draftRepo.listBySchool(ctx.schoolId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} parent guidance drafts for school`, data: records });
  }

  async listParentGuidanceDraftsForCase(ctx: ResultFollowUpCommandContext, caseId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.draftRepo.listByCaseId(caseId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} parent guidance drafts for case`, data: records });
  }

  async listParentGuidanceDraftsForActionPlan(ctx: ResultFollowUpCommandContext, planId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.draftRepo.listByActionPlanId(planId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} parent guidance drafts for action plan`, data: records });
  }

  async listParentGuidanceDraftsByStatus(ctx: ResultFollowUpCommandContext, status: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.draftRepo.listByStatus(ctx.schoolId, status);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} parent guidance drafts with status ${status}`, data: records });
  }

  async markParentGuidanceReviewReady(ctx: ResultFollowUpCommandContext, draftId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('PARENT_GUIDANCE_DRAFT_REVIEW', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.draftRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Parent guidance draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot review voided draft', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.draftRepo.markReviewReady(draftId);
    return this.envelope(ctx, { resourceId: draftId, status: 'review_ready', safeMessage: 'Parent guidance draft review ready', reasonCode: 'DRAFT_REVIEW_READY' });
  }

  async approveParentGuidanceForFutureUse(ctx: ResultFollowUpCommandContext, draftId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('PARENT_GUIDANCE_DRAFT_APPROVE', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.draftRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Parent guidance draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot approve voided draft', reasonCode: 'INVALID_STATUS', status: 'error' });

    const idempotencyKey = ctx.idempotencyKey || uuidv4();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'approveParentGuidanceForFutureUse', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    await this.draftRepo.approveForFutureUse(draftId);
    await this.idempotencyService.startOperation(ctx.schoolId, 'approveParentGuidanceForFutureUse', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'approveParentGuidanceForFutureUse', idempotencyKey, 'ParentGuidanceDraft', draftId, 'Parent guidance approved');
    await this.auditBridge.recordParentGuidanceApprovedForFutureUse(ctx.schoolId, record.resultFollowUpCaseId, draftId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: draftId, status: 'approved_for_future_use', safeMessage: 'Parent guidance draft approved for future use', reasonCode: 'DRAFT_APPROVED' });
  }

  async suppressParentGuidanceDraft(ctx: ResultFollowUpCommandContext, draftId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.draftRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Parent guidance draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot suppress voided draft', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.draftRepo.suppress(draftId, 'SUPPRESSED', 'Parent guidance draft suppressed');
    return this.envelope(ctx, { resourceId: draftId, status: 'suppressed', safeMessage: 'Parent guidance draft suppressed', reasonCode: 'DRAFT_SUPPRESSED' });
  }

  async blockParentGuidanceDraft(ctx: ResultFollowUpCommandContext, draftId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.draftRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Parent guidance draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided draft', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.draftRepo.block(draftId, 'BLOCKED', 'Parent guidance draft blocked');
    return this.envelope(ctx, { resourceId: draftId, status: 'blocked', safeMessage: 'Parent guidance draft blocked', reasonCode: 'DRAFT_BLOCKED' });
  }

  async voidParentGuidanceDraft(ctx: ResultFollowUpCommandContext, draftId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.draftRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Parent guidance draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.draftRepo.void(draftId, 'VOIDED', 'Parent guidance draft voided');
    return this.envelope(ctx, { resourceId: draftId, status: 'void', safeMessage: 'Parent guidance draft voided', reasonCode: 'DRAFT_VOIDED' });
  }
}

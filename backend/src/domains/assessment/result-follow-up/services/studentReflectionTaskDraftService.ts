import { v4 as uuidv4 } from 'uuid';
import type { ResultFollowUpCommandContext, ResultFollowUpSafeEnvelope } from '../contracts/resultFollowUpContracts';
import type { CreateStudentReflectionTaskDraftInput } from '../contracts/studentReflectionTaskDraftContracts';
import type { StudentReflectionTaskDraftRepository } from '../contracts/resultFollowUpRepositoryContracts';
import { ResultFollowUpPolicyEnforcer } from '../policies/resultFollowUpPolicyDefinitions';
import { ResultFollowUpSafetyService } from './resultFollowUpSafetyService';
import { ResultFollowUpIdempotencyService } from './resultFollowUpIdempotencyService';
import { ResultFollowUpAuditBridge } from './resultFollowUpAuditBridge';

export class StudentReflectionTaskDraftService {
  private policyEnforcer = new ResultFollowUpPolicyEnforcer();

  constructor(
    private draftRepo: StudentReflectionTaskDraftRepository,
    private safetyService: ResultFollowUpSafetyService,
    private auditBridge: ResultFollowUpAuditBridge,
    private idempotencyService: ResultFollowUpIdempotencyService,
  ) {}

  private envelope(ctx: ResultFollowUpCommandContext, overrides: Partial<ResultFollowUpSafeEnvelope>): ResultFollowUpSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createStudentReflectionDraft(ctx: ResultFollowUpCommandContext, input: Omit<CreateStudentReflectionTaskDraftInput, 'schoolId' | 'createdByActorId' | 'createdByRole'>): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('STUDENT_REFLECTION_TASK_DRAFT_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });

    const idempotencyKey = ctx.idempotencyKey || uuidv4();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createStudentReflectionDraft', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const safePayload = (input.reflectionObjectiveRefs || {}) as Record<string, unknown>;
    const safetyCheck = this.safetyService.assertStudentReflectionSafe(safePayload);
    if (!safetyCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: safetyCheck.safeMessage, reasonCode: safetyCheck.reasonCode, status: 'blocked' });

    const createInput: CreateStudentReflectionTaskDraftInput & { schoolId: string; createdByActorId: string; createdByRole: string } = {
      ...input,
      schoolId: ctx.schoolId,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    };
    const record = await this.draftRepo.create(createInput);
    await this.idempotencyService.startOperation(ctx.schoolId, 'createStudentReflectionDraft', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createStudentReflectionDraft', idempotencyKey, 'StudentReflectionTaskDraft', record.studentReflectionTaskDraftId, 'Student reflection draft created');
    await this.auditBridge.recordStudentReflectionDraftCreated(ctx.schoolId, record.resultFollowUpCaseId, record.studentReflectionTaskDraftId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: record.studentReflectionTaskDraftId, status: record.draftStatus, safeMessage: 'Student reflection draft created', reasonCode: 'REFLECTION_DRAFT_CREATED', data: record });
  }

  async getStudentReflectionDraft(ctx: ResultFollowUpCommandContext, draftId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.draftRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Student reflection draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: draftId, status: record.draftStatus, safeMessage: 'Student reflection draft found', data: record });
  }

  async listStudentReflectionDraftsForSchool(ctx: ResultFollowUpCommandContext): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.draftRepo.listBySchool(ctx.schoolId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} student reflection drafts for school`, data: records });
  }

  async listStudentReflectionDraftsForCase(ctx: ResultFollowUpCommandContext, caseId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.draftRepo.listByCaseId(caseId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} student reflection drafts for case`, data: records });
  }

  async listStudentReflectionDraftsForActionPlan(ctx: ResultFollowUpCommandContext, planId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.draftRepo.listByActionPlanId(planId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} student reflection drafts for action plan`, data: records });
  }

  async listStudentReflectionDraftsByStatus(ctx: ResultFollowUpCommandContext, status: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.draftRepo.listByStatus(ctx.schoolId, status);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} student reflection drafts with status ${status}`, data: records });
  }

  async markStudentReflectionReviewReady(ctx: ResultFollowUpCommandContext, draftId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('STUDENT_REFLECTION_TASK_DRAFT_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.draftRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Student reflection draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot review voided draft', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.draftRepo.markReviewReady(draftId);
    return this.envelope(ctx, { resourceId: draftId, status: 'review_ready', safeMessage: 'Student reflection draft review ready', reasonCode: 'REFLECTION_DRAFT_REVIEW_READY' });
  }

  async approveStudentReflectionForFutureUse(ctx: ResultFollowUpCommandContext, draftId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('FOLLOW_UP_SUMMARY_MUTATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.draftRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Student reflection draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot approve voided draft', reasonCode: 'INVALID_STATUS', status: 'error' });

    const idempotencyKey = ctx.idempotencyKey || uuidv4();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'approveStudentReflectionForFutureUse', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    await this.draftRepo.approveForFutureUse(draftId);
    await this.idempotencyService.startOperation(ctx.schoolId, 'approveStudentReflectionForFutureUse', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'approveStudentReflectionForFutureUse', idempotencyKey, 'StudentReflectionTaskDraft', draftId, 'Student reflection approved');
    await this.auditBridge.recordStudentReflectionApprovedForFutureUse(ctx.schoolId, record.resultFollowUpCaseId, draftId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: draftId, status: 'approved_for_future_use', safeMessage: 'Student reflection draft approved for future use', reasonCode: 'REFLECTION_DRAFT_APPROVED' });
  }

  async suppressStudentReflectionDraft(ctx: ResultFollowUpCommandContext, draftId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.draftRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Student reflection draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot suppress voided draft', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.draftRepo.suppress(draftId, 'SUPPRESSED', 'Student reflection draft suppressed');
    return this.envelope(ctx, { resourceId: draftId, status: 'suppressed', safeMessage: 'Student reflection draft suppressed', reasonCode: 'REFLECTION_DRAFT_SUPPRESSED' });
  }

  async blockStudentReflectionDraft(ctx: ResultFollowUpCommandContext, draftId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.draftRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Student reflection draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided draft', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.draftRepo.block(draftId, 'BLOCKED', 'Student reflection draft blocked');
    return this.envelope(ctx, { resourceId: draftId, status: 'blocked', safeMessage: 'Student reflection draft blocked', reasonCode: 'REFLECTION_DRAFT_BLOCKED' });
  }

  async voidStudentReflectionDraft(ctx: ResultFollowUpCommandContext, draftId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.draftRepo.getById(draftId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Student reflection draft not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.draftStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.draftRepo.void(draftId, 'VOIDED', 'Student reflection draft voided');
    return this.envelope(ctx, { resourceId: draftId, status: 'void', safeMessage: 'Student reflection draft voided', reasonCode: 'REFLECTION_DRAFT_VOIDED' });
  }
}

import { v4 as uuidv4 } from 'uuid';
import type { ResultFollowUpCommandContext, ResultFollowUpSafeEnvelope } from '../contracts/resultFollowUpContracts';
import type { CreateActionPlanInput } from '../contracts/resultFollowUpActionPlanContracts';
import type { ResultFollowUpActionPlanRepository } from '../contracts/resultFollowUpRepositoryContracts';
import { ResultFollowUpPolicyEnforcer } from '../policies/resultFollowUpPolicyDefinitions';
import { ResultFollowUpIdempotencyService } from './resultFollowUpIdempotencyService';
import { ResultFollowUpAuditBridge } from './resultFollowUpAuditBridge';

export class ResultFollowUpActionPlanService {
  private policyEnforcer = new ResultFollowUpPolicyEnforcer();

  constructor(
    private planRepo: ResultFollowUpActionPlanRepository,
    private auditBridge: ResultFollowUpAuditBridge,
    private idempotencyService: ResultFollowUpIdempotencyService,
  ) {}

  private envelope(ctx: ResultFollowUpCommandContext, overrides: Partial<ResultFollowUpSafeEnvelope>): ResultFollowUpSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createActionPlan(ctx: ResultFollowUpCommandContext, input: Omit<CreateActionPlanInput, 'schoolId' | 'createdByActorId' | 'createdByRole'>): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RESULT_FOLLOW_UP_ACTION_PLAN_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });

    const idempotencyKey = ctx.idempotencyKey || uuidv4();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createActionPlan', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const createInput: CreateActionPlanInput & { schoolId: string; createdByActorId: string; createdByRole: string } = {
      ...input,
      schoolId: ctx.schoolId,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    };
    const record = await this.planRepo.create(createInput);
    await this.idempotencyService.startOperation(ctx.schoolId, 'createActionPlan', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createActionPlan', idempotencyKey, 'ResultFollowUpActionPlan', record.resultFollowUpActionPlanId, 'Action plan created');
    await this.auditBridge.recordActionPlanCreated(ctx.schoolId, record.resultFollowUpCaseId, record.resultFollowUpActionPlanId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: record.resultFollowUpActionPlanId, status: record.planStatus, safeMessage: 'Action plan created', reasonCode: 'PLAN_CREATED', data: record });
  }

  async getActionPlan(ctx: ResultFollowUpCommandContext, planId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.planRepo.getById(planId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Action plan not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: planId, status: record.planStatus, safeMessage: 'Action plan found', data: record });
  }

  async listActionPlansForSchool(ctx: ResultFollowUpCommandContext): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.planRepo.listBySchool(ctx.schoolId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} action plans for school`, data: records });
  }

  async listActionPlansForCase(ctx: ResultFollowUpCommandContext, caseId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.planRepo.listByCaseId(caseId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} action plans for case`, data: records });
  }

  async listActionPlansForStudent(ctx: ResultFollowUpCommandContext, studentRef: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.planRepo.listByStudentRef(ctx.schoolId, studentRef);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} action plans for student`, data: records });
  }

  async listActionPlansByStatus(ctx: ResultFollowUpCommandContext, status: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.planRepo.listByStatus(ctx.schoolId, status);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} action plans with status ${status}`, data: records });
  }

  async markActionPlanReviewReady(ctx: ResultFollowUpCommandContext, planId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RESULT_FOLLOW_UP_ACTION_PLAN_REVIEW', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.planRepo.getById(planId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Action plan not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.planStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot review voided action plan', reasonCode: 'INVALID_STATUS', status: 'error' });

    const idempotencyKey = ctx.idempotencyKey || uuidv4();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'markActionPlanReviewReady', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    await this.planRepo.markReviewReady(planId);
    await this.idempotencyService.startOperation(ctx.schoolId, 'markActionPlanReviewReady', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'markActionPlanReviewReady', idempotencyKey, 'ResultFollowUpActionPlan', planId, 'Action plan review ready');
    return this.envelope(ctx, { resourceId: planId, status: 'teacher_review_ready', safeMessage: 'Action plan review ready', reasonCode: 'PLAN_REVIEW_READY' });
  }

  async approveActionPlanForFutureUse(ctx: ResultFollowUpCommandContext, planId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RESULT_FOLLOW_UP_ACTION_PLAN_APPROVE', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.planRepo.getById(planId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Action plan not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.planStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot approve voided action plan', reasonCode: 'INVALID_STATUS', status: 'error' });

    const idempotencyKey = ctx.idempotencyKey || uuidv4();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'approveActionPlanForFutureUse', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    await this.planRepo.approveForFutureUse(planId);
    await this.idempotencyService.startOperation(ctx.schoolId, 'approveActionPlanForFutureUse', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'approveActionPlanForFutureUse', idempotencyKey, 'ResultFollowUpActionPlan', planId, 'Action plan approved');
    await this.auditBridge.recordActionPlanApprovedForFutureUse(ctx.schoolId, record.resultFollowUpCaseId, planId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: planId, status: 'approved_for_future_use', safeMessage: 'Action plan approved for future use', reasonCode: 'PLAN_APPROVED' });
  }

  async suppressActionPlan(ctx: ResultFollowUpCommandContext, planId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.planRepo.getById(planId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Action plan not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.planStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot suppress voided action plan', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.planRepo.suppress(planId, 'SUPPRESSED', 'Action plan suppressed');
    return this.envelope(ctx, { resourceId: planId, status: 'suppressed', safeMessage: 'Action plan suppressed', reasonCode: 'PLAN_SUPPRESSED' });
  }

  async blockActionPlan(ctx: ResultFollowUpCommandContext, planId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.planRepo.getById(planId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Action plan not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.planStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided action plan', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.planRepo.block(planId, 'BLOCKED', 'Action plan blocked');
    return this.envelope(ctx, { resourceId: planId, status: 'blocked', safeMessage: 'Action plan blocked', reasonCode: 'PLAN_BLOCKED' });
  }

  async voidActionPlan(ctx: ResultFollowUpCommandContext, planId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.planRepo.getById(planId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Action plan not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.planStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.planRepo.void(planId, 'VOIDED', 'Action plan voided');
    return this.envelope(ctx, { resourceId: planId, status: 'void', safeMessage: 'Action plan voided', reasonCode: 'PLAN_VOIDED' });
  }
}

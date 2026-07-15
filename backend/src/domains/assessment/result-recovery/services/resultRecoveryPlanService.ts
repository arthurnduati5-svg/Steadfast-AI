import { randomUUID } from 'crypto';
import type { ResultRecoveryCommandContext, ResultRecoverySafeEnvelope } from '../contracts/resultRecoveryContracts';
import type { CreateRecoveryPlanInput, ResultRecoveryPlan, ResultRecoveryPlanPreview } from '../contracts/resultRecoveryPlanContracts';
import { ResultRecoveryPolicyEnforcer } from '../policies/resultRecoveryPolicyDefinitions';
import { ResultRecoverySafetyService } from './resultRecoverySafetyService';
import { ResultRecoveryIdempotencyService } from './resultRecoveryIdempotencyService';
import { ResultRecoveryAuditBridge } from './resultRecoveryAuditBridge';

export interface RecoveryPlanRepository {
  create(input: CreateRecoveryPlanInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultRecoveryPlan>;
  getById(planId: string): Promise<ResultRecoveryPlan | null>;
  listBySchool(schoolId: string): Promise<ResultRecoveryPlanPreview[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<ResultRecoveryPlanPreview[]>;
  listByStatus(schoolId: string, status: string): Promise<ResultRecoveryPlanPreview[]>;
  listByPriority(schoolId: string, priority: string): Promise<ResultRecoveryPlanPreview[]>;
  update(planId: string, data: Partial<ResultRecoveryPlan>): Promise<ResultRecoveryPlan>;
  updateStatus(planId: string, planStatus: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryPlan>;
  markReviewReady(planId: string): Promise<ResultRecoveryPlan>;
  approveForFutureUse(planId: string): Promise<ResultRecoveryPlan>;
  suppress(planId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryPlan>;
  block(planId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryPlan>;
  void(planId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryPlan>;
}

export interface RecoveryObjectiveRepository {
  listByPlanId(planId: string): Promise<unknown[]>;
}

export interface RecoveryStepRepository {
  listByPlanId(planId: string): Promise<unknown[]>;
}

export class ResultRecoveryPlanService {
  private policyEnforcer = new ResultRecoveryPolicyEnforcer();

  constructor(
    private planRepo: RecoveryPlanRepository,
    private objectiveRepo: RecoveryObjectiveRepository,
    private stepRepo: RecoveryStepRepository,
    private safetyService: ResultRecoverySafetyService,
    private auditBridge: ResultRecoveryAuditBridge,
    private idempotencyService: ResultRecoveryIdempotencyService,
  ) {}

  private envelope(ctx: ResultRecoveryCommandContext, overrides: Partial<ResultRecoverySafeEnvelope>): ResultRecoverySafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createRecoveryPlan(ctx: ResultRecoveryCommandContext, input: Omit<CreateRecoveryPlanInput, 'schoolId' | 'createdByActorId' | 'createdByRole'>): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RESULT_RECOVERY_PLAN_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });

    const safetyCheck = this.safetyService.assertMockOnlyRecoveryOperation(input.planMode || 'mock_plan_only');
    if (!safetyCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: safetyCheck.safeMessage, reasonCode: safetyCheck.reasonCode, status: 'blocked' });

    const fieldCheck = this.safetyService.assertNoScoreMutation(input as unknown as Record<string, unknown>);
    if (!fieldCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: fieldCheck.safeMessage, reasonCode: fieldCheck.reasonCode, status: 'blocked' });

    const idempotencyKey = ctx.idempotencyKey || randomUUID();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createRecoveryPlan', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const createInput: CreateRecoveryPlanInput & { schoolId: string; createdByActorId: string; createdByRole: string } = {
      ...input,
      schoolId: ctx.schoolId,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    };
    const record = await this.planRepo.create(createInput);
    await this.idempotencyService.startOperation(ctx.schoolId, 'createRecoveryPlan', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createRecoveryPlan', idempotencyKey, 'ResultRecoveryPlan', record.resultRecoveryPlanId, 'Recovery plan created');
    await this.auditBridge.recordRecoveryPlanCreated(ctx.schoolId, record.resultRecoveryPlanId, ctx.actorId, ctx.actorRole, undefined, ctx.requestId, ctx.correlationId);
    return this.envelope(ctx, { resourceId: record.resultRecoveryPlanId, status: record.planStatus, safeMessage: 'Recovery plan created', reasonCode: 'PLAN_CREATED', data: record });
  }

  async getRecoveryPlan(ctx: ResultRecoveryCommandContext, planId: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.planRepo.getById(planId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Recovery plan not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: planId, status: record.planStatus, safeMessage: 'Recovery plan found', data: record });
  }

  async listRecoveryPlansForSchool(ctx: ResultRecoveryCommandContext): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.planRepo.listBySchool(ctx.schoolId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} recovery plans for school`, data: records });
  }

  async listRecoveryPlansForStudent(ctx: ResultRecoveryCommandContext, studentRef: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.planRepo.listByStudentRef(ctx.schoolId, studentRef);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} recovery plans for student`, data: records });
  }

  async listRecoveryPlansByStatus(ctx: ResultRecoveryCommandContext, status: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.planRepo.listByStatus(ctx.schoolId, status);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} recovery plans with status ${status}`, data: records });
  }

  async listRecoveryPlansByPriority(ctx: ResultRecoveryCommandContext, priority: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.planRepo.listByPriority(ctx.schoolId, priority);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} recovery plans with priority ${priority}`, data: records });
  }

  async markRecoveryPlanReviewReady(ctx: ResultRecoveryCommandContext, planId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RESULT_RECOVERY_PLAN_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.planRepo.getById(planId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Recovery plan not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.planStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot review voided recovery plan', reasonCode: 'INVALID_STATUS', status: 'error' });

    const idempotencyKey = ctx.idempotencyKey || randomUUID();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'markRecoveryPlanReviewReady', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    await this.planRepo.markReviewReady(planId);
    await this.idempotencyService.startOperation(ctx.schoolId, 'markRecoveryPlanReviewReady', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'markRecoveryPlanReviewReady', idempotencyKey, 'ResultRecoveryPlan', planId, 'Recovery plan review ready');
    await this.auditBridge.recordRecoveryPlanReviewReady(ctx.schoolId, planId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: planId, status: 'review_ready', safeMessage: safeMessage || 'Recovery plan review ready', reasonCode: reasonCode || 'PLAN_REVIEW_READY' });
  }

  async approveRecoveryPlanForFutureUse(ctx: ResultRecoveryCommandContext, planId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RESULT_RECOVERY_PLAN_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.planRepo.getById(planId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Recovery plan not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.planStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot approve voided recovery plan', reasonCode: 'INVALID_STATUS', status: 'error' });

    const idempotencyKey = ctx.idempotencyKey || randomUUID();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'approveRecoveryPlanForFutureUse', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    await this.planRepo.approveForFutureUse(planId);
    await this.idempotencyService.startOperation(ctx.schoolId, 'approveRecoveryPlanForFutureUse', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'approveRecoveryPlanForFutureUse', idempotencyKey, 'ResultRecoveryPlan', planId, 'Recovery plan approved');
    await this.auditBridge.recordRecoveryPlanApprovedForFutureUse(ctx.schoolId, planId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: planId, status: 'approved_for_future_use', safeMessage: safeMessage || 'Recovery plan approved for future use', reasonCode: reasonCode || 'PLAN_APPROVED' });
  }

  async suppressRecoveryPlan(ctx: ResultRecoveryCommandContext, planId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.planRepo.getById(planId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Recovery plan not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.planStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot suppress voided recovery plan', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.planRepo.suppress(planId, reasonCode || 'SUPPRESSED', safeMessage || 'Recovery plan suppressed');
    return this.envelope(ctx, { resourceId: planId, status: 'suppressed', safeMessage: safeMessage || 'Recovery plan suppressed', reasonCode: reasonCode || 'PLAN_SUPPRESSED' });
  }

  async blockRecoveryPlan(ctx: ResultRecoveryCommandContext, planId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.planRepo.getById(planId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Recovery plan not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.planStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided recovery plan', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.planRepo.block(planId, reasonCode || 'BLOCKED', safeMessage || 'Recovery plan blocked');
    return this.envelope(ctx, { resourceId: planId, status: 'blocked', safeMessage: safeMessage || 'Recovery plan blocked', reasonCode: reasonCode || 'PLAN_BLOCKED' });
  }

  async voidRecoveryPlan(ctx: ResultRecoveryCommandContext, planId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.planRepo.getById(planId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Recovery plan not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.planStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.planRepo.void(planId, reasonCode || 'VOIDED', safeMessage || 'Recovery plan voided');
    return this.envelope(ctx, { resourceId: planId, status: 'void', safeMessage: safeMessage || 'Recovery plan voided', reasonCode: reasonCode || 'PLAN_VOIDED' });
  }
}

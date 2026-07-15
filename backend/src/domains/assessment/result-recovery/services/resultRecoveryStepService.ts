import { randomUUID } from 'crypto';
import type { ResultRecoveryCommandContext, ResultRecoverySafeEnvelope, ResultRecoveryStepType } from '../contracts/resultRecoveryContracts';
import { ResultRecoveryPolicyEnforcer } from '../policies/resultRecoveryPolicyDefinitions';
import { ResultRecoverySafetyService } from './resultRecoverySafetyService';
import { ResultRecoveryIdempotencyService } from './resultRecoveryIdempotencyService';
import { ResultRecoveryAuditBridge } from './resultRecoveryAuditBridge';

export interface RecoveryStepInput {
  resultRecoveryPlanId: string;
  resultRecoveryObjectiveId?: string;
  studentRef: string;
  stepType?: ResultRecoveryStepType;
  stepPriority?: string;
  safeStepSummary: string;
  learningObjectiveRef?: string;
  skillRef?: string;
  topicRef?: string;
  successCriteriaJson?: Record<string, unknown>;
}

export interface RecoveryStep {
  resultRecoveryStepId: string;
  schoolId: string;
  resultRecoveryPlanId: string;
  resultRecoveryObjectiveId: string | null;
  studentRef: string;
  stepStatus: string;
  stepType: string;
  stepPriority: string;
  safeStepSummary: string;
  learningObjectiveRef: string | null;
  skillRef: string | null;
  topicRef: string | null;
  successCriteriaJson: Record<string, unknown> | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  reviewReadyAt: string | null;
  approvedForFutureUseAt: string | null;
  completedMockAt: string | null;
  suppressedAt: string | null;
  voidedAt: string | null;
}

export interface RecoveryStepPreview {
  resultRecoveryStepId: string;
  resultRecoveryPlanId: string;
  studentRef: string;
  stepStatus: string;
  stepType: string;
  safeStepSummary: string;
  createdAt: string;
}

export interface RecoveryStepRepository {
  create(input: RecoveryStepInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<RecoveryStep>;
  getById(stepId: string): Promise<RecoveryStep | null>;
  listByPlanId(planId: string): Promise<RecoveryStepPreview[]>;
  listByObjectiveId(objectiveId: string): Promise<RecoveryStepPreview[]>;
  update(stepId: string, data: Partial<RecoveryStep>): Promise<RecoveryStep>;
  updateStatus(stepId: string, stepStatus: string, reasonCode: string, safeMessage: string): Promise<RecoveryStep>;
  markReviewReady(stepId: string): Promise<RecoveryStep>;
  approveForFutureUse(stepId: string): Promise<RecoveryStep>;
  completeMock(stepId: string): Promise<RecoveryStep>;
  suppress(stepId: string, reasonCode: string, safeMessage: string): Promise<RecoveryStep>;
  void(stepId: string, reasonCode: string, safeMessage: string): Promise<RecoveryStep>;
}

export class ResultRecoveryStepService {
  private policyEnforcer = new ResultRecoveryPolicyEnforcer();

  constructor(
    private stepRepo: RecoveryStepRepository,
    private safetyService: ResultRecoverySafetyService,
    private auditBridge: ResultRecoveryAuditBridge,
    private idempotencyService: ResultRecoveryIdempotencyService,
  ) {}

  private envelope(ctx: ResultRecoveryCommandContext, overrides: Partial<ResultRecoverySafeEnvelope>): ResultRecoverySafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createRecoveryStep(ctx: ResultRecoveryCommandContext, input: RecoveryStepInput): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RESULT_RECOVERY_STEP_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });

    const idempotencyKey = ctx.idempotencyKey || randomUUID();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createRecoveryStep', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const createInput: RecoveryStepInput & { schoolId: string; createdByActorId: string; createdByRole: string } = {
      ...input,
      schoolId: ctx.schoolId,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    };
    const record = await this.stepRepo.create(createInput);
    await this.idempotencyService.startOperation(ctx.schoolId, 'createRecoveryStep', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createRecoveryStep', idempotencyKey, 'RecoveryStep', record.resultRecoveryStepId, 'Recovery step created');
    await this.auditBridge.recordRecoveryStepCreated(ctx.schoolId, record.resultRecoveryPlanId, record.resultRecoveryStepId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: record.resultRecoveryStepId, status: record.stepStatus, safeMessage: 'Recovery step created', reasonCode: 'STEP_CREATED', data: record });
  }

  async getRecoveryStep(ctx: ResultRecoveryCommandContext, stepId: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.stepRepo.getById(stepId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Recovery step not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: stepId, status: record.stepStatus, safeMessage: 'Recovery step found', data: record });
  }

  async listStepsForPlan(ctx: ResultRecoveryCommandContext, planId: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.stepRepo.listByPlanId(planId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} steps for plan`, data: records });
  }

  async listStepsForObjective(ctx: ResultRecoveryCommandContext, objectiveId: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.stepRepo.listByObjectiveId(objectiveId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} steps for objective`, data: records });
  }

  async markStepReviewReady(ctx: ResultRecoveryCommandContext, stepId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RESULT_RECOVERY_STEP_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.stepRepo.getById(stepId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Recovery step not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.stepStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot review voided step', reasonCode: 'INVALID_STATUS', status: 'error' });

    const idempotencyKey = ctx.idempotencyKey || randomUUID();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'markStepReviewReady', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    await this.stepRepo.markReviewReady(stepId);
    await this.idempotencyService.startOperation(ctx.schoolId, 'markStepReviewReady', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'markStepReviewReady', idempotencyKey, 'RecoveryStep', stepId, 'Recovery step review ready');
    return this.envelope(ctx, { resourceId: stepId, status: 'review_ready', safeMessage: safeMessage || 'Recovery step review ready', reasonCode: reasonCode || 'STEP_REVIEW_READY' });
  }

  async approveStepForFutureUse(ctx: ResultRecoveryCommandContext, stepId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RESULT_RECOVERY_STEP_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.stepRepo.getById(stepId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Recovery step not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.stepStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot approve voided step', reasonCode: 'INVALID_STATUS', status: 'error' });

    const idempotencyKey = ctx.idempotencyKey || randomUUID();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'approveStepForFutureUse', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    await this.stepRepo.approveForFutureUse(stepId);
    await this.idempotencyService.startOperation(ctx.schoolId, 'approveStepForFutureUse', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'approveStepForFutureUse', idempotencyKey, 'RecoveryStep', stepId, 'Recovery step approved');
    return this.envelope(ctx, { resourceId: stepId, status: 'approved_for_future_use', safeMessage: safeMessage || 'Recovery step approved for future use', reasonCode: reasonCode || 'STEP_APPROVED' });
  }

  async completeStepMock(ctx: ResultRecoveryCommandContext, stepId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.stepRepo.getById(stepId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Recovery step not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.stepStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot complete voided step', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.stepRepo.completeMock(stepId);
    return this.envelope(ctx, { resourceId: stepId, status: 'completed_mock', safeMessage: safeMessage || 'Recovery step completed mock', reasonCode: reasonCode || 'STEP_COMPLETED_MOCK' });
  }

  async suppressStep(ctx: ResultRecoveryCommandContext, stepId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.stepRepo.getById(stepId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Recovery step not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.stepStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot suppress voided step', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.stepRepo.suppress(stepId, reasonCode || 'SUPPRESSED', safeMessage || 'Recovery step suppressed');
    return this.envelope(ctx, { resourceId: stepId, status: 'suppressed', safeMessage: safeMessage || 'Recovery step suppressed', reasonCode: reasonCode || 'STEP_SUPPRESSED' });
  }

  async voidStep(ctx: ResultRecoveryCommandContext, stepId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.stepRepo.getById(stepId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Recovery step not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.stepStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.stepRepo.void(stepId, reasonCode || 'VOIDED', safeMessage || 'Recovery step voided');
    return this.envelope(ctx, { resourceId: stepId, status: 'void', safeMessage: safeMessage || 'Recovery step voided', reasonCode: reasonCode || 'STEP_VOIDED' });
  }
}

import { randomUUID } from 'crypto';
import type { RecoveryProgressCommandContext, RecoveryProgressSafeEnvelope, RecoveryCheckpointEvaluation } from '../contracts/recoveryProgressContracts';
import type { CreateCheckpointEvaluationRequest, UpdateCheckpointEvaluationRequest } from '../contracts/recoveryCheckpointEvaluationContracts';
import { RecoveryProgressPolicyEnforcer } from '../policies/recoveryProgressPolicyDefinitions';
import { RecoveryProgressSafetyService } from './recoveryProgressSafetyService';
import { RecoveryProgressIdempotencyService } from './recoveryProgressIdempotencyService';
import { RecoveryProgressAuditBridge } from './recoveryProgressAuditBridge';

export interface CheckpointEvaluationRepository {
  create(data: RecoveryCheckpointEvaluation): Promise<RecoveryCheckpointEvaluation>;
  getById(id: string): Promise<RecoveryCheckpointEvaluation | null>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryCheckpointEvaluation[]>;
  listByCheckpointId(schoolId: string, checkpointId: string): Promise<RecoveryCheckpointEvaluation[]>;
  listByObservationId(observationId: string): Promise<RecoveryCheckpointEvaluation[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryCheckpointEvaluation[]>;
  listByStatus(schoolId: string, status: string): Promise<RecoveryCheckpointEvaluation[]>;
  listByResult(schoolId: string, result: string): Promise<RecoveryCheckpointEvaluation[]>;
  update(id: string, data: Partial<RecoveryCheckpointEvaluation>): Promise<RecoveryCheckpointEvaluation>;
  updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryCheckpointEvaluation>;
}

export class RecoveryCheckpointEvaluationService {
  private policyEnforcer = new RecoveryProgressPolicyEnforcer();

  constructor(
    private evaluationRepo: CheckpointEvaluationRepository,
    private safetyService: RecoveryProgressSafetyService,
    private auditBridge: RecoveryProgressAuditBridge,
    private idempotencyService: RecoveryProgressIdempotencyService,
  ) {}

  private envelope(ctx: RecoveryProgressCommandContext, overrides: Partial<RecoveryProgressSafeEnvelope>): RecoveryProgressSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createEvaluation(ctx: RecoveryProgressCommandContext, input: CreateCheckpointEvaluationRequest): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RECOVERY_CHECKPOINT_EVALUATION_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });

    const safetyCheck = this.safetyService.assertMockOnlyProgressOperation(input.evaluationMode || 'mock_evaluation_only');
    if (!safetyCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: safetyCheck.safeMessage, reasonCode: safetyCheck.reasonCode, status: 'blocked' });

    const fieldCheck = this.safetyService.assertEvaluationReferencesSafe(input as unknown as Record<string, unknown>);
    if (!fieldCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: fieldCheck.safeMessage, reasonCode: fieldCheck.reasonCode, status: 'blocked' });

    const idempotencyKey = ctx.idempotencyKey || randomUUID();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createEvaluation', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const now = new Date().toISOString();
    const record: RecoveryCheckpointEvaluation = {
      recoveryCheckpointEvaluationId: randomUUID(),
      schoolId: ctx.schoolId,
      studentRef: input.studentRef,
      resultRecoveryPlanId: input.resultRecoveryPlanId,
      resultRecoveryCheckpointId: input.resultRecoveryCheckpointId,
      recoveryProgressObservationId: input.recoveryProgressObservationId,
      evaluationStatus: 'draft',
      evaluationMode: input.evaluationMode as any,
      evaluationResult: input.evaluationResult as any,
      safeEvaluationSummary: input.safeEvaluationSummary,
      criteriaRefsJson: (input.criteriaRefsJson || {}) as Record<string, unknown>,
      criteriaResultsJson: (input.criteriaResultsJson || {}) as Record<string, unknown>,
      evidenceRefsJson: (input.evidenceRefsJson || {}) as Record<string, unknown>,
      recommendedNextStateJson: (input.recommendedNextStateJson || {}) as Record<string, unknown>,
      blockedReasonCodesJson: input.blockedReasonCodesJson || [],
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
      createdAt: now,
      updatedAt: now,
      evaluatedAt: now,
      reviewReadyAt: undefined,
      approvedForFutureUseAt: undefined,
      suppressedAt: undefined,
      blockedAt: undefined,
      voidedAt: undefined,
    };
    const created = await this.evaluationRepo.create(record);
    await this.idempotencyService.startOperation(ctx.schoolId, 'createEvaluation', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createEvaluation', idempotencyKey, 'RecoveryCheckpointEvaluation', created.recoveryCheckpointEvaluationId, 'Evaluation created');
    await this.auditBridge.recordCheckpointEvaluationCreated(ctx.schoolId, created.recoveryCheckpointEvaluationId, ctx.actorId, ctx.actorRole, ctx.requestId, ctx.correlationId);
    return this.envelope(ctx, { resourceId: created.recoveryCheckpointEvaluationId, status: created.evaluationStatus, safeMessage: 'Checkpoint evaluation created', reasonCode: 'EVALUATION_CREATED', data: created });
  }

  async getEvaluation(ctx: RecoveryProgressCommandContext, evaluationId: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.evaluationRepo.getById(evaluationId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Evaluation not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: evaluationId, status: record.evaluationStatus, safeMessage: 'Evaluation found', data: record });
  }

  async listEvaluationsForPlan(ctx: RecoveryProgressCommandContext, planId: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.evaluationRepo.listByPlanId(ctx.schoolId, planId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} evaluations for plan`, data: records });
  }

  async listEvaluationsForCheckpoint(ctx: RecoveryProgressCommandContext, checkpointId: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.evaluationRepo.listByCheckpointId(ctx.schoolId, checkpointId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} evaluations for checkpoint`, data: records });
  }

  async listEvaluationsForObservation(ctx: RecoveryProgressCommandContext, observationId: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.evaluationRepo.listByObservationId(observationId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} evaluations for observation`, data: records });
  }

  async listEvaluationsForStudent(ctx: RecoveryProgressCommandContext, studentRef: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.evaluationRepo.listByStudentRef(ctx.schoolId, studentRef);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} evaluations for student`, data: records });
  }

  async listEvaluationsByStatus(ctx: RecoveryProgressCommandContext, status: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.evaluationRepo.listByStatus(ctx.schoolId, status);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} evaluations with status ${status}`, data: records });
  }

  async listEvaluationsByResult(ctx: RecoveryProgressCommandContext, result: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.evaluationRepo.listByResult(ctx.schoolId, result);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} evaluations with result ${result}`, data: records });
  }

  async markEvaluationReviewReady(ctx: RecoveryProgressCommandContext, evaluationId: string, reasonCode: string, safeMessage: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RECOVERY_CHECKPOINT_EVALUATION_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.evaluationRepo.getById(evaluationId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Evaluation not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.evaluationStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot review voided evaluation', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.evaluationRepo.updateStatus(evaluationId, 'review_ready', now);
    await this.evaluationRepo.update(evaluationId, { reviewReadyAt: now } as any);
    await this.auditBridge.recordCheckpointEvaluationReviewReady(ctx.schoolId, evaluationId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: evaluationId, status: 'review_ready', safeMessage: safeMessage || 'Evaluation review ready', reasonCode: reasonCode || 'EVALUATION_REVIEW_READY' });
  }

  async markEvaluationApprovedForFutureUse(ctx: RecoveryProgressCommandContext, evaluationId: string, reasonCode: string, safeMessage: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RECOVERY_CHECKPOINT_EVALUATION_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.evaluationRepo.getById(evaluationId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Evaluation not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.evaluationStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot approve voided evaluation', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.evaluationRepo.updateStatus(evaluationId, 'approved_for_future_use', now);
    await this.evaluationRepo.update(evaluationId, { approvedForFutureUseAt: now } as any);
    await this.auditBridge.recordCheckpointEvaluationApproved(ctx.schoolId, evaluationId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: evaluationId, status: 'approved_for_future_use', safeMessage: safeMessage || 'Evaluation approved', reasonCode: reasonCode || 'EVALUATION_APPROVED' });
  }

  async suppressEvaluation(ctx: RecoveryProgressCommandContext, evaluationId: string, reasonCode: string, safeMessage: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.evaluationRepo.getById(evaluationId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Evaluation not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.evaluationStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot suppress voided evaluation', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.evaluationRepo.updateStatus(evaluationId, 'suppressed', now);
    await this.evaluationRepo.update(evaluationId, { suppressedAt: now } as any);
    return this.envelope(ctx, { resourceId: evaluationId, status: 'suppressed', safeMessage: safeMessage || 'Evaluation suppressed', reasonCode: reasonCode || 'EVALUATION_SUPPRESSED' });
  }

  async blockEvaluation(ctx: RecoveryProgressCommandContext, evaluationId: string, reasonCode: string, safeMessage: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.evaluationRepo.getById(evaluationId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Evaluation not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.evaluationStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided evaluation', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.evaluationRepo.updateStatus(evaluationId, 'blocked', now);
    await this.evaluationRepo.update(evaluationId, { blockedAt: now } as any);
    return this.envelope(ctx, { resourceId: evaluationId, status: 'blocked', safeMessage: safeMessage || 'Evaluation blocked', reasonCode: reasonCode || 'EVALUATION_BLOCKED' });
  }

  async voidEvaluation(ctx: RecoveryProgressCommandContext, evaluationId: string, reasonCode: string, safeMessage: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.evaluationRepo.getById(evaluationId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Evaluation not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.evaluationStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.evaluationRepo.updateStatus(evaluationId, 'void', now);
    await this.evaluationRepo.update(evaluationId, { voidedAt: now } as any);
    return this.envelope(ctx, { resourceId: evaluationId, status: 'void', safeMessage: safeMessage || 'Evaluation voided', reasonCode: reasonCode || 'EVALUATION_VOIDED' });
  }
}

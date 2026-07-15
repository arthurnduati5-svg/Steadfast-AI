import { randomUUID } from 'crypto';
import type { RecoveryOutcomeCommandContext, RecoveryOutcomeSafeEnvelope, RecoveryExitCriteriaEvaluationResult } from '../contracts/recoveryOutcomeContracts';
import { RecoveryOutcomePolicyEnforcer } from '../policies/recoveryOutcomePolicyDefinitions';
import { RecoveryOutcomeSafetyService } from './recoveryOutcomeSafetyService';
import { RecoveryOutcomeIdempotencyService } from './recoveryOutcomeIdempotencyService';
import { RecoveryOutcomeAuditBridge } from './recoveryOutcomeAuditBridge';

export interface RecoveryExitCriteriaEvaluation {
  recoveryExitCriteriaEvaluationId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryExitCriteriaId: string;
  evaluationStatus: string;
  evaluationResult: RecoveryExitCriteriaEvaluationResult;
  safeEvaluationSummary: string;
  evaluationDetailsJson: Record<string, unknown>;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, unknown>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  reviewReadyAt?: string;
  approvedForFutureUseAt?: string;
  suppressedAt?: string;
  blockedAt?: string;
  voidedAt?: string;
}

export interface RecoveryExitCriteriaEvaluationCreateRequest {
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryExitCriteriaId: string;
  evaluationResult: RecoveryExitCriteriaEvaluationResult;
  safeEvaluationSummary: string;
  evaluationDetailsJson: Record<string, unknown>;
  sourceRefsJson: Record<string, unknown>;
}

export interface ExitCriteriaEvaluationRepository {
  create(data: RecoveryExitCriteriaEvaluation): Promise<RecoveryExitCriteriaEvaluation>;
  getById(id: string): Promise<RecoveryExitCriteriaEvaluation | null>;
  listBySchool(schoolId: string): Promise<RecoveryExitCriteriaEvaluation[]>;
  listByCriteriaId(schoolId: string, criteriaId: string): Promise<RecoveryExitCriteriaEvaluation[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryExitCriteriaEvaluation[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryExitCriteriaEvaluation[]>;
  listByResult(schoolId: string, result: string): Promise<RecoveryExitCriteriaEvaluation[]>;
  update(id: string, data: Partial<RecoveryExitCriteriaEvaluation>): Promise<RecoveryExitCriteriaEvaluation>;
  updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryExitCriteriaEvaluation>;
}

export class RecoveryExitCriteriaEvaluationService {
  private policyEnforcer = new RecoveryOutcomePolicyEnforcer();

  constructor(
    private evaluationRepo: ExitCriteriaEvaluationRepository,
    private safetyService: RecoveryOutcomeSafetyService,
    private auditBridge: RecoveryOutcomeAuditBridge,
    private idempotencyService: RecoveryOutcomeIdempotencyService,
  ) {}

  private envelope(ctx: RecoveryOutcomeCommandContext, overrides: Partial<RecoveryOutcomeSafeEnvelope>): RecoveryOutcomeSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createExitCriteriaEvaluation(ctx: RecoveryOutcomeCommandContext, input: RecoveryExitCriteriaEvaluationCreateRequest): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RECOVERY_EXIT_CRITERIA_EVALUATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });

    const schoolCheck = this.safetyService.assertSchoolContext(input.schoolId);
    if (!schoolCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: schoolCheck.safeMessage, reasonCode: schoolCheck.reasonCode, status: 'blocked' });

    const leakageCheck = this.safetyService.checkAllLeakageCategories(input.safeEvaluationSummary, input.sourceRefsJson);
    if (!leakageCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: leakageCheck.safeMessage, reasonCode: leakageCheck.reasonCode, status: 'blocked' });

    const sourceRefCheck = this.safetyService.assertSourceRefPresent(input.sourceRefsJson);
    if (!sourceRefCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: sourceRefCheck.safeMessage, reasonCode: sourceRefCheck.reasonCode, status: 'blocked' });

    const idempotencyKey = ctx.idempotencyKey || randomUUID();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createExitCriteriaEvaluation', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const now = new Date().toISOString();
    const record: RecoveryExitCriteriaEvaluation = {
      recoveryExitCriteriaEvaluationId: randomUUID(),
      schoolId: ctx.schoolId,
      studentRef: input.studentRef,
      resultRecoveryPlanId: input.resultRecoveryPlanId,
      recoveryExitCriteriaId: input.recoveryExitCriteriaId,
      evaluationStatus: 'draft',
      evaluationResult: input.evaluationResult,
      safeEvaluationSummary: input.safeEvaluationSummary,
      evaluationDetailsJson: input.evaluationDetailsJson,
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
    const created = await this.evaluationRepo.create(record);
    await this.idempotencyService.startOperation(ctx.schoolId, 'createExitCriteriaEvaluation', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createExitCriteriaEvaluation', idempotencyKey, 'RecoveryExitCriteriaEvaluation', created.recoveryExitCriteriaEvaluationId, 'Exit criteria evaluation created');
    await this.auditBridge.recordExitCriteriaEvaluationCreated(ctx.schoolId, created.recoveryExitCriteriaEvaluationId, ctx.actorId, ctx.actorRole, ctx.requestId, ctx.correlationId);
    return this.envelope(ctx, { resourceId: created.recoveryExitCriteriaEvaluationId, status: created.evaluationStatus, safeMessage: 'Exit criteria evaluation created', reasonCode: 'EVALUATION_CREATED', data: created });
  }

  async getExitCriteriaEvaluation(ctx: RecoveryOutcomeCommandContext, evaluationId: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.evaluationRepo.getById(evaluationId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Exit criteria evaluation not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: evaluationId, status: record.evaluationStatus, safeMessage: 'Exit criteria evaluation found', data: record });
  }

  async listEvaluationsForCriteria(ctx: RecoveryOutcomeCommandContext, criteriaId: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.evaluationRepo.listByCriteriaId(ctx.schoolId, criteriaId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} evaluations for criteria`, data: records });
  }

  async listEvaluationsForPlan(ctx: RecoveryOutcomeCommandContext, planId: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.evaluationRepo.listByPlanId(ctx.schoolId, planId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} evaluations for plan`, data: records });
  }

  async listEvaluationsForStudent(ctx: RecoveryOutcomeCommandContext, studentRef: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.evaluationRepo.listByStudentRef(ctx.schoolId, studentRef);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} evaluations for student`, data: records });
  }

  async listEvaluationsForSchool(ctx: RecoveryOutcomeCommandContext): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.evaluationRepo.listBySchool(ctx.schoolId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} evaluations for school`, data: records });
  }

  async listEvaluationsByResult(ctx: RecoveryOutcomeCommandContext, result: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.evaluationRepo.listByResult(ctx.schoolId, result);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} evaluations with result ${result}`, data: records });
  }

  async markEvaluationReviewReady(ctx: RecoveryOutcomeCommandContext, evaluationId: string, reasonCode?: string, safeMessage?: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RECOVERY_EXIT_CRITERIA_EVALUATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.evaluationRepo.getById(evaluationId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Evaluation not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.evaluationStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot review voided evaluation', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.evaluationRepo.updateStatus(evaluationId, 'review_ready', now);
    await this.evaluationRepo.update(evaluationId, { reviewReadyAt: now } as any);
    await this.auditBridge.recordExitCriteriaEvaluationReviewReady(ctx.schoolId, evaluationId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: evaluationId, status: 'review_ready', safeMessage: safeMessage || 'Evaluation review ready', reasonCode: reasonCode || 'EVALUATION_REVIEW_READY' });
  }

  async approveEvaluationForFutureUse(ctx: RecoveryOutcomeCommandContext, evaluationId: string, reasonCode?: string, safeMessage?: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RECOVERY_EXIT_CRITERIA_EVALUATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.evaluationRepo.getById(evaluationId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Evaluation not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.evaluationStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot approve voided evaluation', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.evaluationRepo.updateStatus(evaluationId, 'approved_for_future_use', now);
    await this.evaluationRepo.update(evaluationId, { approvedForFutureUseAt: now } as any);
    await this.auditBridge.recordExitCriteriaEvaluationApprovedForFutureUse(ctx.schoolId, evaluationId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: evaluationId, status: 'approved_for_future_use', safeMessage: safeMessage || 'Evaluation approved', reasonCode: reasonCode || 'EVALUATION_APPROVED' });
  }

  async suppressEvaluation(ctx: RecoveryOutcomeCommandContext, evaluationId: string, reasonCode?: string, safeMessage?: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.evaluationRepo.getById(evaluationId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Evaluation not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.evaluationStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot suppress voided evaluation', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.evaluationRepo.updateStatus(evaluationId, 'suppressed', now);
    await this.evaluationRepo.update(evaluationId, { suppressedAt: now } as any);
    return this.envelope(ctx, { resourceId: evaluationId, status: 'suppressed', safeMessage: safeMessage || 'Evaluation suppressed', reasonCode: reasonCode || 'EVALUATION_SUPPRESSED' });
  }

  async blockEvaluation(ctx: RecoveryOutcomeCommandContext, evaluationId: string, reasonCode?: string, safeMessage?: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.evaluationRepo.getById(evaluationId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Evaluation not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.evaluationStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided evaluation', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.evaluationRepo.updateStatus(evaluationId, 'blocked', now);
    await this.evaluationRepo.update(evaluationId, { blockedAt: now, blockedReasonCodesJson: reasonCode ? [reasonCode] : [] } as any);
    return this.envelope(ctx, { resourceId: evaluationId, status: 'blocked', safeMessage: safeMessage || 'Evaluation blocked', reasonCode: reasonCode || 'EVALUATION_BLOCKED' });
  }

  async voidEvaluation(ctx: RecoveryOutcomeCommandContext, evaluationId: string, reasonCode?: string, safeMessage?: string): Promise<RecoveryOutcomeSafeEnvelope> {
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

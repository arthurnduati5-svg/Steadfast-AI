import { randomUUID } from 'crypto';
import type { RecoveryProgressCommandContext, RecoveryProgressSafeEnvelope, RecoveryOutcomeEvidence } from '../contracts/recoveryProgressContracts';
import type { CreateOutcomeEvidenceRequest, UpdateOutcomeEvidenceRequest } from '../contracts/recoveryOutcomeEvidenceContracts';
import { RecoveryProgressPolicyEnforcer } from '../policies/recoveryProgressPolicyDefinitions';
import { RecoveryProgressSafetyService } from './recoveryProgressSafetyService';
import { RecoveryProgressIdempotencyService } from './recoveryProgressIdempotencyService';
import { RecoveryProgressAuditBridge } from './recoveryProgressAuditBridge';

export interface OutcomeEvidenceRepository {
  create(data: RecoveryOutcomeEvidence): Promise<RecoveryOutcomeEvidence>;
  getById(id: string): Promise<RecoveryOutcomeEvidence | null>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeEvidence[]>;
  listByObjectiveId(schoolId: string, objectiveId: string): Promise<RecoveryOutcomeEvidence[]>;
  listByObservationId(observationId: string): Promise<RecoveryOutcomeEvidence[]>;
  listByEvaluationId(evaluationId: string): Promise<RecoveryOutcomeEvidence[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeEvidence[]>;
  update(id: string, data: Partial<RecoveryOutcomeEvidence>): Promise<RecoveryOutcomeEvidence>;
  updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryOutcomeEvidence>;
}

export class RecoveryOutcomeEvidenceService {
  private policyEnforcer = new RecoveryProgressPolicyEnforcer();

  constructor(
    private evidenceRepo: OutcomeEvidenceRepository,
    private safetyService: RecoveryProgressSafetyService,
    private auditBridge: RecoveryProgressAuditBridge,
    private idempotencyService: RecoveryProgressIdempotencyService,
  ) {}

  private envelope(ctx: RecoveryProgressCommandContext, overrides: Partial<RecoveryProgressSafeEnvelope>): RecoveryProgressSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createEvidence(ctx: RecoveryProgressCommandContext, input: CreateOutcomeEvidenceRequest): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RECOVERY_OUTCOME_EVIDENCE_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });

    const safetyCheck = this.safetyService.assertEvaluationReferencesSafe(input as unknown as Record<string, unknown>);
    if (!safetyCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: safetyCheck.safeMessage, reasonCode: safetyCheck.reasonCode, status: 'blocked' });

    const idempotencyKey = ctx.idempotencyKey || randomUUID();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createEvidence', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const now = new Date().toISOString();
    const record: RecoveryOutcomeEvidence = {
      recoveryOutcomeEvidenceId: randomUUID(),
      schoolId: ctx.schoolId,
      studentRef: input.studentRef,
      resultRecoveryPlanId: input.resultRecoveryPlanId,
      resultRecoveryObjectiveId: input.resultRecoveryObjectiveId,
      recoveryProgressObservationId: input.recoveryProgressObservationId,
      recoveryCheckpointEvaluationId: input.recoveryCheckpointEvaluationId,
      evidenceStatus: 'draft',
      evidenceType: input.evidenceType as any,
      safeEvidenceSummary: input.safeEvidenceSummary,
      sourceEvidenceRefsJson: (input.sourceEvidenceRefsJson || {}) as Record<string, unknown>,
      learningObjectiveRefsJson: (input.learningObjectiveRefsJson || {}) as Record<string, unknown>,
      questionRefsJson: (input.questionRefsJson || {}) as Record<string, unknown>,
      resourceRefsJson: (input.resourceRefsJson || {}) as Record<string, unknown>,
      allowedAudienceJson: (input.allowedAudienceJson || {}) as Record<string, unknown>,
      blockedReasonCodesJson: input.blockedReasonCodesJson || [],
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
      createdAt: now,
      updatedAt: now,
      reviewReadyAt: undefined,
      approvedForFutureUseAt: undefined,
      suppressedAt: undefined,
      voidedAt: undefined,
    };
    const created = await this.evidenceRepo.create(record);
    await this.idempotencyService.startOperation(ctx.schoolId, 'createEvidence', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createEvidence', idempotencyKey, 'RecoveryOutcomeEvidence', created.recoveryOutcomeEvidenceId, 'Evidence created');
    await this.auditBridge.recordOutcomeEvidenceCreated(ctx.schoolId, created.recoveryOutcomeEvidenceId, ctx.actorId, ctx.actorRole, ctx.requestId, ctx.correlationId);
    return this.envelope(ctx, { resourceId: created.recoveryOutcomeEvidenceId, status: created.evidenceStatus, safeMessage: 'Outcome evidence created', reasonCode: 'EVIDENCE_CREATED', data: created });
  }

  async getEvidence(ctx: RecoveryProgressCommandContext, evidenceId: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.evidenceRepo.getById(evidenceId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Evidence not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: evidenceId, status: record.evidenceStatus, safeMessage: 'Evidence found', data: record });
  }

  async listEvidenceForPlan(ctx: RecoveryProgressCommandContext, planId: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.evidenceRepo.listByPlanId(ctx.schoolId, planId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} evidence records for plan`, data: records });
  }

  async listEvidenceForObjective(ctx: RecoveryProgressCommandContext, objectiveId: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.evidenceRepo.listByObjectiveId(ctx.schoolId, objectiveId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} evidence records for objective`, data: records });
  }

  async listEvidenceForObservation(ctx: RecoveryProgressCommandContext, observationId: string): Promise<RecoveryProgressSafeEnvelope> {
    const records = await this.evidenceRepo.listByObservationId(observationId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} evidence records for observation`, data: records });
  }

  async listEvidenceForEvaluation(ctx: RecoveryProgressCommandContext, evaluationId: string): Promise<RecoveryProgressSafeEnvelope> {
    const records = await this.evidenceRepo.listByEvaluationId(evaluationId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} evidence records for evaluation`, data: records });
  }

  async listEvidenceForStudent(ctx: RecoveryProgressCommandContext, studentRef: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.evidenceRepo.listByStudentRef(ctx.schoolId, studentRef);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} evidence records for student`, data: records });
  }

  async markEvidenceReviewReady(ctx: RecoveryProgressCommandContext, evidenceId: string, reasonCode: string, safeMessage: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RECOVERY_OUTCOME_EVIDENCE_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.evidenceRepo.getById(evidenceId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Evidence not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.evidenceStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot review voided evidence', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.evidenceRepo.updateStatus(evidenceId, 'review_ready', now);
    await this.evidenceRepo.update(evidenceId, { reviewReadyAt: now } as any);
    await this.auditBridge.recordOutcomeEvidenceReviewReady(ctx.schoolId, evidenceId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: evidenceId, status: 'review_ready', safeMessage: safeMessage || 'Evidence review ready', reasonCode: reasonCode || 'EVIDENCE_REVIEW_READY' });
  }

  async markEvidenceApprovedForFutureUse(ctx: RecoveryProgressCommandContext, evidenceId: string, reasonCode: string, safeMessage: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RECOVERY_OUTCOME_EVIDENCE_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.evidenceRepo.getById(evidenceId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Evidence not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.evidenceStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot approve voided evidence', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.evidenceRepo.updateStatus(evidenceId, 'approved_for_future_use', now);
    await this.evidenceRepo.update(evidenceId, { approvedForFutureUseAt: now } as any);
    await this.auditBridge.recordOutcomeEvidenceApproved(ctx.schoolId, evidenceId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: evidenceId, status: 'approved_for_future_use', safeMessage: safeMessage || 'Evidence approved', reasonCode: reasonCode || 'EVIDENCE_APPROVED' });
  }

  async suppressEvidence(ctx: RecoveryProgressCommandContext, evidenceId: string, reasonCode: string, safeMessage: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.evidenceRepo.getById(evidenceId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Evidence not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.evidenceStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot suppress voided evidence', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.evidenceRepo.updateStatus(evidenceId, 'suppressed', now);
    await this.evidenceRepo.update(evidenceId, { suppressedAt: now } as any);
    return this.envelope(ctx, { resourceId: evidenceId, status: 'suppressed', safeMessage: safeMessage || 'Evidence suppressed', reasonCode: reasonCode || 'EVIDENCE_SUPPRESSED' });
  }

  async voidEvidence(ctx: RecoveryProgressCommandContext, evidenceId: string, reasonCode: string, safeMessage: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.evidenceRepo.getById(evidenceId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Evidence not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.evidenceStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.evidenceRepo.updateStatus(evidenceId, 'void', now);
    await this.evidenceRepo.update(evidenceId, { voidedAt: now } as any);
    return this.envelope(ctx, { resourceId: evidenceId, status: 'void', safeMessage: safeMessage || 'Evidence voided', reasonCode: reasonCode || 'EVIDENCE_VOIDED' });
  }
}

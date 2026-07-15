import { randomUUID } from 'crypto';
import type { RecoveryProgressCommandContext, RecoveryProgressSafeEnvelope, RecoveryProgressObservation } from '../contracts/recoveryProgressContracts';
import type { CreateProgressObservationRequest, UpdateProgressObservationRequest } from '../contracts/recoveryProgressObservationContracts';
import { RecoveryProgressPolicyEnforcer } from '../policies/recoveryProgressPolicyDefinitions';
import { RecoveryProgressSafetyService } from './recoveryProgressSafetyService';
import { RecoveryProgressIdempotencyService } from './recoveryProgressIdempotencyService';
import { RecoveryProgressAuditBridge } from './recoveryProgressAuditBridge';

export interface ProgressObservationRepository {
  create(data: RecoveryProgressObservation): Promise<RecoveryProgressObservation>;
  getById(id: string): Promise<RecoveryProgressObservation | null>;
  listBySchool(schoolId: string): Promise<RecoveryProgressObservation[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryProgressObservation[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryProgressObservation[]>;
  listByCheckpointId(schoolId: string, checkpointId: string): Promise<RecoveryProgressObservation[]>;
  listByStatus(schoolId: string, status: string): Promise<RecoveryProgressObservation[]>;
  listByType(schoolId: string, type: string): Promise<RecoveryProgressObservation[]>;
  update(id: string, data: Partial<RecoveryProgressObservation>): Promise<RecoveryProgressObservation>;
  updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryProgressObservation>;
}

export class RecoveryProgressObservationService {
  private policyEnforcer = new RecoveryProgressPolicyEnforcer();

  constructor(
    private observationRepo: ProgressObservationRepository,
    private safetyService: RecoveryProgressSafetyService,
    private auditBridge: RecoveryProgressAuditBridge,
    private idempotencyService: RecoveryProgressIdempotencyService,
  ) {}

  private envelope(ctx: RecoveryProgressCommandContext, overrides: Partial<RecoveryProgressSafeEnvelope>): RecoveryProgressSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createObservation(ctx: RecoveryProgressCommandContext, input: CreateProgressObservationRequest): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RECOVERY_PROGRESS_OBSERVATION_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });

    const safetyCheck = this.safetyService.assertMockOnlyProgressOperation(input.observationMode || 'mock_observation_only');
    if (!safetyCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: safetyCheck.safeMessage, reasonCode: safetyCheck.reasonCode, status: 'blocked' });

    const fieldCheck = this.safetyService.assertObservationUsesReferencesOnly(input as unknown as Record<string, unknown>);
    if (!fieldCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: fieldCheck.safeMessage, reasonCode: fieldCheck.reasonCode, status: 'blocked' });

    const idempotencyKey = ctx.idempotencyKey || randomUUID();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createObservation', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const now = new Date().toISOString();
    const record: RecoveryProgressObservation = {
      recoveryProgressObservationId: randomUUID(),
      schoolId: ctx.schoolId,
      studentRef: input.studentRef,
      resultRecoveryPlanId: input.resultRecoveryPlanId,
      resultRecoveryObjectiveId: input.resultRecoveryObjectiveId,
      resultRecoveryStepId: input.resultRecoveryStepId,
      resultRecoveryCheckpointId: input.resultRecoveryCheckpointId,
      resultFollowUpCaseId: input.resultFollowUpCaseId,
      observationStatus: 'draft',
      observationMode: input.observationMode as any,
      observationType: input.observationType as any,
      observationConfidence: input.observationConfidence as any,
      safeObservationSummary: input.safeObservationSummary,
      sourceRefsJson: (input.sourceRefsJson || {}) as Record<string, unknown>,
      observedSignalsJson: (input.observedSignalsJson || {}) as Record<string, unknown>,
      allowedUseJson: (input.allowedUseJson || {}) as Record<string, unknown>,
      blockedUseJson: (input.blockedUseJson || {}) as Record<string, unknown>,
      blockedReasonCodesJson: input.blockedReasonCodesJson || [],
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
      createdAt: now,
      updatedAt: now,
      recoveryProgressSummaryId: undefined,
      recordedAt: now,
      reviewReadyAt: undefined,
      approvedForFutureUseAt: undefined,
      suppressedAt: undefined,
      blockedAt: undefined,
      voidedAt: undefined,
    };
    const created = await this.observationRepo.create(record);
    await this.idempotencyService.startOperation(ctx.schoolId, 'createObservation', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createObservation', idempotencyKey, 'RecoveryProgressObservation', created.recoveryProgressObservationId, 'Observation created');
    await this.auditBridge.recordObservationCreated(ctx.schoolId, created.recoveryProgressObservationId, ctx.actorId, ctx.actorRole, ctx.requestId, ctx.correlationId);
    return this.envelope(ctx, { resourceId: created.recoveryProgressObservationId, status: created.observationStatus, safeMessage: 'Observation created', reasonCode: 'OBSERVATION_CREATED', data: created });
  }

  async getObservation(ctx: RecoveryProgressCommandContext, observationId: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.observationRepo.getById(observationId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Observation not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: observationId, status: record.observationStatus, safeMessage: 'Observation found', data: record });
  }

  async listObservationsForSchool(ctx: RecoveryProgressCommandContext): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.observationRepo.listBySchool(ctx.schoolId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} observations for school`, data: records });
  }

  async listObservationsForStudent(ctx: RecoveryProgressCommandContext, studentRef: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.observationRepo.listByStudentRef(ctx.schoolId, studentRef);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} observations for student`, data: records });
  }

  async listObservationsForPlan(ctx: RecoveryProgressCommandContext, planId: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.observationRepo.listByPlanId(ctx.schoolId, planId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} observations for plan`, data: records });
  }

  async listObservationsForCheckpoint(ctx: RecoveryProgressCommandContext, checkpointId: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.observationRepo.listByCheckpointId(ctx.schoolId, checkpointId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} observations for checkpoint`, data: records });
  }

  async listObservationsByStatus(ctx: RecoveryProgressCommandContext, status: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.observationRepo.listByStatus(ctx.schoolId, status);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} observations with status ${status}`, data: records });
  }

  async listObservationsByType(ctx: RecoveryProgressCommandContext, type: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.observationRepo.listByType(ctx.schoolId, type);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} observations of type ${type}`, data: records });
  }

  async markObservationReviewReady(ctx: RecoveryProgressCommandContext, observationId: string, reasonCode: string, safeMessage: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RECOVERY_PROGRESS_OBSERVATION_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.observationRepo.getById(observationId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Observation not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.observationStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot review voided observation', reasonCode: 'INVALID_STATUS', status: 'error' });

    const idempotencyKey = ctx.idempotencyKey || randomUUID();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'markObservationReviewReady', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const now = new Date().toISOString();
    await this.observationRepo.updateStatus(observationId, 'review_ready', now);
    await this.observationRepo.update(observationId, { reviewReadyAt: now } as any);
    await this.idempotencyService.startOperation(ctx.schoolId, 'markObservationReviewReady', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'markObservationReviewReady', idempotencyKey, 'RecoveryProgressObservation', observationId, 'Observation review ready');
    await this.auditBridge.recordObservationReviewReady(ctx.schoolId, observationId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: observationId, status: 'review_ready', safeMessage: safeMessage || 'Observation review ready', reasonCode: reasonCode || 'OBSERVATION_REVIEW_READY' });
  }

  async markObservationApprovedForFutureUse(ctx: RecoveryProgressCommandContext, observationId: string, reasonCode: string, safeMessage: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RECOVERY_PROGRESS_OBSERVATION_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.observationRepo.getById(observationId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Observation not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.observationStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot approve voided observation', reasonCode: 'INVALID_STATUS', status: 'error' });

    const now = new Date().toISOString();
    await this.observationRepo.updateStatus(observationId, 'approved_for_future_use', now);
    await this.observationRepo.update(observationId, { approvedForFutureUseAt: now } as any);
    await this.auditBridge.recordObservationApprovedForFutureUse(ctx.schoolId, observationId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: observationId, status: 'approved_for_future_use', safeMessage: safeMessage || 'Observation approved', reasonCode: reasonCode || 'OBSERVATION_APPROVED' });
  }

  async suppressObservation(ctx: RecoveryProgressCommandContext, observationId: string, reasonCode: string, safeMessage: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.observationRepo.getById(observationId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Observation not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.observationStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot suppress voided observation', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.observationRepo.updateStatus(observationId, 'suppressed', now);
    await this.observationRepo.update(observationId, { suppressedAt: now } as any);
    return this.envelope(ctx, { resourceId: observationId, status: 'suppressed', safeMessage: safeMessage || 'Observation suppressed', reasonCode: reasonCode || 'OBSERVATION_SUPPRESSED' });
  }

  async blockObservation(ctx: RecoveryProgressCommandContext, observationId: string, reasonCode: string, safeMessage: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.observationRepo.getById(observationId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Observation not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.observationStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided observation', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.observationRepo.updateStatus(observationId, 'blocked', now);
    await this.observationRepo.update(observationId, { blockedAt: now } as any);
    return this.envelope(ctx, { resourceId: observationId, status: 'blocked', safeMessage: safeMessage || 'Observation blocked', reasonCode: reasonCode || 'OBSERVATION_BLOCKED' });
  }

  async voidObservation(ctx: RecoveryProgressCommandContext, observationId: string, reasonCode: string, safeMessage: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.observationRepo.getById(observationId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Observation not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.observationStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.observationRepo.updateStatus(observationId, 'void', now);
    await this.observationRepo.update(observationId, { voidedAt: now } as any);
    return this.envelope(ctx, { resourceId: observationId, status: 'void', safeMessage: safeMessage || 'Observation voided', reasonCode: reasonCode || 'OBSERVATION_VOIDED' });
  }
}

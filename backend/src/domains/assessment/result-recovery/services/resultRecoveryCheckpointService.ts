import { randomUUID } from 'crypto';
import type { ResultRecoveryCommandContext, ResultRecoverySafeEnvelope } from '../contracts/resultRecoveryContracts';
import { ResultRecoveryPolicyEnforcer } from '../policies/resultRecoveryPolicyDefinitions';
import { ResultRecoverySafetyService } from './resultRecoverySafetyService';
import { ResultRecoveryIdempotencyService } from './resultRecoveryIdempotencyService';
import { ResultRecoveryAuditBridge } from './resultRecoveryAuditBridge';

export interface CheckpointInput {
  resultRecoveryPlanId: string;
  studentRef: string;
  safeCheckpointSummary: string;
  scheduledDate?: string;
  checkpointType?: string;
  successCriteriaJson?: Record<string, unknown>;
}

export interface Checkpoint {
  resultRecoveryCheckpointId: string;
  schoolId: string;
  resultRecoveryPlanId: string;
  studentRef: string;
  checkpointStatus: string;
  checkpointType: string | null;
  safeCheckpointSummary: string;
  scheduledDate: string | null;
  successCriteriaJson: Record<string, unknown> | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  scheduledMockAt: string | null;
  completedMockAt: string | null;
  cancelledAt: string | null;
  voidedAt: string | null;
}

export interface CheckpointPreview {
  resultRecoveryCheckpointId: string;
  resultRecoveryPlanId: string;
  studentRef: string;
  checkpointStatus: string;
  safeCheckpointSummary: string;
  scheduledDate: string | null;
  createdAt: string;
}

export interface CheckpointRepository {
  create(input: CheckpointInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<Checkpoint>;
  getById(checkpointId: string): Promise<Checkpoint | null>;
  listByPlanId(planId: string): Promise<CheckpointPreview[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<CheckpointPreview[]>;
  update(checkpointId: string, data: Partial<Checkpoint>): Promise<Checkpoint>;
  updateStatus(checkpointId: string, checkpointStatus: string, reasonCode: string, safeMessage: string): Promise<Checkpoint>;
  scheduleMock(checkpointId: string): Promise<Checkpoint>;
  completeMock(checkpointId: string): Promise<Checkpoint>;
  cancel(checkpointId: string, reasonCode: string, safeMessage: string): Promise<Checkpoint>;
  void(checkpointId: string, reasonCode: string, safeMessage: string): Promise<Checkpoint>;
}

export class ResultRecoveryCheckpointService {
  private policyEnforcer = new ResultRecoveryPolicyEnforcer();

  constructor(
    private checkpointRepo: CheckpointRepository,
    private safetyService: ResultRecoverySafetyService,
    private auditBridge: ResultRecoveryAuditBridge,
    private idempotencyService: ResultRecoveryIdempotencyService,
  ) {}

  private envelope(ctx: ResultRecoveryCommandContext, overrides: Partial<ResultRecoverySafeEnvelope>): ResultRecoverySafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createRecoveryCheckpoint(ctx: ResultRecoveryCommandContext, input: CheckpointInput): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RESULT_RECOVERY_CHECKPOINT_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });

    const idempotencyKey = ctx.idempotencyKey || randomUUID();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createRecoveryCheckpoint', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const createInput: CheckpointInput & { schoolId: string; createdByActorId: string; createdByRole: string } = {
      ...input,
      schoolId: ctx.schoolId,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    };
    const record = await this.checkpointRepo.create(createInput);
    await this.idempotencyService.startOperation(ctx.schoolId, 'createRecoveryCheckpoint', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createRecoveryCheckpoint', idempotencyKey, 'Checkpoint', record.resultRecoveryCheckpointId, 'Recovery checkpoint created');
    await this.auditBridge.recordCheckpointCreated(ctx.schoolId, record.resultRecoveryPlanId, record.resultRecoveryCheckpointId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: record.resultRecoveryCheckpointId, status: record.checkpointStatus, safeMessage: 'Recovery checkpoint created', reasonCode: 'CHECKPOINT_CREATED', data: record });
  }

  async getRecoveryCheckpoint(ctx: ResultRecoveryCommandContext, checkpointId: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.checkpointRepo.getById(checkpointId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Recovery checkpoint not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: checkpointId, status: record.checkpointStatus, safeMessage: 'Recovery checkpoint found', data: record });
  }

  async listCheckpointsForPlan(ctx: ResultRecoveryCommandContext, planId: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.checkpointRepo.listByPlanId(planId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} checkpoints for plan`, data: records });
  }

  async listCheckpointsForStudent(ctx: ResultRecoveryCommandContext, studentRef: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.checkpointRepo.listByStudentRef(ctx.schoolId, studentRef);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} checkpoints for student`, data: records });
  }

  async scheduleCheckpointMock(ctx: ResultRecoveryCommandContext, checkpointId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RESULT_RECOVERY_CHECKPOINT_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.checkpointRepo.getById(checkpointId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Recovery checkpoint not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.checkpointStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot schedule voided checkpoint', reasonCode: 'INVALID_STATUS', status: 'error' });

    const idempotencyKey = ctx.idempotencyKey || randomUUID();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'scheduleCheckpointMock', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    await this.checkpointRepo.scheduleMock(checkpointId);
    await this.idempotencyService.startOperation(ctx.schoolId, 'scheduleCheckpointMock', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'scheduleCheckpointMock', idempotencyKey, 'Checkpoint', checkpointId, 'Checkpoint scheduled mock');
    await this.auditBridge.recordCheckpointScheduledMock(ctx.schoolId, record.resultRecoveryPlanId, checkpointId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: checkpointId, status: 'scheduled_mock', safeMessage: safeMessage || 'Checkpoint scheduled mock', reasonCode: reasonCode || 'CHECKPOINT_SCHEDULED_MOCK' });
  }

  async completeCheckpointMock(ctx: ResultRecoveryCommandContext, checkpointId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.checkpointRepo.getById(checkpointId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Recovery checkpoint not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.checkpointStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot complete voided checkpoint', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.checkpointRepo.completeMock(checkpointId);
    return this.envelope(ctx, { resourceId: checkpointId, status: 'completed_mock', safeMessage: safeMessage || 'Checkpoint completed mock', reasonCode: reasonCode || 'CHECKPOINT_COMPLETED_MOCK' });
  }

  async cancelCheckpoint(ctx: ResultRecoveryCommandContext, checkpointId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.checkpointRepo.getById(checkpointId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Recovery checkpoint not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.checkpointStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot cancel voided checkpoint', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.checkpointRepo.cancel(checkpointId, reasonCode || 'CANCELLED', safeMessage || 'Checkpoint cancelled');
    return this.envelope(ctx, { resourceId: checkpointId, status: 'cancelled', safeMessage: safeMessage || 'Checkpoint cancelled', reasonCode: reasonCode || 'CHECKPOINT_CANCELLED' });
  }

  async voidCheckpoint(ctx: ResultRecoveryCommandContext, checkpointId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.checkpointRepo.getById(checkpointId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Recovery checkpoint not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.checkpointStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.checkpointRepo.void(checkpointId, reasonCode || 'VOIDED', safeMessage || 'Checkpoint voided');
    return this.envelope(ctx, { resourceId: checkpointId, status: 'void', safeMessage: safeMessage || 'Checkpoint voided', reasonCode: reasonCode || 'CHECKPOINT_VOIDED' });
  }
}

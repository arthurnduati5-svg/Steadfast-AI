import { randomUUID } from 'crypto';
import type { ResultRecoveryCommandContext, ResultRecoverySafeEnvelope, ResultRecoveryObjectiveType } from '../contracts/resultRecoveryContracts';
import type { CreateRecoveryObjectiveInput, ResultRecoveryObjective, ResultRecoveryObjectivePreview } from '../contracts/resultRecoveryObjectiveContracts';
import { ResultRecoveryPolicyEnforcer } from '../policies/resultRecoveryPolicyDefinitions';
import { ResultRecoverySafetyService } from './resultRecoverySafetyService';
import { ResultRecoveryIdempotencyService } from './resultRecoveryIdempotencyService';
import { ResultRecoveryAuditBridge } from './resultRecoveryAuditBridge';

export interface RecoveryObjectiveRepository {
  create(input: CreateRecoveryObjectiveInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultRecoveryObjective>;
  getById(objectiveId: string): Promise<ResultRecoveryObjective | null>;
  listByPlanId(planId: string): Promise<ResultRecoveryObjectivePreview[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<ResultRecoveryObjectivePreview[]>;
  listByType(schoolId: string, type: ResultRecoveryObjectiveType | string): Promise<ResultRecoveryObjectivePreview[]>;
  listByStatus(schoolId: string, status: string): Promise<ResultRecoveryObjectivePreview[]>;
  update(objectiveId: string, data: Partial<ResultRecoveryObjective>): Promise<ResultRecoveryObjective>;
  updateStatus(objectiveId: string, objectiveStatus: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryObjective>;
  markReady(objectiveId: string): Promise<ResultRecoveryObjective>;
  completeMock(objectiveId: string): Promise<ResultRecoveryObjective>;
  suppress(objectiveId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryObjective>;
  void(objectiveId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryObjective>;
}

export class ResultRecoveryObjectiveService {
  private policyEnforcer = new ResultRecoveryPolicyEnforcer();

  constructor(
    private objectiveRepo: RecoveryObjectiveRepository,
    private safetyService: ResultRecoverySafetyService,
    private auditBridge: ResultRecoveryAuditBridge,
    private idempotencyService: ResultRecoveryIdempotencyService,
  ) {}

  private envelope(ctx: ResultRecoveryCommandContext, overrides: Partial<ResultRecoverySafeEnvelope>): ResultRecoverySafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createRecoveryObjective(ctx: ResultRecoveryCommandContext, input: Omit<CreateRecoveryObjectiveInput, 'schoolId' | 'createdByActorId' | 'createdByRole'>): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RESULT_RECOVERY_OBJECTIVE_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });

    const idempotencyKey = ctx.idempotencyKey || randomUUID();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createRecoveryObjective', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const createInput: CreateRecoveryObjectiveInput & { schoolId: string; createdByActorId: string; createdByRole: string } = {
      ...input,
      schoolId: ctx.schoolId,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    };
    const record = await this.objectiveRepo.create(createInput);
    await this.idempotencyService.startOperation(ctx.schoolId, 'createRecoveryObjective', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createRecoveryObjective', idempotencyKey, 'ResultRecoveryObjective', record.resultRecoveryObjectiveId, 'Recovery objective created');
    await this.auditBridge.recordRecoveryObjectiveCreated(ctx.schoolId, record.resultRecoveryPlanId, record.resultRecoveryObjectiveId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: record.resultRecoveryObjectiveId, status: record.objectiveStatus, safeMessage: 'Recovery objective created', reasonCode: 'OBJECTIVE_CREATED', data: record });
  }

  async getRecoveryObjective(ctx: ResultRecoveryCommandContext, objectiveId: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.objectiveRepo.getById(objectiveId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Recovery objective not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: objectiveId, status: record.objectiveStatus, safeMessage: 'Recovery objective found', data: record });
  }

  async listObjectivesForPlan(ctx: ResultRecoveryCommandContext, planId: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.objectiveRepo.listByPlanId(planId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} objectives for plan`, data: records });
  }

  async listObjectivesForStudent(ctx: ResultRecoveryCommandContext, studentRef: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.objectiveRepo.listByStudentRef(ctx.schoolId, studentRef);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} objectives for student`, data: records });
  }

  async listObjectivesByType(ctx: ResultRecoveryCommandContext, type: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.objectiveRepo.listByType(ctx.schoolId, type);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} objectives with type ${type}`, data: records });
  }

  async listObjectivesByStatus(ctx: ResultRecoveryCommandContext, status: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.objectiveRepo.listByStatus(ctx.schoolId, status);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} objectives with status ${status}`, data: records });
  }

  async markObjectiveReady(ctx: ResultRecoveryCommandContext, objectiveId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RESULT_RECOVERY_OBJECTIVE_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.objectiveRepo.getById(objectiveId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Recovery objective not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.objectiveStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot mark voided objective as ready', reasonCode: 'INVALID_STATUS', status: 'error' });

    const idempotencyKey = ctx.idempotencyKey || randomUUID();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'markObjectiveReady', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    await this.objectiveRepo.markReady(objectiveId);
    await this.idempotencyService.startOperation(ctx.schoolId, 'markObjectiveReady', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'markObjectiveReady', idempotencyKey, 'ResultRecoveryObjective', objectiveId, 'Recovery objective ready');
    return this.envelope(ctx, { resourceId: objectiveId, status: 'ready', safeMessage: safeMessage || 'Recovery objective ready', reasonCode: reasonCode || 'OBJECTIVE_READY' });
  }

  async completeObjectiveMock(ctx: ResultRecoveryCommandContext, objectiveId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.objectiveRepo.getById(objectiveId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Recovery objective not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.objectiveStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot complete voided objective', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.objectiveRepo.completeMock(objectiveId);
    return this.envelope(ctx, { resourceId: objectiveId, status: 'completed_mock', safeMessage: safeMessage || 'Recovery objective completed mock', reasonCode: reasonCode || 'OBJECTIVE_COMPLETED_MOCK' });
  }

  async suppressObjective(ctx: ResultRecoveryCommandContext, objectiveId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.objectiveRepo.getById(objectiveId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Recovery objective not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.objectiveStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot suppress voided objective', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.objectiveRepo.suppress(objectiveId, reasonCode || 'SUPPRESSED', safeMessage || 'Recovery objective suppressed');
    return this.envelope(ctx, { resourceId: objectiveId, status: 'suppressed', safeMessage: safeMessage || 'Recovery objective suppressed', reasonCode: reasonCode || 'OBJECTIVE_SUPPRESSED' });
  }

  async voidObjective(ctx: ResultRecoveryCommandContext, objectiveId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.objectiveRepo.getById(objectiveId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Recovery objective not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.objectiveStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.objectiveRepo.void(objectiveId, reasonCode || 'VOIDED', safeMessage || 'Recovery objective voided');
    return this.envelope(ctx, { resourceId: objectiveId, status: 'void', safeMessage: safeMessage || 'Recovery objective voided', reasonCode: reasonCode || 'OBJECTIVE_VOIDED' });
  }
}

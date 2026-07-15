import { randomUUID } from 'crypto';
import type { RecoveryProgressCommandContext, RecoveryProgressSafeEnvelope, RecoveryEvidenceRollup } from '../contracts/recoveryProgressContracts';
import type { CreateEvidenceRollupRequest, UpdateEvidenceRollupRequest } from '../contracts/recoveryEvidenceRollupContracts';
import { RecoveryProgressPolicyEnforcer } from '../policies/recoveryProgressPolicyDefinitions';
import { RecoveryProgressSafetyService } from './recoveryProgressSafetyService';
import { RecoveryProgressIdempotencyService } from './recoveryProgressIdempotencyService';
import { RecoveryProgressAuditBridge } from './recoveryProgressAuditBridge';

export interface EvidenceRollupRepository {
  create(data: RecoveryEvidenceRollup): Promise<RecoveryEvidenceRollup>;
  getById(id: string): Promise<RecoveryEvidenceRollup | null>;
  listBySchool(schoolId: string): Promise<RecoveryEvidenceRollup[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryEvidenceRollup[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryEvidenceRollup[]>;
  listByScope(schoolId: string, scope: string): Promise<RecoveryEvidenceRollup[]>;
  update(id: string, data: Partial<RecoveryEvidenceRollup>): Promise<RecoveryEvidenceRollup>;
  updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryEvidenceRollup>;
}

export class RecoveryEvidenceRollupService {
  private policyEnforcer = new RecoveryProgressPolicyEnforcer();

  constructor(
    private rollupRepo: EvidenceRollupRepository,
    private safetyService: RecoveryProgressSafetyService,
    private auditBridge: RecoveryProgressAuditBridge,
    private idempotencyService: RecoveryProgressIdempotencyService,
  ) {}

  private envelope(ctx: RecoveryProgressCommandContext, overrides: Partial<RecoveryProgressSafeEnvelope>): RecoveryProgressSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createRollup(ctx: RecoveryProgressCommandContext, input: CreateEvidenceRollupRequest): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RECOVERY_EVIDENCE_ROLLUP_MUTATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });

    const idempotencyKey = ctx.idempotencyKey || randomUUID();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createRollup', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const now = new Date().toISOString();
    const record: RecoveryEvidenceRollup = {
      recoveryEvidenceRollupId: randomUUID(),
      schoolId: ctx.schoolId,
      studentRef: input.studentRef,
      resultRecoveryPlanId: input.resultRecoveryPlanId,
      rollupStatus: 'draft',
      rollupScope: input.rollupScope as any,
      safeRollupSummary: input.safeRollupSummary,
      observationCountsJson: (input.observationCountsJson || {}) as Record<string, unknown>,
      evaluationCountsJson: (input.evaluationCountsJson || {}) as Record<string, unknown>,
      evidenceCountsJson: (input.evidenceCountsJson || {}) as Record<string, unknown>,
      adjustmentCountsJson: (input.adjustmentCountsJson || {}) as Record<string, unknown>,
      sourceRefsJson: (input.sourceRefsJson || {}) as Record<string, unknown>,
      blockedReasonCodesJson: input.blockedReasonCodesJson || [],
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
      createdAt: now,
      updatedAt: now,
      refreshedAt: now,
      suppressedAt: undefined,
      blockedAt: undefined,
      voidedAt: undefined,
    };
    const created = await this.rollupRepo.create(record);
    await this.idempotencyService.startOperation(ctx.schoolId, 'createRollup', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createRollup', idempotencyKey, 'RecoveryEvidenceRollup', created.recoveryEvidenceRollupId, 'Evidence rollup created');
    await this.auditBridge.recordEvidenceRollupCreated(ctx.schoolId, created.recoveryEvidenceRollupId, ctx.actorId, ctx.actorRole, ctx.requestId, ctx.correlationId);
    return this.envelope(ctx, { resourceId: created.recoveryEvidenceRollupId, status: created.rollupStatus, safeMessage: 'Evidence rollup created', reasonCode: 'ROLLUP_CREATED', data: created });
  }

  async getRollup(ctx: RecoveryProgressCommandContext, rollupId: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.rollupRepo.getById(rollupId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Evidence rollup not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: rollupId, status: record.rollupStatus, safeMessage: 'Evidence rollup found', data: record });
  }

  async listRollupsForSchool(ctx: RecoveryProgressCommandContext): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.rollupRepo.listBySchool(ctx.schoolId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} rollups for school`, data: records });
  }

  async listRollupsForStudent(ctx: RecoveryProgressCommandContext, studentRef: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.rollupRepo.listByStudentRef(ctx.schoolId, studentRef);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} rollups for student`, data: records });
  }

  async listRollupsForPlan(ctx: RecoveryProgressCommandContext, planId: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.rollupRepo.listByPlanId(ctx.schoolId, planId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} rollups for plan`, data: records });
  }

  async listRollupsByScope(ctx: RecoveryProgressCommandContext, scope: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.rollupRepo.listByScope(ctx.schoolId, scope);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} rollups with scope ${scope}`, data: records });
  }

  async refreshRollup(ctx: RecoveryProgressCommandContext, rollupId: string, reasonCode: string, safeMessage: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RECOVERY_EVIDENCE_ROLLUP_MUTATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.rollupRepo.getById(rollupId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Rollup not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.rollupStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot refresh voided rollup', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.rollupRepo.update(rollupId, { refreshedAt: now } as any);
    await this.auditBridge.recordEvidenceRollupRefreshed(ctx.schoolId, rollupId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: rollupId, status: record.rollupStatus, safeMessage: safeMessage || 'Rollup refreshed', reasonCode: reasonCode || 'ROLLUP_REFRESHED' });
  }

  async suppressRollup(ctx: RecoveryProgressCommandContext, rollupId: string, reasonCode: string, safeMessage: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.rollupRepo.getById(rollupId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Rollup not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.rollupStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot suppress voided rollup', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.rollupRepo.updateStatus(rollupId, 'suppressed', now);
    await this.rollupRepo.update(rollupId, { suppressedAt: now } as any);
    return this.envelope(ctx, { resourceId: rollupId, status: 'suppressed', safeMessage: safeMessage || 'Rollup suppressed', reasonCode: reasonCode || 'ROLLUP_SUPPRESSED' });
  }

  async blockRollup(ctx: RecoveryProgressCommandContext, rollupId: string, reasonCode: string, safeMessage: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.rollupRepo.getById(rollupId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Rollup not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.rollupStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided rollup', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.rollupRepo.updateStatus(rollupId, 'blocked', now);
    await this.rollupRepo.update(rollupId, { blockedAt: now } as any);
    return this.envelope(ctx, { resourceId: rollupId, status: 'blocked', safeMessage: safeMessage || 'Rollup blocked', reasonCode: reasonCode || 'ROLLUP_BLOCKED' });
  }

  async voidRollup(ctx: RecoveryProgressCommandContext, rollupId: string, reasonCode: string, safeMessage: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.rollupRepo.getById(rollupId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Rollup not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.rollupStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.rollupRepo.updateStatus(rollupId, 'void', now);
    await this.rollupRepo.update(rollupId, { voidedAt: now } as any);
    return this.envelope(ctx, { resourceId: rollupId, status: 'void', safeMessage: safeMessage || 'Rollup voided', reasonCode: reasonCode || 'ROLLUP_VOIDED' });
  }
}

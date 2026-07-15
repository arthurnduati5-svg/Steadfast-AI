import { randomUUID } from 'crypto';
import type { RecoveryOutcomeCommandContext, RecoveryOutcomeSafeEnvelope } from '../contracts/recoveryOutcomeContracts';
import type { RecoveryOutcomeDecisionReadiness, RecoveryOutcomeDecisionReadinessCreateRequest } from '../contracts/recoveryOutcomeDecisionReadinessContracts';
import { RecoveryOutcomePolicyEnforcer } from '../policies/recoveryOutcomePolicyDefinitions';
import { RecoveryOutcomeSafetyService } from './recoveryOutcomeSafetyService';
import { RecoveryOutcomeIdempotencyService } from './recoveryOutcomeIdempotencyService';
import { RecoveryOutcomeAuditBridge } from './recoveryOutcomeAuditBridge';

export interface DecisionReadinessRepository {
  create(data: RecoveryOutcomeDecisionReadiness): Promise<RecoveryOutcomeDecisionReadiness>;
  getById(id: string): Promise<RecoveryOutcomeDecisionReadiness | null>;
  listBySchool(schoolId: string): Promise<RecoveryOutcomeDecisionReadiness[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeDecisionReadiness[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeDecisionReadiness[]>;
  listByStatus(schoolId: string, status: string): Promise<RecoveryOutcomeDecisionReadiness[]>;
  update(id: string, data: Partial<RecoveryOutcomeDecisionReadiness>): Promise<RecoveryOutcomeDecisionReadiness>;
  updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryOutcomeDecisionReadiness>;
}

export class RecoveryOutcomeDecisionReadinessService {
  private policyEnforcer = new RecoveryOutcomePolicyEnforcer();

  constructor(
    private readinessRepo: DecisionReadinessRepository,
    private safetyService: RecoveryOutcomeSafetyService,
    private auditBridge: RecoveryOutcomeAuditBridge,
    private idempotencyService: RecoveryOutcomeIdempotencyService,
  ) {}

  private envelope(ctx: RecoveryOutcomeCommandContext, overrides: Partial<RecoveryOutcomeSafeEnvelope>): RecoveryOutcomeSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createDecisionReadiness(ctx: RecoveryOutcomeCommandContext, input: RecoveryOutcomeDecisionReadinessCreateRequest): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RECOVERY_OUTCOME_DECISION_READINESS_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });

    const schoolCheck = this.safetyService.assertSchoolContext(input.schoolId);
    if (!schoolCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: schoolCheck.safeMessage, reasonCode: schoolCheck.reasonCode, status: 'blocked' });

    const leakageCheck = this.safetyService.checkAllLeakageCategories(input.safeReadinessSummary, input.sourceRefsJson);
    if (!leakageCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: leakageCheck.safeMessage, reasonCode: leakageCheck.reasonCode, status: 'blocked' });

    const sourceRefCheck = this.safetyService.assertSourceRefPresent(input.sourceRefsJson);
    if (!sourceRefCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: sourceRefCheck.safeMessage, reasonCode: sourceRefCheck.reasonCode, status: 'blocked' });

    const idempotencyKey = ctx.idempotencyKey || randomUUID();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createDecisionReadiness', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const now = new Date().toISOString();
    const record: RecoveryOutcomeDecisionReadiness = {
      recoveryOutcomeDecisionReadinessId: randomUUID(),
      schoolId: ctx.schoolId,
      studentRef: input.studentRef,
      resultRecoveryPlanId: input.resultRecoveryPlanId,
      recoveryProgressSummaryId: input.recoveryProgressSummaryId,
      recoveryEvidenceRollupId: input.recoveryEvidenceRollupId,
      readinessStatus: 'draft',
      safeReadinessSummary: input.safeReadinessSummary,
      readinessChecksJson: input.readinessChecksJson,
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
    const created = await this.readinessRepo.create(record);
    const idempotencyEntry = await this.idempotencyService.startOperation(ctx.schoolId, 'createDecisionReadiness', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createDecisionReadiness', idempotencyKey, 'RecoveryOutcomeDecisionReadiness', created.recoveryOutcomeDecisionReadinessId, 'Decision readiness created');
    await this.auditBridge.recordDecisionReadinessCreated(ctx.schoolId, created.recoveryOutcomeDecisionReadinessId, ctx.actorId, ctx.actorRole, ctx.requestId, ctx.correlationId);
    return this.envelope(ctx, { resourceId: created.recoveryOutcomeDecisionReadinessId, status: created.readinessStatus, safeMessage: 'Decision readiness created', reasonCode: 'READINESS_CREATED', data: created });
  }

  async getDecisionReadiness(ctx: RecoveryOutcomeCommandContext, readinessId: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.readinessRepo.getById(readinessId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Decision readiness not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: readinessId, status: record.readinessStatus, safeMessage: 'Decision readiness found', data: record });
  }

  async listDecisionReadinessForSchool(ctx: RecoveryOutcomeCommandContext): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.readinessRepo.listBySchool(ctx.schoolId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} decision readiness records for school`, data: records });
  }

  async listDecisionReadinessForStudent(ctx: RecoveryOutcomeCommandContext, studentRef: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.readinessRepo.listByStudentRef(ctx.schoolId, studentRef);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} decision readiness records for student`, data: records });
  }

  async listDecisionReadinessForPlan(ctx: RecoveryOutcomeCommandContext, planId: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.readinessRepo.listByPlanId(ctx.schoolId, planId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} decision readiness records for plan`, data: records });
  }

  async listDecisionReadinessByStatus(ctx: RecoveryOutcomeCommandContext, status: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.readinessRepo.listByStatus(ctx.schoolId, status);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} decision readiness records with status ${status}`, data: records });
  }

  async markDecisionReadinessReviewReady(ctx: RecoveryOutcomeCommandContext, readinessId: string, reasonCode?: string, safeMessage?: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RECOVERY_OUTCOME_DECISION_READINESS_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.readinessRepo.getById(readinessId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Decision readiness not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.readinessStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot review voided decision readiness', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.readinessRepo.updateStatus(readinessId, 'review_ready', now);
    await this.readinessRepo.update(readinessId, { reviewReadyAt: now } as any);
    await this.auditBridge.recordDecisionReadinessReviewReady(ctx.schoolId, readinessId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: readinessId, status: 'review_ready', safeMessage: safeMessage || 'Decision readiness review ready', reasonCode: reasonCode || 'READINESS_REVIEW_READY' });
  }

  async approveDecisionReadinessForFutureUse(ctx: RecoveryOutcomeCommandContext, readinessId: string, reasonCode?: string, safeMessage?: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RECOVERY_OUTCOME_DECISION_READINESS_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.readinessRepo.getById(readinessId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Decision readiness not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.readinessStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot approve voided decision readiness', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.readinessRepo.updateStatus(readinessId, 'approved_for_future_use', now);
    await this.readinessRepo.update(readinessId, { approvedForFutureUseAt: now } as any);
    await this.auditBridge.recordDecisionReadinessApprovedForFutureUse(ctx.schoolId, readinessId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: readinessId, status: 'approved_for_future_use', safeMessage: safeMessage || 'Decision readiness approved', reasonCode: reasonCode || 'READINESS_APPROVED' });
  }

  async suppressDecisionReadiness(ctx: RecoveryOutcomeCommandContext, readinessId: string, reasonCode?: string, safeMessage?: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.readinessRepo.getById(readinessId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Decision readiness not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.readinessStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot suppress voided decision readiness', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.readinessRepo.updateStatus(readinessId, 'suppressed', now);
    await this.readinessRepo.update(readinessId, { suppressedAt: now } as any);
    return this.envelope(ctx, { resourceId: readinessId, status: 'suppressed', safeMessage: safeMessage || 'Decision readiness suppressed', reasonCode: reasonCode || 'READINESS_SUPPRESSED' });
  }

  async blockDecisionReadiness(ctx: RecoveryOutcomeCommandContext, readinessId: string, reasonCodes?: string[], safeMessage?: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.readinessRepo.getById(readinessId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Decision readiness not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.readinessStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided decision readiness', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.readinessRepo.updateStatus(readinessId, 'blocked', now);
    await this.readinessRepo.update(readinessId, { blockedAt: now, blockedReasonCodesJson: reasonCodes || [] } as any);
    return this.envelope(ctx, { resourceId: readinessId, status: 'blocked', safeMessage: safeMessage || 'Decision readiness blocked', reasonCode: reasonCodes?.[0] || 'READINESS_BLOCKED' });
  }

  async voidDecisionReadiness(ctx: RecoveryOutcomeCommandContext, readinessId: string, reasonCode?: string, safeMessage?: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.readinessRepo.getById(readinessId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Decision readiness not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.readinessStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.readinessRepo.updateStatus(readinessId, 'void', now);
    await this.readinessRepo.update(readinessId, { voidedAt: now } as any);
    return this.envelope(ctx, { resourceId: readinessId, status: 'void', safeMessage: safeMessage || 'Decision readiness voided', reasonCode: reasonCode || 'READINESS_VOIDED' });
  }
}

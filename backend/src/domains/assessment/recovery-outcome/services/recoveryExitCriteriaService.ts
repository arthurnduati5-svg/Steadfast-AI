import { randomUUID } from 'crypto';
import type { RecoveryOutcomeCommandContext, RecoveryOutcomeSafeEnvelope } from '../contracts/recoveryOutcomeContracts';
import type { RecoveryExitCriteria, RecoveryExitCriteriaCreateRequest } from '../contracts/recoveryExitCriteriaContracts';
import { RecoveryOutcomePolicyEnforcer } from '../policies/recoveryOutcomePolicyDefinitions';
import { RecoveryOutcomeSafetyService } from './recoveryOutcomeSafetyService';
import { RecoveryOutcomeIdempotencyService } from './recoveryOutcomeIdempotencyService';
import { RecoveryOutcomeAuditBridge } from './recoveryOutcomeAuditBridge';

export interface ExitCriteriaRepository {
  create(data: RecoveryExitCriteria): Promise<RecoveryExitCriteria>;
  getById(id: string): Promise<RecoveryExitCriteria | null>;
  listBySchool(schoolId: string): Promise<RecoveryExitCriteria[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryExitCriteria[]>;
  listByStatus(schoolId: string, status: string): Promise<RecoveryExitCriteria[]>;
  update(id: string, data: Partial<RecoveryExitCriteria>): Promise<RecoveryExitCriteria>;
  updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryExitCriteria>;
}

export class RecoveryExitCriteriaService {
  private policyEnforcer = new RecoveryOutcomePolicyEnforcer();

  constructor(
    private exitCriteriaRepo: ExitCriteriaRepository,
    private safetyService: RecoveryOutcomeSafetyService,
    private auditBridge: RecoveryOutcomeAuditBridge,
    private idempotencyService: RecoveryOutcomeIdempotencyService,
  ) {}

  private envelope(ctx: RecoveryOutcomeCommandContext, overrides: Partial<RecoveryOutcomeSafeEnvelope>): RecoveryOutcomeSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createExitCriteria(ctx: RecoveryOutcomeCommandContext, input: RecoveryExitCriteriaCreateRequest): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RECOVERY_EXIT_CRITERIA_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });

    const schoolCheck = this.safetyService.assertSchoolContext(input.schoolId);
    if (!schoolCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: schoolCheck.safeMessage, reasonCode: schoolCheck.reasonCode, status: 'blocked' });

    const leakageCheck = this.safetyService.checkAllLeakageCategories(input.safeCriteriaSummary, {});
    if (!leakageCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: leakageCheck.safeMessage, reasonCode: leakageCheck.reasonCode, status: 'blocked' });

    const idempotencyKey = ctx.idempotencyKey || randomUUID();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createExitCriteria', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const now = new Date().toISOString();
    const record: RecoveryExitCriteria = {
      recoveryExitCriteriaId: randomUUID(),
      schoolId: ctx.schoolId,
      resultRecoveryPlanId: input.resultRecoveryPlanId,
      criteriaStatus: 'draft',
      criteriaType: input.criteriaType,
      safeCriteriaSummary: input.safeCriteriaSummary,
      criteriaDetailsJson: input.criteriaDetailsJson,
      blockedReasonCodesJson: [],
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
    const created = await this.exitCriteriaRepo.create(record);
    await this.idempotencyService.startOperation(ctx.schoolId, 'createExitCriteria', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createExitCriteria', idempotencyKey, 'RecoveryExitCriteria', created.recoveryExitCriteriaId, 'Exit criteria created');
    await this.auditBridge.recordExitCriteriaCreated(ctx.schoolId, created.recoveryExitCriteriaId, ctx.actorId, ctx.actorRole, ctx.requestId, ctx.correlationId);
    return this.envelope(ctx, { resourceId: created.recoveryExitCriteriaId, status: created.criteriaStatus, safeMessage: 'Exit criteria created', reasonCode: 'EXIT_CRITERIA_CREATED', data: created });
  }

  async getExitCriteria(ctx: RecoveryOutcomeCommandContext, exitCriteriaId: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.exitCriteriaRepo.getById(exitCriteriaId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Exit criteria not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: exitCriteriaId, status: record.criteriaStatus, safeMessage: 'Exit criteria found', data: record });
  }

  async listExitCriteriaForSchool(ctx: RecoveryOutcomeCommandContext): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.exitCriteriaRepo.listBySchool(ctx.schoolId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} exit criteria for school`, data: records });
  }

  async listExitCriteriaForPlan(ctx: RecoveryOutcomeCommandContext, planId: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.exitCriteriaRepo.listByPlanId(ctx.schoolId, planId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} exit criteria for plan`, data: records });
  }

  async listExitCriteriaByStatus(ctx: RecoveryOutcomeCommandContext, status: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.exitCriteriaRepo.listByStatus(ctx.schoolId, status);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} exit criteria with status ${status}`, data: records });
  }

  async markExitCriteriaReviewReady(ctx: RecoveryOutcomeCommandContext, exitCriteriaId: string, reasonCode?: string, safeMessage?: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RECOVERY_EXIT_CRITERIA_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.exitCriteriaRepo.getById(exitCriteriaId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Exit criteria not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.criteriaStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot review voided exit criteria', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.exitCriteriaRepo.updateStatus(exitCriteriaId, 'review_ready', now);
    await this.exitCriteriaRepo.update(exitCriteriaId, { reviewReadyAt: now } as any);
    await this.auditBridge.recordExitCriteriaReviewReady(ctx.schoolId, exitCriteriaId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: exitCriteriaId, status: 'review_ready', safeMessage: safeMessage || 'Exit criteria review ready', reasonCode: reasonCode || 'EXIT_CRITERIA_REVIEW_READY' });
  }

  async approveExitCriteriaForFutureUse(ctx: RecoveryOutcomeCommandContext, exitCriteriaId: string, reasonCode?: string, safeMessage?: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RECOVERY_EXIT_CRITERIA_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.exitCriteriaRepo.getById(exitCriteriaId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Exit criteria not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.criteriaStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot approve voided exit criteria', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.exitCriteriaRepo.updateStatus(exitCriteriaId, 'approved_for_future_use', now);
    await this.exitCriteriaRepo.update(exitCriteriaId, { approvedForFutureUseAt: now } as any);
    await this.auditBridge.recordExitCriteriaApprovedForFutureUse(ctx.schoolId, exitCriteriaId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: exitCriteriaId, status: 'approved_for_future_use', safeMessage: safeMessage || 'Exit criteria approved', reasonCode: reasonCode || 'EXIT_CRITERIA_APPROVED' });
  }

  async suppressExitCriteria(ctx: RecoveryOutcomeCommandContext, exitCriteriaId: string, reasonCode?: string, safeMessage?: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.exitCriteriaRepo.getById(exitCriteriaId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Exit criteria not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.criteriaStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot suppress voided exit criteria', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.exitCriteriaRepo.updateStatus(exitCriteriaId, 'suppressed', now);
    await this.exitCriteriaRepo.update(exitCriteriaId, { suppressedAt: now } as any);
    return this.envelope(ctx, { resourceId: exitCriteriaId, status: 'suppressed', safeMessage: safeMessage || 'Exit criteria suppressed', reasonCode: reasonCode || 'EXIT_CRITERIA_SUPPRESSED' });
  }

  async blockExitCriteria(ctx: RecoveryOutcomeCommandContext, exitCriteriaId: string, reasonCode?: string, safeMessage?: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.exitCriteriaRepo.getById(exitCriteriaId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Exit criteria not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.criteriaStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided exit criteria', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.exitCriteriaRepo.updateStatus(exitCriteriaId, 'blocked', now);
    await this.exitCriteriaRepo.update(exitCriteriaId, { blockedAt: now, blockedReasonCodesJson: reasonCode ? [reasonCode] : [] } as any);
    return this.envelope(ctx, { resourceId: exitCriteriaId, status: 'blocked', safeMessage: safeMessage || 'Exit criteria blocked', reasonCode: reasonCode || 'EXIT_CRITERIA_BLOCKED' });
  }

  async voidExitCriteria(ctx: RecoveryOutcomeCommandContext, exitCriteriaId: string, reasonCode?: string, safeMessage?: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.exitCriteriaRepo.getById(exitCriteriaId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Exit criteria not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.criteriaStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.exitCriteriaRepo.updateStatus(exitCriteriaId, 'void', now);
    await this.exitCriteriaRepo.update(exitCriteriaId, { voidedAt: now } as any);
    return this.envelope(ctx, { resourceId: exitCriteriaId, status: 'void', safeMessage: safeMessage || 'Exit criteria voided', reasonCode: reasonCode || 'EXIT_CRITERIA_VOIDED' });
  }
}

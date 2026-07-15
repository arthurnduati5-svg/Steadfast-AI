import { randomUUID } from 'crypto';
import type { RecoveryOutcomeCommandContext, RecoveryOutcomeSafeEnvelope } from '../contracts/recoveryOutcomeContracts';
import type { RecoveryOutcomeDecisionSummary, RecoveryOutcomeDecisionSummaryCreateRequest } from '../contracts/recoveryOutcomeSummaryContracts';
import { RecoveryOutcomePolicyEnforcer } from '../policies/recoveryOutcomePolicyDefinitions';
import { RecoveryOutcomeSafetyService } from './recoveryOutcomeSafetyService';
import { RecoveryOutcomeIdempotencyService } from './recoveryOutcomeIdempotencyService';
import { RecoveryOutcomeAuditBridge } from './recoveryOutcomeAuditBridge';

export interface DecisionSummaryRepository {
  create(data: RecoveryOutcomeDecisionSummary): Promise<RecoveryOutcomeDecisionSummary>;
  getById(id: string): Promise<RecoveryOutcomeDecisionSummary | null>;
  listBySchool(schoolId: string): Promise<RecoveryOutcomeDecisionSummary[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeDecisionSummary[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeDecisionSummary[]>;
  listByStatus(schoolId: string, status: string): Promise<RecoveryOutcomeDecisionSummary[]>;
  update(id: string, data: Partial<RecoveryOutcomeDecisionSummary>): Promise<RecoveryOutcomeDecisionSummary>;
  updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryOutcomeDecisionSummary>;
  refresh(id: string): Promise<RecoveryOutcomeDecisionSummary>;
}

export class RecoveryOutcomeDecisionSummaryService {
  private policyEnforcer = new RecoveryOutcomePolicyEnforcer();

  constructor(
    private summaryRepo: DecisionSummaryRepository,
    private safetyService: RecoveryOutcomeSafetyService,
    private auditBridge: RecoveryOutcomeAuditBridge,
    private idempotencyService: RecoveryOutcomeIdempotencyService,
  ) {}

  private envelope(ctx: RecoveryOutcomeCommandContext, overrides: Partial<RecoveryOutcomeSafeEnvelope>): RecoveryOutcomeSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createOutcomeDecisionSummary(ctx: RecoveryOutcomeCommandContext, input: RecoveryOutcomeDecisionSummaryCreateRequest): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RECOVERY_OUTCOME_SUMMARY_MUTATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });

    const schoolCheck = this.safetyService.assertSchoolContext(input.schoolId);
    if (!schoolCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: schoolCheck.safeMessage, reasonCode: schoolCheck.reasonCode, status: 'blocked' });

    const leakageCheck = this.safetyService.checkAllLeakageCategories(input.safeSummary, input.sourceRefsJson);
    if (!leakageCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: leakageCheck.safeMessage, reasonCode: leakageCheck.reasonCode, status: 'blocked' });

    const sourceRefCheck = this.safetyService.assertSourceRefPresent(input.sourceRefsJson);
    if (!sourceRefCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: sourceRefCheck.safeMessage, reasonCode: sourceRefCheck.reasonCode, status: 'blocked' });

    const idempotencyKey = ctx.idempotencyKey || randomUUID();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createOutcomeDecisionSummary', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const now = new Date().toISOString();
    const record: RecoveryOutcomeDecisionSummary = {
      recoveryOutcomeDecisionSummaryId: randomUUID(),
      schoolId: ctx.schoolId,
      studentRef: input.studentRef,
      teacherRef: input.teacherRef,
      resultRecoveryPlanId: input.resultRecoveryPlanId,
      recoveryProgressSummaryId: input.recoveryProgressSummaryId,
      recoveryEvidenceRollupId: input.recoveryEvidenceRollupId,
      summaryStatus: 'active',
      safeSummary: input.safeSummary,
      decisionCountsJson: input.decisionCountsJson,
      topDecisionsJson: input.topDecisionsJson,
      nextActionRefsJson: {},
      blockedReasonCodesJson: [],
      sourceRefsJson: input.sourceRefsJson,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
      createdAt: now,
      updatedAt: now,
      refreshedAt: now,
      staleAt: undefined,
      blockedAt: undefined,
      voidedAt: undefined,
    };
    const created = await this.summaryRepo.create(record);
    await this.idempotencyService.startOperation(ctx.schoolId, 'createOutcomeDecisionSummary', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createOutcomeDecisionSummary', idempotencyKey, 'RecoveryOutcomeDecisionSummary', created.recoveryOutcomeDecisionSummaryId, 'Outcome decision summary created');
    await this.auditBridge.recordOutcomeDecisionSummaryCreated(ctx.schoolId, created.recoveryOutcomeDecisionSummaryId, ctx.actorId, ctx.actorRole, ctx.requestId, ctx.correlationId);
    return this.envelope(ctx, { resourceId: created.recoveryOutcomeDecisionSummaryId, status: created.summaryStatus, safeMessage: 'Outcome decision summary created', reasonCode: 'SUMMARY_CREATED', data: created });
  }

  async getOutcomeDecisionSummary(ctx: RecoveryOutcomeCommandContext, summaryId: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.summaryRepo.getById(summaryId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Outcome decision summary not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: summaryId, status: record.summaryStatus, safeMessage: 'Outcome decision summary found', data: record });
  }

  async listSummariesForSchool(ctx: RecoveryOutcomeCommandContext): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.summaryRepo.listBySchool(ctx.schoolId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} outcome decision summaries for school`, data: records });
  }

  async listSummariesForStudent(ctx: RecoveryOutcomeCommandContext, studentRef: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.summaryRepo.listByStudentRef(ctx.schoolId, studentRef);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} outcome decision summaries for student`, data: records });
  }

  async listSummariesForPlan(ctx: RecoveryOutcomeCommandContext, planId: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.summaryRepo.listByPlanId(ctx.schoolId, planId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} outcome decision summaries for plan`, data: records });
  }

  async refreshOutcomeDecisionSummary(ctx: RecoveryOutcomeCommandContext, summaryId: string, reasonCode?: string, safeMessage?: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RECOVERY_OUTCOME_SUMMARY_MUTATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.summaryRepo.getById(summaryId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Summary not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.summaryStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot refresh voided summary', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.summaryRepo.refresh(summaryId);
    await this.summaryRepo.update(summaryId, { refreshedAt: now, summaryStatus: 'active', updatedAt: now } as any);
    await this.auditBridge.recordOutcomeDecisionSummaryRefreshed(ctx.schoolId, summaryId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: summaryId, status: 'active', safeMessage: safeMessage || 'Outcome decision summary refreshed', reasonCode: reasonCode || 'SUMMARY_REFRESHED' });
  }

  async markOutcomeDecisionSummaryStale(ctx: RecoveryOutcomeCommandContext, summaryId: string, reasonCode?: string, safeMessage?: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RECOVERY_OUTCOME_SUMMARY_MUTATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.summaryRepo.getById(summaryId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Summary not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.summaryStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot mark voided summary stale', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.summaryRepo.updateStatus(summaryId, 'stale', now);
    await this.summaryRepo.update(summaryId, { staleAt: now } as any);
    await this.auditBridge.recordOutcomeDecisionSummaryStale(ctx.schoolId, summaryId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: summaryId, status: 'stale', safeMessage: safeMessage || 'Outcome decision summary marked stale', reasonCode: reasonCode || 'SUMMARY_STALE' });
  }

  async blockOutcomeDecisionSummary(ctx: RecoveryOutcomeCommandContext, summaryId: string, reasonCode?: string, safeMessage?: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.summaryRepo.getById(summaryId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Summary not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.summaryStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided summary', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.summaryRepo.updateStatus(summaryId, 'blocked', now);
    await this.summaryRepo.update(summaryId, { blockedAt: now, blockedReasonCodesJson: reasonCode ? [reasonCode] : [] } as any);
    return this.envelope(ctx, { resourceId: summaryId, status: 'blocked', safeMessage: safeMessage || 'Outcome decision summary blocked', reasonCode: reasonCode || 'SUMMARY_BLOCKED' });
  }

  async voidOutcomeDecisionSummary(ctx: RecoveryOutcomeCommandContext, summaryId: string, reasonCode?: string, safeMessage?: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.summaryRepo.getById(summaryId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Summary not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.summaryStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.summaryRepo.updateStatus(summaryId, 'void', now);
    await this.summaryRepo.update(summaryId, { voidedAt: now } as any);
    return this.envelope(ctx, { resourceId: summaryId, status: 'void', safeMessage: safeMessage || 'Outcome decision summary voided', reasonCode: reasonCode || 'SUMMARY_VOIDED' });
  }
}

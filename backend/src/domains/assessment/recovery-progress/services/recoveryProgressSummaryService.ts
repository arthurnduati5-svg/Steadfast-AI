import { randomUUID } from 'crypto';
import type { RecoveryProgressCommandContext, RecoveryProgressSafeEnvelope, RecoveryProgressSummary } from '../contracts/recoveryProgressContracts';
import type { CreateProgressSummaryRequest, UpdateProgressSummaryRequest } from '../contracts/recoveryProgressSummaryContracts';
import { RecoveryProgressPolicyEnforcer } from '../policies/recoveryProgressPolicyDefinitions';
import { RecoveryProgressSafetyService } from './recoveryProgressSafetyService';
import { RecoveryProgressIdempotencyService } from './recoveryProgressIdempotencyService';
import { RecoveryProgressAuditBridge } from './recoveryProgressAuditBridge';

export interface ProgressSummaryRepository {
  create(data: RecoveryProgressSummary): Promise<RecoveryProgressSummary>;
  getById(id: string): Promise<RecoveryProgressSummary | null>;
  listBySchool(schoolId: string): Promise<RecoveryProgressSummary[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryProgressSummary[]>;
  listByTeacherRef(schoolId: string, teacherRef: string): Promise<RecoveryProgressSummary[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryProgressSummary[]>;
  listByScope(schoolId: string, scope: string): Promise<RecoveryProgressSummary[]>;
  update(id: string, data: Partial<RecoveryProgressSummary>): Promise<RecoveryProgressSummary>;
  updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryProgressSummary>;
}

export class RecoveryProgressSummaryService {
  private policyEnforcer = new RecoveryProgressPolicyEnforcer();

  constructor(
    private summaryRepo: ProgressSummaryRepository,
    private safetyService: RecoveryProgressSafetyService,
    private auditBridge: RecoveryProgressAuditBridge,
    private idempotencyService: RecoveryProgressIdempotencyService,
  ) {}

  private envelope(ctx: RecoveryProgressCommandContext, overrides: Partial<RecoveryProgressSafeEnvelope>): RecoveryProgressSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createSummary(ctx: RecoveryProgressCommandContext, input: CreateProgressSummaryRequest): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RECOVERY_PROGRESS_SUMMARY_MUTATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });

    const idempotencyKey = ctx.idempotencyKey || randomUUID();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createSummary', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const now = new Date().toISOString();
    const record: RecoveryProgressSummary = {
      recoveryProgressSummaryId: randomUUID(),
      schoolId: ctx.schoolId,
      studentRef: input.studentRef,
      teacherRef: input.teacherRef,
      resultRecoveryPlanId: input.resultRecoveryPlanId,
      summaryScope: input.summaryScope as any,
      summaryStatus: 'active',
      safeSummary: input.safeSummary,
      progressStateJson: (input.progressStateJson || {}) as Record<string, unknown>,
      observationCountsJson: (input.observationCountsJson || {}) as Record<string, unknown>,
      checkpointEvaluationCountsJson: (input.checkpointEvaluationCountsJson || {}) as Record<string, unknown>,
      rollupRefsJson: (input.rollupRefsJson || {}) as Record<string, unknown>,
      blockedReasonCodesJson: input.blockedReasonCodesJson || [],
      createdAt: now,
      updatedAt: now,
      refreshedAt: now,
      voidedAt: undefined,
    };
    const created = await this.summaryRepo.create(record);
    await this.idempotencyService.startOperation(ctx.schoolId, 'createSummary', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createSummary', idempotencyKey, 'RecoveryProgressSummary', created.recoveryProgressSummaryId, 'Summary created');
    await this.auditBridge.recordProgressSummaryCreated(ctx.schoolId, created.recoveryProgressSummaryId, ctx.actorId, ctx.actorRole, ctx.requestId, ctx.correlationId);
    return this.envelope(ctx, { resourceId: created.recoveryProgressSummaryId, status: created.summaryStatus, safeMessage: 'Progress summary created', reasonCode: 'SUMMARY_CREATED', data: created });
  }

  async getSummary(ctx: RecoveryProgressCommandContext, summaryId: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.summaryRepo.getById(summaryId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Summary not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: summaryId, status: record.summaryStatus, safeMessage: 'Summary found', data: record });
  }

  async listSummariesForSchool(ctx: RecoveryProgressCommandContext): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.summaryRepo.listBySchool(ctx.schoolId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} summaries for school`, data: records });
  }

  async listSummariesForStudent(ctx: RecoveryProgressCommandContext, studentRef: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.summaryRepo.listByStudentRef(ctx.schoolId, studentRef);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} summaries for student`, data: records });
  }

  async listSummariesForTeacher(ctx: RecoveryProgressCommandContext, teacherRef: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.summaryRepo.listByTeacherRef(ctx.schoolId, teacherRef);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} summaries for teacher`, data: records });
  }

  async listSummariesForPlan(ctx: RecoveryProgressCommandContext, planId: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.summaryRepo.listByPlanId(ctx.schoolId, planId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} summaries for plan`, data: records });
  }

  async listSummariesByScope(ctx: RecoveryProgressCommandContext, scope: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.summaryRepo.listByScope(ctx.schoolId, scope);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} summaries with scope ${scope}`, data: records });
  }

  async refreshSummary(ctx: RecoveryProgressCommandContext, summaryId: string, reasonCode: string, safeMessage: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RECOVERY_PROGRESS_SUMMARY_MUTATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.summaryRepo.getById(summaryId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Summary not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.summaryStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot refresh voided summary', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.summaryRepo.update(summaryId, { refreshedAt: now } as any);
    await this.auditBridge.recordProgressSummaryRefreshed(ctx.schoolId, summaryId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: summaryId, status: record.summaryStatus, safeMessage: safeMessage || 'Summary refreshed', reasonCode: reasonCode || 'SUMMARY_REFRESHED' });
  }

  async markSummaryStale(ctx: RecoveryProgressCommandContext, summaryId: string, reasonCode: string, safeMessage: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.summaryRepo.getById(summaryId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Summary not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.summaryStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot mark voided summary stale', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.summaryRepo.updateStatus(summaryId, 'stale', now);
    return this.envelope(ctx, { resourceId: summaryId, status: 'stale', safeMessage: safeMessage || 'Summary marked stale', reasonCode: reasonCode || 'SUMMARY_STALE' });
  }

  async blockSummary(ctx: RecoveryProgressCommandContext, summaryId: string, reasonCode: string, safeMessage: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.summaryRepo.getById(summaryId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Summary not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.summaryStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided summary', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.summaryRepo.updateStatus(summaryId, 'blocked', now);
    return this.envelope(ctx, { resourceId: summaryId, status: 'blocked', safeMessage: safeMessage || 'Summary blocked', reasonCode: reasonCode || 'SUMMARY_BLOCKED' });
  }

  async voidSummary(ctx: RecoveryProgressCommandContext, summaryId: string, reasonCode: string, safeMessage: string): Promise<RecoveryProgressSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.summaryRepo.getById(summaryId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Summary not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.summaryStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.summaryRepo.updateStatus(summaryId, 'void', now);
    await this.summaryRepo.update(summaryId, { voidedAt: now } as any);
    return this.envelope(ctx, { resourceId: summaryId, status: 'void', safeMessage: safeMessage || 'Summary voided', reasonCode: reasonCode || 'SUMMARY_VOIDED' });
  }
}

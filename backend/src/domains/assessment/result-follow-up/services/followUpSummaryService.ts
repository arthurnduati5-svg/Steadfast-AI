import { v4 as uuidv4 } from 'uuid';
import type { ResultFollowUpCommandContext, ResultFollowUpSafeEnvelope } from '../contracts/resultFollowUpContracts';
import type { CreateFollowUpSummaryInput } from '../contracts/followUpSummaryContracts';
import type { FollowUpSummaryRepository } from '../contracts/resultFollowUpRepositoryContracts';
import { ResultFollowUpPolicyEnforcer } from '../policies/resultFollowUpPolicyDefinitions';
import { ResultFollowUpIdempotencyService } from './resultFollowUpIdempotencyService';
import { ResultFollowUpAuditBridge } from './resultFollowUpAuditBridge';

export class FollowUpSummaryService {
  private policyEnforcer = new ResultFollowUpPolicyEnforcer();

  constructor(
    private summaryRepo: FollowUpSummaryRepository,
    private auditBridge: ResultFollowUpAuditBridge,
    private idempotencyService: ResultFollowUpIdempotencyService,
  ) {}

  private envelope(ctx: ResultFollowUpCommandContext, overrides: Partial<ResultFollowUpSafeEnvelope>): ResultFollowUpSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createSummary(ctx: ResultFollowUpCommandContext, input: Omit<CreateFollowUpSummaryInput, 'createdByActorId' | 'createdByRole'>): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('FOLLOW_UP_SUMMARY_MUTATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });

    const idempotencyKey = ctx.idempotencyKey || uuidv4();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createSummary', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const createInput: CreateFollowUpSummaryInput & { createdByActorId: string; createdByRole: string } = {
      ...input,
      schoolId: ctx.schoolId,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    };
    const record = await this.summaryRepo.create(createInput);
    await this.idempotencyService.startOperation(ctx.schoolId, 'createSummary', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createSummary', idempotencyKey, 'FollowUpSummary', record.followUpSummaryId, 'Follow-up summary created');
    await this.auditBridge.recordSummaryCreated(ctx.schoolId, record.followUpSummaryId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: record.followUpSummaryId, status: record.summaryStatus, safeMessage: 'Follow-up summary created', reasonCode: 'SUMMARY_CREATED', data: record });
  }

  async getSummary(ctx: ResultFollowUpCommandContext, summaryId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.summaryRepo.getById(summaryId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Follow-up summary not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: summaryId, status: record.summaryStatus, safeMessage: 'Follow-up summary found', data: record });
  }

  async listSummariesForSchool(ctx: ResultFollowUpCommandContext): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.summaryRepo.listBySchool(ctx.schoolId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} follow-up summaries for school`, data: records });
  }

  async listSummariesForStudent(ctx: ResultFollowUpCommandContext, studentRef: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.summaryRepo.listByStudentRef(ctx.schoolId, studentRef);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} follow-up summaries for student`, data: records });
  }

  async listSummariesByScope(ctx: ResultFollowUpCommandContext, scope: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.summaryRepo.listByScope(ctx.schoolId, scope);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} follow-up summaries with scope ${scope}`, data: records });
  }

  async listSummariesByStatus(ctx: ResultFollowUpCommandContext, status: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.summaryRepo.listByStatus(ctx.schoolId, status);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} follow-up summaries with status ${status}`, data: records });
  }

  async refreshSummary(ctx: ResultFollowUpCommandContext, summaryId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('FOLLOW_UP_SUMMARY_MUTATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.summaryRepo.getById(summaryId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Follow-up summary not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.summaryStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot refresh voided summary', reasonCode: 'INVALID_STATUS', status: 'error' });

    const idempotencyKey = ctx.idempotencyKey || uuidv4();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'refreshSummary', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    await this.summaryRepo.refresh(summaryId);
    await this.idempotencyService.startOperation(ctx.schoolId, 'refreshSummary', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'refreshSummary', idempotencyKey, 'FollowUpSummary', summaryId, 'Follow-up summary refreshed');
    await this.auditBridge.recordSummaryRefreshed(ctx.schoolId, summaryId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: summaryId, status: 'active', safeMessage: 'Follow-up summary refreshed', reasonCode: 'SUMMARY_REFRESHED' });
  }

  async markSummaryStale(ctx: ResultFollowUpCommandContext, summaryId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.summaryRepo.getById(summaryId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Follow-up summary not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.summaryStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot mark voided summary stale', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.summaryRepo.markStale(summaryId);
    return this.envelope(ctx, { resourceId: summaryId, status: 'stale', safeMessage: 'Follow-up summary marked stale', reasonCode: 'SUMMARY_STALE' });
  }

  async blockSummary(ctx: ResultFollowUpCommandContext, summaryId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.summaryRepo.getById(summaryId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Follow-up summary not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.summaryStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided summary', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.summaryRepo.block(summaryId, 'BLOCKED', 'Follow-up summary blocked');
    return this.envelope(ctx, { resourceId: summaryId, status: 'blocked', safeMessage: 'Follow-up summary blocked', reasonCode: 'SUMMARY_BLOCKED' });
  }

  async voidSummary(ctx: ResultFollowUpCommandContext, summaryId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.summaryRepo.getById(summaryId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Follow-up summary not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.summaryStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.summaryRepo.void(summaryId, 'VOIDED', 'Follow-up summary voided');
    return this.envelope(ctx, { resourceId: summaryId, status: 'void', safeMessage: 'Follow-up summary voided', reasonCode: 'SUMMARY_VOIDED' });
  }
}

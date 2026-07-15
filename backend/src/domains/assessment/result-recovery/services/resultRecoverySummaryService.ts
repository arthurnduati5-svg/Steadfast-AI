import { randomUUID } from 'crypto';
import type { ResultRecoveryCommandContext, ResultRecoverySafeEnvelope, ResultRecoverySummaryScope } from '../contracts/resultRecoveryContracts';
import { ResultRecoveryPolicyEnforcer } from '../policies/resultRecoveryPolicyDefinitions';
import { ResultRecoverySafetyService } from './resultRecoverySafetyService';
import { ResultRecoveryIdempotencyService } from './resultRecoveryIdempotencyService';
import { ResultRecoveryAuditBridge } from './resultRecoveryAuditBridge';

export interface RecoverySummaryInput {
  schoolId: string;
  scope: ResultRecoverySummaryScope;
  scopeRef?: string;
  safeSummaryText: string;
  summaryDataJson?: Record<string, unknown>;
  sourceRefsJson?: Record<string, unknown>;
}

export interface RecoverySummary {
  resultRecoverySummaryId: string;
  schoolId: string;
  scope: string;
  scopeRef: string | null;
  summaryStatus: string;
  safeSummaryText: string;
  summaryDataJson: Record<string, unknown> | null;
  sourceRefsJson: Record<string, unknown> | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  refreshedAt: string | null;
  staleAt: string | null;
  blockedAt: string | null;
  voidedAt: string | null;
}

export interface RecoverySummaryPreview {
  resultRecoverySummaryId: string;
  schoolId: string;
  scope: string;
  scopeRef: string | null;
  summaryStatus: string;
  safeSummaryText: string;
  createdAt: string;
}

export interface RecoverySummaryRepository {
  create(input: RecoverySummaryInput & { createdByActorId: string; createdByRole: string }): Promise<RecoverySummary>;
  getById(summaryId: string): Promise<RecoverySummary | null>;
  listBySchool(schoolId: string): Promise<RecoverySummaryPreview[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoverySummaryPreview[]>;
  listByScope(schoolId: string, scope: string): Promise<RecoverySummaryPreview[]>;
  update(summaryId: string, data: Partial<RecoverySummary>): Promise<RecoverySummary>;
  updateStatus(summaryId: string, summaryStatus: string, reasonCode: string, safeMessage: string): Promise<RecoverySummary>;
  refresh(summaryId: string): Promise<RecoverySummary>;
  markStale(summaryId: string): Promise<RecoverySummary>;
  block(summaryId: string, reasonCode: string, safeMessage: string): Promise<RecoverySummary>;
  void(summaryId: string, reasonCode: string, safeMessage: string): Promise<RecoverySummary>;
}

export class ResultRecoverySummaryService {
  private policyEnforcer = new ResultRecoveryPolicyEnforcer();

  constructor(
    private summaryRepo: RecoverySummaryRepository,
    private safetyService: ResultRecoverySafetyService,
    private auditBridge: ResultRecoveryAuditBridge,
    private idempotencyService: ResultRecoveryIdempotencyService,
  ) {}

  private envelope(ctx: ResultRecoveryCommandContext, overrides: Partial<ResultRecoverySafeEnvelope>): ResultRecoverySafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createRecoverySummary(ctx: ResultRecoveryCommandContext, input: RecoverySummaryInput): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RESULT_RECOVERY_SUMMARY_MUTATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });

    const idempotencyKey = ctx.idempotencyKey || randomUUID();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createRecoverySummary', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const createInput: RecoverySummaryInput & { createdByActorId: string; createdByRole: string } = {
      ...input,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    };
    const record = await this.summaryRepo.create(createInput);
    await this.idempotencyService.startOperation(ctx.schoolId, 'createRecoverySummary', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createRecoverySummary', idempotencyKey, 'RecoverySummary', record.resultRecoverySummaryId, 'Recovery summary created');
    await this.auditBridge.recordSummaryCreated(ctx.schoolId, record.resultRecoverySummaryId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: record.resultRecoverySummaryId, status: record.summaryStatus, safeMessage: 'Recovery summary created', reasonCode: 'SUMMARY_CREATED', data: record });
  }

  async getRecoverySummary(ctx: ResultRecoveryCommandContext, summaryId: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.summaryRepo.getById(summaryId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Recovery summary not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: summaryId, status: record.summaryStatus, safeMessage: 'Recovery summary found', data: record });
  }

  async listRecoverySummariesForSchool(ctx: ResultRecoveryCommandContext): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.summaryRepo.listBySchool(ctx.schoolId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} recovery summaries for school`, data: records });
  }

  async listRecoverySummariesForStudent(ctx: ResultRecoveryCommandContext, studentRef: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.summaryRepo.listByStudentRef(ctx.schoolId, studentRef);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} recovery summaries for student`, data: records });
  }

  async listRecoverySummariesByScope(ctx: ResultRecoveryCommandContext, scope: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.summaryRepo.listByScope(ctx.schoolId, scope);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} recovery summaries with scope ${scope}`, data: records });
  }

  async refreshRecoverySummary(ctx: ResultRecoveryCommandContext, summaryId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RESULT_RECOVERY_SUMMARY_MUTATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.summaryRepo.getById(summaryId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Recovery summary not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.summaryStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot refresh voided summary', reasonCode: 'INVALID_STATUS', status: 'error' });

    const idempotencyKey = ctx.idempotencyKey || randomUUID();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'refreshRecoverySummary', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    await this.summaryRepo.refresh(summaryId);
    await this.idempotencyService.startOperation(ctx.schoolId, 'refreshRecoverySummary', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'refreshRecoverySummary', idempotencyKey, 'RecoverySummary', summaryId, 'Recovery summary refreshed');
    await this.auditBridge.recordSummaryRefreshed(ctx.schoolId, summaryId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: summaryId, status: 'active', safeMessage: safeMessage || 'Recovery summary refreshed', reasonCode: reasonCode || 'SUMMARY_REFRESHED' });
  }

  async markRecoverySummaryStale(ctx: ResultRecoveryCommandContext, summaryId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.summaryRepo.getById(summaryId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Recovery summary not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.summaryStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot mark voided summary as stale', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.summaryRepo.markStale(summaryId);
    return this.envelope(ctx, { resourceId: summaryId, status: 'stale', safeMessage: safeMessage || 'Recovery summary marked stale', reasonCode: reasonCode || 'SUMMARY_STALE' });
  }

  async blockRecoverySummary(ctx: ResultRecoveryCommandContext, summaryId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.summaryRepo.getById(summaryId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Recovery summary not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.summaryStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided summary', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.summaryRepo.block(summaryId, reasonCode || 'BLOCKED', safeMessage || 'Recovery summary blocked');
    return this.envelope(ctx, { resourceId: summaryId, status: 'blocked', safeMessage: safeMessage || 'Recovery summary blocked', reasonCode: reasonCode || 'SUMMARY_BLOCKED' });
  }

  async voidRecoverySummary(ctx: ResultRecoveryCommandContext, summaryId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.summaryRepo.getById(summaryId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Recovery summary not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.summaryStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.summaryRepo.void(summaryId, reasonCode || 'VOIDED', safeMessage || 'Recovery summary voided');
    return this.envelope(ctx, { resourceId: summaryId, status: 'void', safeMessage: safeMessage || 'Recovery summary voided', reasonCode: reasonCode || 'SUMMARY_VOIDED' });
  }
}

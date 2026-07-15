import { v4 as uuidv4 } from 'uuid';
import type { ResultReportCardAccessCommandContext, ResultReportCardAccessSafeEnvelope } from '../contracts/resultReportCardAccessContracts';
import { evaluateReportCardAccessSummaryPolicy } from '../policies/resultReportCardAccessPolicyDefinitions';
import { ResultReportCardAccessIdempotencyService } from './resultReportCardAccessIdempotencyService';
import { ResultReportCardAccessAuditBridge } from './resultReportCardAccessAuditBridge';

interface ResultReportCardAccessSummary {
  resultReportCardAccessSummaryId: string;
  schoolId: string;
  studentRef: string | null;
  resultReportCardAssemblyId: string | null;
  resultReportCardExportJobId: string | null;
  summaryStatus: string;
  summaryScope: string;
  safeSummary: string;
  audienceCountsJson: Record<string, unknown> | null;
  statusCountsJson: Record<string, unknown> | null;
  blockedReasonCodesJson: Record<string, unknown> | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  refreshedAt: string | null;
  voidedAt: string | null;
}

interface CreateAccessSummaryInput {
  studentRef?: string;
  resultReportCardAssemblyId?: string;
  resultReportCardExportJobId?: string;
  summaryScope: string;
  safeSummary: string;
  audienceCountsJson?: Record<string, unknown>;
  statusCountsJson?: Record<string, unknown>;
  blockedReasonCodesJson?: Record<string, unknown>;
}

interface ResultReportCardAccessSummaryPreview {
  resultReportCardAccessSummaryId: string;
  schoolId: string;
  summaryStatus: string;
  summaryScope: string;
  safeSummary: string;
  refreshedAt: string | null;
  createdAt: string;
}

interface ResultReportCardAccessSummaryRepository {
  create(input: CreateAccessSummaryInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardAccessSummary>;
  getById(summaryId: string): Promise<ResultReportCardAccessSummary | null>;
  listBySchool(schoolId: string): Promise<ResultReportCardAccessSummaryPreview[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<ResultReportCardAccessSummaryPreview[]>;
  listByStatus(schoolId: string, status: string): Promise<ResultReportCardAccessSummaryPreview[]>;
  update(summaryId: string, data: Partial<ResultReportCardAccessSummary>): Promise<ResultReportCardAccessSummary>;
  updateStatus(summaryId: string, status: string): Promise<ResultReportCardAccessSummary>;
  refresh(summaryId: string): Promise<ResultReportCardAccessSummary>;
  void(summaryId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardAccessSummary>;
}

export class ResultReportCardAccessSummaryService {
  constructor(
    private summaryRepo: ResultReportCardAccessSummaryRepository,
    private auditBridge: ResultReportCardAccessAuditBridge,
    private idempotencyService: ResultReportCardAccessIdempotencyService,
  ) {}

  private envelope(ctx: ResultReportCardAccessCommandContext, overrides: Partial<ResultReportCardAccessSafeEnvelope>): ResultReportCardAccessSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createAccessSummary(ctx: ResultReportCardAccessCommandContext, input: Omit<CreateAccessSummaryInput, 'schoolId' | 'createdByActorId' | 'createdByRole'>): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = evaluateReportCardAccessSummaryPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, policyDecision: policy, status: 'blocked' });

    const idempotencyKey = ctx.idempotencyKey || uuidv4();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createAccessSummary', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const createInput: CreateAccessSummaryInput & { schoolId: string; createdByActorId: string; createdByRole: string } = {
      ...input,
      schoolId: ctx.schoolId,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    };
    const record = await this.summaryRepo.create(createInput);
    await this.idempotencyService.startOperation(ctx.schoolId, 'createAccessSummary', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createAccessSummary', idempotencyKey, 'ResultReportCardAccessSummary', record.resultReportCardAccessSummaryId, 'Access summary created');
    await this.auditBridge.recordSummaryCreated(ctx, record.resultReportCardAccessSummaryId, 'Access summary created');
    return this.envelope(ctx, { resourceId: record.resultReportCardAccessSummaryId, status: record.summaryStatus, safeMessage: 'Access summary created successfully', reasonCode: 'ACCESS_SUMMARY_CREATED', data: record });
  }

  async getAccessSummary(ctx: ResultReportCardAccessCommandContext, summaryId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const summary = await this.summaryRepo.getById(summaryId);
    if (!summary) return this.envelope(ctx, { ok: false, safeMessage: 'Access summary not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: summaryId, status: summary.summaryStatus, safeMessage: 'Access summary found', data: summary });
  }

  async listSummariesForSchool(ctx: ResultReportCardAccessCommandContext): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const summaries = await this.summaryRepo.listBySchool(ctx.schoolId);
    return this.envelope(ctx, { safeMessage: `Found ${summaries.length} summaries for school`, data: summaries });
  }

  async listSummariesForStudent(ctx: ResultReportCardAccessCommandContext, studentRef: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const summaries = await this.summaryRepo.listByStudentRef(ctx.schoolId, studentRef);
    return this.envelope(ctx, { safeMessage: `Found ${summaries.length} summaries for student`, data: summaries });
  }

  async listSummariesForAssembly(ctx: ResultReportCardAccessCommandContext, assemblyId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const summaries = await this.summaryRepo.listBySchool(ctx.schoolId);
    return this.envelope(ctx, { safeMessage: `Found ${summaries.length} summaries`, data: summaries });
  }

  async listSummariesForExportJob(ctx: ResultReportCardAccessCommandContext, exportJobId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const summaries = await this.summaryRepo.listBySchool(ctx.schoolId);
    return this.envelope(ctx, { safeMessage: `Found ${summaries.length} summaries`, data: summaries });
  }

  async refreshAccessSummary(ctx: ResultReportCardAccessCommandContext, summaryId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const summary = await this.summaryRepo.getById(summaryId);
    if (!summary) return this.envelope(ctx, { ok: false, safeMessage: 'Access summary not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (summary.summaryStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot refresh voided summary', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.summaryRepo.refresh(summaryId);
    await this.auditBridge.recordSummaryRefreshed(ctx, summaryId, 'Access summary refreshed');
    return this.envelope(ctx, { resourceId: summaryId, safeMessage: 'Access summary refreshed', reasonCode: 'SUMMARY_REFRESHED' });
  }

  async markSummaryStale(ctx: ResultReportCardAccessCommandContext, summaryId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const summary = await this.summaryRepo.getById(summaryId);
    if (!summary) return this.envelope(ctx, { ok: false, safeMessage: 'Access summary not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (summary.summaryStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot mark voided summary stale', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.summaryRepo.updateStatus(summaryId, 'stale');
    return this.envelope(ctx, { resourceId: summaryId, status: 'stale', safeMessage: 'Access summary marked stale', reasonCode: 'SUMMARY_STALE' });
  }

  async blockAccessSummary(ctx: ResultReportCardAccessCommandContext, summaryId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const summary = await this.summaryRepo.getById(summaryId);
    if (!summary) return this.envelope(ctx, { ok: false, safeMessage: 'Access summary not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (summary.summaryStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided summary', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.summaryRepo.updateStatus(summaryId, 'blocked');
    return this.envelope(ctx, { resourceId: summaryId, status: 'blocked', safeMessage: 'Access summary blocked', reasonCode: 'SUMMARY_BLOCKED' });
  }

  async voidAccessSummary(ctx: ResultReportCardAccessCommandContext, summaryId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const summary = await this.summaryRepo.getById(summaryId);
    if (!summary) return this.envelope(ctx, { ok: false, safeMessage: 'Access summary not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (summary.summaryStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.summaryRepo.void(summaryId, 'VOIDED', 'Access summary voided');
    return this.envelope(ctx, { resourceId: summaryId, status: 'void', safeMessage: 'Access summary voided', reasonCode: 'SUMMARY_VOIDED' });
  }
}

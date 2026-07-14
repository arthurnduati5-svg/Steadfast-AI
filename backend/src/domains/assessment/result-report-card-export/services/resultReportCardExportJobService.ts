import { v4 as uuidv4 } from 'uuid';
import type { ResultReportCardCommandContext, ResultReportCardSafeEnvelope } from '../../result-report-card/contracts/resultReportCardContracts';
import type { ResultReportCardExportJobRepository } from '../contracts/resultReportCardExportRepositoryContracts';
import type { CreateExportJobInput, ResultReportCardExportJob } from '../contracts/resultReportCardExportJobContracts';
import type { ResultReportCardExportJobStatus } from '../contracts/resultReportCardExportContracts';
import { evaluateReportCardExportJobCreationPolicy, evaluateReportCardExportNoPdfBinaryPolicy, evaluateReportCardExportNoLivePublicationPolicy } from '../policies/resultReportCardExportPolicyDefinitions';
import { ResultReportCardExportIdempotencyService } from './resultReportCardExportIdempotencyService';
import { ResultReportCardExportAuditBridge } from './resultReportCardExportAuditBridge';

export class ResultReportCardExportJobService {
  constructor(
    private jobRepo: ResultReportCardExportJobRepository,
    private auditBridge: ResultReportCardExportAuditBridge,
    private idempotencyService: ResultReportCardExportIdempotencyService,
  ) {}

  private envelope(ctx: ResultReportCardCommandContext, overrides: Partial<ResultReportCardSafeEnvelope>): ResultReportCardSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createExportJobFromIntent(ctx: ResultReportCardCommandContext, input: Omit<CreateExportJobInput, 'schoolId' | 'createdByActorId' | 'createdByRole'>): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = evaluateReportCardExportJobCreationPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, policyDecision: policy, status: 'blocked' });
    const pdfPolicy = evaluateReportCardExportNoPdfBinaryPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!pdfPolicy.allowed) return this.envelope(ctx, { ok: false, safeMessage: pdfPolicy.safeMessage, reasonCode: pdfPolicy.reasonCode, policyDecision: pdfPolicy, status: 'blocked' });
    const livePolicy = evaluateReportCardExportNoLivePublicationPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!livePolicy.allowed && input.exportJobMode !== 'mock_export_only' && input.exportJobMode !== 'dry_run_only' && input.exportJobMode !== 'preflight_only' && input.exportJobMode !== 'archive_manifest_only') {
      return this.envelope(ctx, { ok: false, safeMessage: livePolicy.safeMessage, reasonCode: livePolicy.reasonCode, policyDecision: livePolicy, status: 'blocked' });
    }

    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createExportJob', ctx.idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const id = uuidv4();
    const now = new Date().toISOString();
    const createInput: CreateExportJobInput & { schoolId: string; createdByActorId: string; createdByRole: string } = {
      ...input,
      schoolId: ctx.schoolId,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    };
    const record: ResultReportCardExportJob = {
      resultReportCardExportJobId: id,
      schoolId: ctx.schoolId,
      ...input,
      resultDeliveryReceiptId: input.resultDeliveryReceiptId || null,
      exportJobStatus: 'draft',
      blockedReasonCodesJson: input.blockedReasonCodesJson || null,
      sourceRefsJson: input.sourceRefsJson || null,
      allowedChannelsJson: input.allowedChannelsJson || null,
      blockedChannelsJson: input.blockedChannelsJson || null,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
      createdAt: now,
      updatedAt: now,
      validatedAt: null,
      queuedAt: null,
      completedAt: null,
      blockedAt: null,
      cancelledAt: null,
      voidedAt: null,
    };
    await this.jobRepo.create(createInput);
    await this.idempotencyService.startOperation(ctx.schoolId, 'createExportJob', ctx.idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createExportJob', ctx.idempotencyKey, 'ResultReportCardExportJob', id, 'Export job created');
    await this.auditBridge.recordExportJobCreated(ctx, id, `Export job created for assembly ${input.resultReportCardAssemblyId}`);
    return this.envelope(ctx, { resourceId: id, status: 'draft', safeMessage: 'Export job created successfully', reasonCode: 'EXPORT_JOB_CREATED', data: record });
  }

  async getExportJob(ctx: ResultReportCardCommandContext, jobId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const job = await this.jobRepo.getById(jobId);
    if (!job) return this.envelope(ctx, { ok: false, safeMessage: 'Export job not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: jobId, status: job.exportJobStatus, safeMessage: 'Export job found', data: job });
  }

  async listExportJobsForSchool(ctx: ResultReportCardCommandContext): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const jobs = await this.jobRepo.listBySchool(ctx.schoolId);
    return this.envelope(ctx, { safeMessage: `Found ${jobs.length} export jobs for school`, data: jobs });
  }

  async listExportJobsForStudent(ctx: ResultReportCardCommandContext, studentRef: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const jobs = await this.jobRepo.listByStudentRef(ctx.schoolId, studentRef);
    return this.envelope(ctx, { safeMessage: `Found ${jobs.length} export jobs for student`, data: jobs });
  }

  async listExportJobsForAssembly(ctx: ResultReportCardCommandContext, assemblyId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const jobs = await this.jobRepo.listByAssemblyId(assemblyId);
    return this.envelope(ctx, { safeMessage: `Found ${jobs.length} export jobs for assembly`, data: jobs });
  }

  async listExportJobsForExportIntent(ctx: ResultReportCardCommandContext, exportIntentId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const jobs = await this.jobRepo.listByExportIntentId(exportIntentId);
    return this.envelope(ctx, { safeMessage: `Found ${jobs.length} export jobs for export intent`, data: jobs });
  }

  async validateExportJob(ctx: ResultReportCardCommandContext, jobId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const job = await this.jobRepo.getById(jobId);
    if (!job) return this.envelope(ctx, { ok: false, safeMessage: 'Export job not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (job.exportJobStatus !== 'draft') return this.envelope(ctx, { ok: false, safeMessage: 'Export job must be in draft status to validate', reasonCode: 'INVALID_STATUS', status: 'error' });

    const now = new Date().toISOString();
    await this.jobRepo.updateStatus(jobId, { status: 'validated', reasonCode: 'VALIDATED', safeMessage: 'Export job validated' });
    await this.auditBridge.recordExportJobValidated(ctx, jobId, 'Export job validated');
    return this.envelope(ctx, { resourceId: jobId, status: 'validated', safeMessage: 'Export job validated', reasonCode: 'VALIDATED' });
  }

  async queueMockExportJob(ctx: ResultReportCardCommandContext, jobId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const job = await this.jobRepo.getById(jobId);
    if (!job) return this.envelope(ctx, { ok: false, safeMessage: 'Export job not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (job.exportJobStatus !== 'validated') return this.envelope(ctx, { ok: false, safeMessage: 'Export job must be validated before queueing mock export', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.jobRepo.updateStatus(jobId, { status: 'queued_mock', reasonCode: 'QUEUED_MOCK', safeMessage: 'Export job queued for mock export' });
    await this.auditBridge.recordExportJobQueuedMock(ctx, jobId, 'Export job queued for mock export');
    return this.envelope(ctx, { resourceId: jobId, status: 'queued_mock', safeMessage: 'Export job queued for mock export', reasonCode: 'QUEUED_MOCK' });
  }

  async markMockExported(ctx: ResultReportCardCommandContext, jobId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const job = await this.jobRepo.getById(jobId);
    if (!job) return this.envelope(ctx, { ok: false, safeMessage: 'Export job not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (job.exportJobStatus !== 'queued_mock') return this.envelope(ctx, { ok: false, safeMessage: 'Export job must be queued_mock before marking mock exported', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.jobRepo.updateStatus(jobId, { status: 'mock_exported', reasonCode: 'MOCK_EXPORTED', safeMessage: 'Export job mock exported' });
    await this.auditBridge.recordExportJobMockExported(ctx, jobId, 'Export job mock exported');
    return this.envelope(ctx, { resourceId: jobId, status: 'mock_exported', safeMessage: 'Export job mock exported', reasonCode: 'MOCK_EXPORTED' });
  }

  async markReceiptRecorded(ctx: ResultReportCardCommandContext, jobId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const job = await this.jobRepo.getById(jobId);
    if (!job) return this.envelope(ctx, { ok: false, safeMessage: 'Export job not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (job.exportJobStatus !== 'mock_exported') return this.envelope(ctx, { ok: false, safeMessage: 'Export job must be mock_exported before marking receipt recorded', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.jobRepo.updateStatus(jobId, { status: 'receipt_recorded', reasonCode: 'RECEIPT_RECORDED', safeMessage: 'Export job receipt recorded' });
    return this.envelope(ctx, { resourceId: jobId, status: 'receipt_recorded', safeMessage: 'Export job receipt recorded', reasonCode: 'RECEIPT_RECORDED' });
  }

  async markArchiveManifestReady(ctx: ResultReportCardCommandContext, jobId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const job = await this.jobRepo.getById(jobId);
    if (!job) return this.envelope(ctx, { ok: false, safeMessage: 'Export job not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (job.exportJobStatus !== 'receipt_recorded') return this.envelope(ctx, { ok: false, safeMessage: 'Export job must have receipt recorded before archive manifest ready', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.jobRepo.updateStatus(jobId, { status: 'archive_manifest_ready', reasonCode: 'ARCHIVE_MANIFEST_READY', safeMessage: 'Export job archive manifest ready' });
    return this.envelope(ctx, { resourceId: jobId, status: 'archive_manifest_ready', safeMessage: 'Export job archive manifest ready', reasonCode: 'ARCHIVE_MANIFEST_READY' });
  }

  async blockExportJob(ctx: ResultReportCardCommandContext, jobId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const job = await this.jobRepo.getById(jobId);
    if (!job) return this.envelope(ctx, { ok: false, safeMessage: 'Export job not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (job.exportJobStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided export job', reasonCode: 'INVALID_STATUS', status: 'error' });
    if (job.exportJobStatus === 'cancelled') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block cancelled export job', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.jobRepo.block(jobId, 'BLOCKED', 'Export job blocked');
    await this.auditBridge.recordPolicyBlocked(ctx, jobId, 'Export job blocked', null);
    return this.envelope(ctx, { resourceId: jobId, status: 'blocked', safeMessage: 'Export job blocked', reasonCode: 'BLOCKED' });
  }

  async cancelExportJob(ctx: ResultReportCardCommandContext, jobId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const job = await this.jobRepo.getById(jobId);
    if (!job) return this.envelope(ctx, { ok: false, safeMessage: 'Export job not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (job.exportJobStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot cancel voided export job', reasonCode: 'INVALID_STATUS', status: 'error' });
    if (job.exportJobStatus === 'cancelled') return this.envelope(ctx, { ok: false, safeMessage: 'Already cancelled', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.jobRepo.cancel(jobId, 'CANCELLED', 'Export job cancelled');
    return this.envelope(ctx, { resourceId: jobId, status: 'cancelled', safeMessage: 'Export job cancelled', reasonCode: 'CANCELLED' });
  }

  async voidExportJob(ctx: ResultReportCardCommandContext, jobId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const job = await this.jobRepo.getById(jobId);
    if (!job) return this.envelope(ctx, { ok: false, safeMessage: 'Export job not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (job.exportJobStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.jobRepo.void(jobId, 'VOIDED', 'Export job voided');
    return this.envelope(ctx, { resourceId: jobId, status: 'void', safeMessage: 'Export job voided', reasonCode: 'VOIDED' });
  }
}

import type { ResultReportCardExportAuditRepository } from '../contracts/resultReportCardExportRepositoryContracts';
import type { ResultReportCardCommandContext } from '../../result-report-card/contracts/resultReportCardContracts';
import { v4 as uuidv4 } from 'uuid';

export class ResultReportCardExportAuditBridge {
  constructor(private auditRepo: ResultReportCardExportAuditRepository) {}

  private async record(ctx: ResultReportCardCommandContext, event: {
    eventType: string; decision: string; safeSummary: string;
    reasonCodesJson?: Record<string, unknown> | null;
    metadataJson?: Record<string, unknown> | null;
    resultReportCardExportJobId?: string | null;
    resultReportCardExportTargetId?: string | null;
    resultReportCardExportEnvelopeId?: string | null;
    resultReportCardMockExportAttemptId?: string | null;
    resultReportCardExportReceiptId?: string | null;
    resultReportCardExportSuppressionId?: string | null;
    resultReportCardExportRetryPlanId?: string | null;
    resultReportCardArchiveManifestId?: string | null;
  }): Promise<void> {
    await this.auditRepo.create({
      resultReportCardExportAuditId: uuidv4(),
      schoolId: ctx.schoolId,
      ...event,
      resultReportCardExportJobId: event.resultReportCardExportJobId ?? null,
      resultReportCardExportTargetId: event.resultReportCardExportTargetId ?? null,
      resultReportCardExportEnvelopeId: event.resultReportCardExportEnvelopeId ?? null,
      resultReportCardMockExportAttemptId: event.resultReportCardMockExportAttemptId ?? null,
      resultReportCardExportReceiptId: event.resultReportCardExportReceiptId ?? null,
      resultReportCardExportSuppressionId: event.resultReportCardExportSuppressionId ?? null,
      resultReportCardExportRetryPlanId: event.resultReportCardExportRetryPlanId ?? null,
      resultReportCardArchiveManifestId: event.resultReportCardArchiveManifestId ?? null,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      requestId: ctx.correlationId || null,
      correlationId: ctx.correlationId || null,
      createdAt: new Date().toISOString(),
    });
  }

  async recordExportJobCreated(ctx: ResultReportCardCommandContext, jobId: string, summary: string): Promise<void> {
    await this.record(ctx, { eventType: 'EXPORT_JOB_CREATED', decision: 'allowed', safeSummary: summary, resultReportCardExportJobId: jobId });
  }
  async recordExportJobValidated(ctx: ResultReportCardCommandContext, jobId: string, summary: string): Promise<void> {
    await this.record(ctx, { eventType: 'EXPORT_JOB_VALIDATED', decision: 'allowed', safeSummary: summary, resultReportCardExportJobId: jobId });
  }
  async recordExportJobQueuedMock(ctx: ResultReportCardCommandContext, jobId: string, summary: string): Promise<void> {
    await this.record(ctx, { eventType: 'EXPORT_JOB_QUEUED_MOCK', decision: 'allowed', safeSummary: summary, resultReportCardExportJobId: jobId });
  }
  async recordExportJobMockExported(ctx: ResultReportCardCommandContext, jobId: string, summary: string): Promise<void> {
    await this.record(ctx, { eventType: 'EXPORT_JOB_MOCK_EXPORTED', decision: 'allowed', safeSummary: summary, resultReportCardExportJobId: jobId });
  }
  async recordTargetCreated(ctx: ResultReportCardCommandContext, targetId: string, jobId: string, summary: string): Promise<void> {
    await this.record(ctx, { eventType: 'EXPORT_TARGET_CREATED', decision: 'allowed', safeSummary: summary, resultReportCardExportJobId: jobId, resultReportCardExportTargetId: targetId });
  }
  async recordTargetValidated(ctx: ResultReportCardCommandContext, targetId: string, jobId: string, summary: string): Promise<void> {
    await this.record(ctx, { eventType: 'EXPORT_TARGET_VALIDATED', decision: 'allowed', safeSummary: summary, resultReportCardExportJobId: jobId, resultReportCardExportTargetId: targetId });
  }
  async recordEnvelopeComposed(ctx: ResultReportCardCommandContext, envelopeId: string, jobId: string, summary: string): Promise<void> {
    await this.record(ctx, { eventType: 'EXPORT_ENVELOPE_COMPOSED', decision: 'allowed', safeSummary: summary, resultReportCardExportJobId: jobId, resultReportCardExportEnvelopeId: envelopeId });
  }
  async recordEnvelopeSealed(ctx: ResultReportCardCommandContext, envelopeId: string, jobId: string, summary: string): Promise<void> {
    await this.record(ctx, { eventType: 'EXPORT_ENVELOPE_SEALED', decision: 'allowed', safeSummary: summary, resultReportCardExportJobId: jobId, resultReportCardExportEnvelopeId: envelopeId });
  }
  async recordMockExportAttemptCreated(ctx: ResultReportCardCommandContext, attemptId: string, jobId: string, summary: string): Promise<void> {
    await this.record(ctx, { eventType: 'MOCK_EXPORT_ATTEMPT_CREATED', decision: 'allowed', safeSummary: summary, resultReportCardExportJobId: jobId, resultReportCardMockExportAttemptId: attemptId });
  }
  async recordMockExportAttemptCompleted(ctx: ResultReportCardCommandContext, attemptId: string, jobId: string, summary: string): Promise<void> {
    await this.record(ctx, { eventType: 'MOCK_EXPORT_ATTEMPT_COMPLETED', decision: 'allowed', safeSummary: summary, resultReportCardExportJobId: jobId, resultReportCardMockExportAttemptId: attemptId });
  }
  async recordReceiptRecorded(ctx: ResultReportCardCommandContext, receiptId: string, jobId: string, summary: string): Promise<void> {
    await this.record(ctx, { eventType: 'EXPORT_RECEIPT_RECORDED', decision: 'allowed', safeSummary: summary, resultReportCardExportJobId: jobId, resultReportCardExportReceiptId: receiptId });
  }
  async recordSuppressionCreated(ctx: ResultReportCardCommandContext, suppressionId: string, jobId: string, summary: string): Promise<void> {
    await this.record(ctx, { eventType: 'EXPORT_SUPPRESSION_CREATED', decision: 'allowed', safeSummary: summary, resultReportCardExportJobId: jobId, resultReportCardExportSuppressionId: suppressionId });
  }
  async recordRetryPlanCreated(ctx: ResultReportCardCommandContext, planId: string, jobId: string, summary: string): Promise<void> {
    await this.record(ctx, { eventType: 'EXPORT_RETRY_PLAN_CREATED', decision: 'allowed', safeSummary: summary, resultReportCardExportJobId: jobId, resultReportCardExportRetryPlanId: planId });
  }
  async recordArchiveManifestCreated(ctx: ResultReportCardCommandContext, manifestId: string, jobId: string, summary: string): Promise<void> {
    await this.record(ctx, { eventType: 'ARCHIVE_MANIFEST_CREATED', decision: 'allowed', safeSummary: summary, resultReportCardExportJobId: jobId, resultReportCardArchiveManifestId: manifestId });
  }
  async recordArchiveManifestSealed(ctx: ResultReportCardCommandContext, manifestId: string, jobId: string, summary: string): Promise<void> {
    await this.record(ctx, { eventType: 'ARCHIVE_MANIFEST_SEALED', decision: 'allowed', safeSummary: summary, resultReportCardExportJobId: jobId, resultReportCardArchiveManifestId: manifestId });
  }
  async recordPolicyBlocked(ctx: ResultReportCardCommandContext, jobId: string | null, summary: string, reasonCodes: Record<string, unknown> | null): Promise<void> {
    await this.record(ctx, { eventType: 'POLICY_BLOCKED', decision: 'blocked', safeSummary: summary, reasonCodesJson: reasonCodes, resultReportCardExportJobId: jobId });
  }
  async recordSafeError(ctx: ResultReportCardCommandContext, jobId: string | null, summary: string, metadata: Record<string, unknown> | null): Promise<void> {
    await this.record(ctx, { eventType: 'SAFE_ERROR', decision: 'error', safeSummary: summary, metadataJson: metadata, resultReportCardExportJobId: jobId });
  }
}

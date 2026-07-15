import { v4 as uuidv4 } from 'uuid';
import type { ResultReportCardAccessAuditRepository } from '../contracts/resultReportCardAccessRepositoryContracts';
import type { ResultReportCardAccessCommandContext } from '../contracts/resultReportCardAccessContracts';

export class ResultReportCardAccessAuditBridge {
  constructor(private auditRepo: ResultReportCardAccessAuditRepository) {}

  private async record(ctx: ResultReportCardAccessCommandContext, event: {
    eventType: string; decision: string; safeSummary: string;
    reasonCodesJson?: Record<string, unknown> | null;
    metadataJson?: Record<string, unknown> | null;
    resultReportCardAccessGrantId?: string | null;
    resultReportCardAccessRecipientId?: string | null;
    resultReportCardPortalPreviewId?: string | null;
    resultReportCardAccessTokenIntentId?: string | null;
    resultReportCardAccessAcknowledgementId?: string | null;
    resultReportCardAccessRevocationId?: string | null;
    resultReportCardAccessExpiryId?: string | null;
    resultReportCardAccessTimelineId?: string | null;
  }): Promise<void> {
    await this.auditRepo.create({
      resultReportCardAccessAuditId: uuidv4(),
      schoolId: ctx.schoolId,
      ...event,
      reasonCodesJson: event.reasonCodesJson ?? null,
      metadataJson: event.metadataJson ?? null,
      resultReportCardAccessGrantId: event.resultReportCardAccessGrantId ?? null,
      resultReportCardAccessRecipientId: event.resultReportCardAccessRecipientId ?? null,
      resultReportCardPortalPreviewId: event.resultReportCardPortalPreviewId ?? null,
      resultReportCardAccessTokenIntentId: event.resultReportCardAccessTokenIntentId ?? null,
      resultReportCardAccessAcknowledgementId: event.resultReportCardAccessAcknowledgementId ?? null,
      resultReportCardAccessRevocationId: event.resultReportCardAccessRevocationId ?? null,
      resultReportCardAccessExpiryId: event.resultReportCardAccessExpiryId ?? null,
      resultReportCardAccessTimelineId: event.resultReportCardAccessTimelineId ?? null,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      requestId: ctx.correlationId || null,
      correlationId: ctx.correlationId || null,
      createdAt: new Date().toISOString(),
    });
  }

  async recordAccessGrantCreated(ctx: ResultReportCardAccessCommandContext, grantId: string, summary: string): Promise<void> {
    await this.record(ctx, { eventType: 'ACCESS_GRANT_CREATED', decision: 'allowed', safeSummary: summary, resultReportCardAccessGrantId: grantId });
  }

  async recordAccessGrantValidated(ctx: ResultReportCardAccessCommandContext, grantId: string, summary: string): Promise<void> {
    await this.record(ctx, { eventType: 'ACCESS_GRANT_VALIDATED', decision: 'allowed', safeSummary: summary, resultReportCardAccessGrantId: grantId });
  }

  async recordAccessGrantReady(ctx: ResultReportCardAccessCommandContext, grantId: string, summary: string): Promise<void> {
    await this.record(ctx, { eventType: 'ACCESS_GRANT_READY', decision: 'allowed', safeSummary: summary, resultReportCardAccessGrantId: grantId });
  }

  async recordRecipientCreated(ctx: ResultReportCardAccessCommandContext, recipientId: string, summary: string): Promise<void> {
    await this.record(ctx, { eventType: 'ACCESS_RECIPIENT_CREATED', decision: 'allowed', safeSummary: summary, resultReportCardAccessRecipientId: recipientId });
  }

  async recordRecipientValidated(ctx: ResultReportCardAccessCommandContext, recipientId: string, summary: string): Promise<void> {
    await this.record(ctx, { eventType: 'ACCESS_RECIPIENT_VALIDATED', decision: 'allowed', safeSummary: summary, resultReportCardAccessRecipientId: recipientId });
  }

  async recordPortalPreviewComposed(ctx: ResultReportCardAccessCommandContext, previewId: string, summary: string): Promise<void> {
    await this.record(ctx, { eventType: 'PORTAL_PREVIEW_COMPOSED', decision: 'allowed', safeSummary: summary, resultReportCardPortalPreviewId: previewId });
  }

  async recordPortalPreviewSealed(ctx: ResultReportCardAccessCommandContext, previewId: string, summary: string): Promise<void> {
    await this.record(ctx, { eventType: 'PORTAL_PREVIEW_SEALED', decision: 'allowed', safeSummary: summary, resultReportCardPortalPreviewId: previewId });
  }

  async recordTokenIntentCreated(ctx: ResultReportCardAccessCommandContext, tokenIntentId: string, summary: string): Promise<void> {
    await this.record(ctx, { eventType: 'TOKEN_INTENT_CREATED', decision: 'allowed', safeSummary: summary, resultReportCardAccessTokenIntentId: tokenIntentId });
  }

  async recordTokenIntentValidated(ctx: ResultReportCardAccessCommandContext, tokenIntentId: string, summary: string): Promise<void> {
    await this.record(ctx, { eventType: 'TOKEN_INTENT_VALIDATED', decision: 'allowed', safeSummary: summary, resultReportCardAccessTokenIntentId: tokenIntentId });
  }

  async recordAcknowledgementRecorded(ctx: ResultReportCardAccessCommandContext, acknowledgementId: string, summary: string): Promise<void> {
    await this.record(ctx, { eventType: 'ACCESS_ACKNOWLEDGEMENT_RECORDED', decision: 'allowed', safeSummary: summary, resultReportCardAccessAcknowledgementId: acknowledgementId });
  }

  async recordRevocationCreated(ctx: ResultReportCardAccessCommandContext, revocationId: string, summary: string): Promise<void> {
    await this.record(ctx, { eventType: 'ACCESS_REVOCATION_CREATED', decision: 'allowed', safeSummary: summary, resultReportCardAccessRevocationId: revocationId });
  }

  async recordRevocationApplied(ctx: ResultReportCardAccessCommandContext, revocationId: string, summary: string): Promise<void> {
    await this.record(ctx, { eventType: 'ACCESS_REVOCATION_APPLIED', decision: 'allowed', safeSummary: summary, resultReportCardAccessRevocationId: revocationId });
  }

  async recordExpiryCreated(ctx: ResultReportCardAccessCommandContext, expiryId: string, summary: string): Promise<void> {
    await this.record(ctx, { eventType: 'ACCESS_EXPIRY_CREATED', decision: 'allowed', safeSummary: summary, resultReportCardAccessExpiryId: expiryId });
  }

  async recordExpiryScheduled(ctx: ResultReportCardAccessCommandContext, expiryId: string, summary: string): Promise<void> {
    await this.record(ctx, { eventType: 'ACCESS_EXPIRY_SCHEDULED', decision: 'allowed', safeSummary: summary, resultReportCardAccessExpiryId: expiryId });
  }

  async recordExpiryApplied(ctx: ResultReportCardAccessCommandContext, expiryId: string, summary: string): Promise<void> {
    await this.record(ctx, { eventType: 'ACCESS_EXPIRY_APPLIED', decision: 'allowed', safeSummary: summary, resultReportCardAccessExpiryId: expiryId });
  }

  async recordTimelineEventRecorded(ctx: ResultReportCardAccessCommandContext, timelineId: string, summary: string): Promise<void> {
    await this.record(ctx, { eventType: 'ACCESS_TIMELINE_EVENT_RECORDED', decision: 'allowed', safeSummary: summary, resultReportCardAccessTimelineId: timelineId });
  }

  async recordSummaryCreated(ctx: ResultReportCardAccessCommandContext, summaryId: string, summary: string): Promise<void> {
    await this.record(ctx, { eventType: 'ACCESS_SUMMARY_CREATED', decision: 'allowed', safeSummary: summary });
  }

  async recordSummaryRefreshed(ctx: ResultReportCardAccessCommandContext, summaryId: string, summary: string): Promise<void> {
    await this.record(ctx, { eventType: 'ACCESS_SUMMARY_REFRESHED', decision: 'allowed', safeSummary: summary });
  }

  async recordPolicyBlocked(ctx: ResultReportCardAccessCommandContext, resourceId: string | null, summary: string, reasonCodes: Record<string, unknown> | null): Promise<void> {
    await this.record(ctx, { eventType: 'POLICY_BLOCKED', decision: 'blocked', safeSummary: summary, reasonCodesJson: reasonCodes, resultReportCardAccessGrantId: resourceId });
  }

  async recordSafeError(ctx: ResultReportCardAccessCommandContext, resourceId: string | null, summary: string, metadata: Record<string, unknown> | null): Promise<void> {
    await this.record(ctx, { eventType: 'SAFE_ERROR', decision: 'error', safeSummary: summary, metadataJson: metadata, resultReportCardAccessGrantId: resourceId });
  }
}

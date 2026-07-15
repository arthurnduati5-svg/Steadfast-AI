import type {
  ResultReportCardAccessTimelineStatus,
} from './resultReportCardAccessContracts';

export interface ResultReportCardAccessTimeline {
  resultReportCardAccessTimelineId: string;
  schoolId: string;
  resultReportCardAccessGrantId: string;
  resultReportCardAccessRecipientId: string | null;
  resultReportCardPortalPreviewId: string | null;
  resultReportCardAccessTokenIntentId: string | null;
  resultReportCardAccessAcknowledgementId: string | null;
  resultReportCardAccessRevocationId: string | null;
  resultReportCardAccessExpiryId: string | null;
  timelineStatus: ResultReportCardAccessTimelineStatus | string;
  eventType: string;
  safeEventSummary: string;
  eventPayloadJson: Record<string, unknown> | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  voidedAt: string | null;
}

export interface CreateAccessTimelineInput {
  resultReportCardAccessGrantId: string;
  resultReportCardAccessRecipientId?: string;
  resultReportCardPortalPreviewId?: string;
  resultReportCardAccessTokenIntentId?: string;
  resultReportCardAccessAcknowledgementId?: string;
  resultReportCardAccessRevocationId?: string;
  resultReportCardAccessExpiryId?: string;
  eventType: string;
  safeEventSummary: string;
  eventPayloadJson?: Record<string, unknown>;
}

export interface ResultReportCardAccessTimelinePreview {
  resultReportCardAccessTimelineId: string;
  schoolId: string;
  resultReportCardAccessGrantId: string;
  timelineStatus: string;
  eventType: string;
  safeEventSummary: string;
  createdAt: string;
}

export interface UpdateAccessTimelineStatusInput {
  status: ResultReportCardAccessTimelineStatus | string;
  reasonCode: string;
  safeMessage: string;
}

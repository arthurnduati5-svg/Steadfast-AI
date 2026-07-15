import type {
  ResultReportCardAccessExpiryStatus,
  ResultReportCardAccessExpiryScope,
} from './resultReportCardAccessContracts';

export interface ResultReportCardAccessExpiry {
  resultReportCardAccessExpiryId: string;
  schoolId: string;
  resultReportCardAccessGrantId: string;
  resultReportCardAccessRecipientId: string | null;
  resultReportCardPortalPreviewId: string | null;
  resultReportCardAccessTokenIntentId: string | null;
  expiryStatus: ResultReportCardAccessExpiryStatus | string;
  expiryScope: ResultReportCardAccessExpiryScope | string;
  expiresAt: string;
  safeExpirySummary: string;
  reasonCodesJson: Record<string, unknown> | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  scheduledAt: string | null;
  appliedAt: string | null;
  cancelledAt: string | null;
  voidedAt: string | null;
}

export interface CreateAccessExpiryInput {
  resultReportCardAccessGrantId: string;
  resultReportCardAccessRecipientId?: string;
  resultReportCardPortalPreviewId?: string;
  resultReportCardAccessTokenIntentId?: string;
  expiryScope: ResultReportCardAccessExpiryScope | string;
  expiresAt: string;
  safeExpirySummary: string;
  reasonCodesJson?: Record<string, unknown>;
}

export interface ResultReportCardAccessExpiryPreview {
  resultReportCardAccessExpiryId: string;
  schoolId: string;
  resultReportCardAccessGrantId: string;
  expiryStatus: string;
  expiryScope: string;
  expiresAt: string;
  safeExpirySummary: string;
  createdAt: string;
}

export interface UpdateAccessExpiryStatusInput {
  status: ResultReportCardAccessExpiryStatus | string;
  reasonCode: string;
  safeMessage: string;
}

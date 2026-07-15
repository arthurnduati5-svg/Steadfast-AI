import type {
  ResultReportCardAccessRevocationStatus,
  ResultReportCardAccessRevocationScope,
} from './resultReportCardAccessContracts';

export interface ResultReportCardAccessRevocation {
  resultReportCardAccessRevocationId: string;
  schoolId: string;
  resultReportCardAccessGrantId: string;
  resultReportCardAccessRecipientId: string | null;
  resultReportCardPortalPreviewId: string | null;
  resultReportCardAccessTokenIntentId: string | null;
  resultReportCardAccessAcknowledgementId: string | null;
  revocationStatus: ResultReportCardAccessRevocationStatus | string;
  revocationScope: ResultReportCardAccessRevocationScope | string;
  revocationReason: string;
  safeRevocationSummary: string;
  reasonCodesJson: Record<string, unknown> | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  appliedAt: string | null;
  voidedAt: string | null;
}

export interface CreateAccessRevocationInput {
  resultReportCardAccessGrantId: string;
  resultReportCardAccessRecipientId?: string;
  resultReportCardPortalPreviewId?: string;
  resultReportCardAccessTokenIntentId?: string;
  resultReportCardAccessAcknowledgementId?: string;
  revocationScope: ResultReportCardAccessRevocationScope | string;
  revocationReason: string;
  safeRevocationSummary: string;
  reasonCodesJson?: Record<string, unknown>;
}

export interface ResultReportCardAccessRevocationPreview {
  resultReportCardAccessRevocationId: string;
  schoolId: string;
  resultReportCardAccessGrantId: string;
  revocationStatus: string;
  revocationScope: string;
  revocationReason: string;
  safeRevocationSummary: string;
  createdAt: string;
}

export interface UpdateAccessRevocationStatusInput {
  status: ResultReportCardAccessRevocationStatus | string;
  reasonCode: string;
  safeMessage: string;
}

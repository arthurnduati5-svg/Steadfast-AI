import type {
  ResultReportCardPortalPreviewStatus,
  ResultReportCardPortalPreviewMode,
} from './resultReportCardAccessContracts';

export interface ResultReportCardPortalPreview {
  resultReportCardPortalPreviewId: string;
  schoolId: string;
  resultReportCardAccessGrantId: string;
  resultReportCardAccessRecipientId: string;
  previewStatus: ResultReportCardPortalPreviewStatus | string;
  previewMode: ResultReportCardPortalPreviewMode | string;
  safePreviewSummary: string;
  safePayloadJson: Record<string, unknown> | null;
  redactionRulesJson: Record<string, unknown> | null;
  allowedFieldNamesJson: Record<string, unknown> | null;
  blockedFieldNamesJson: Record<string, unknown> | null;
  blockedReasonCodesJson: Record<string, unknown> | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  sealedAt: string | null;
  suppressedAt: string | null;
  blockedAt: string | null;
  voidedAt: string | null;
}

export interface CreatePortalPreviewInput {
  resultReportCardAccessGrantId: string;
  resultReportCardAccessRecipientId: string;
  previewMode: ResultReportCardPortalPreviewMode | string;
  safePreviewSummary: string;
  safePayloadJson?: Record<string, unknown>;
  redactionRulesJson?: Record<string, unknown>;
  allowedFieldNamesJson?: Record<string, unknown>;
  blockedFieldNamesJson?: Record<string, unknown>;
  blockedReasonCodesJson?: Record<string, unknown>;
}

export interface ResultReportCardPortalPreviewPreview {
  resultReportCardPortalPreviewId: string;
  schoolId: string;
  resultReportCardAccessGrantId: string;
  resultReportCardAccessRecipientId: string;
  previewStatus: string;
  previewMode: string;
  safePreviewSummary: string;
  createdAt: string;
}

export interface UpdatePortalPreviewStatusInput {
  status: ResultReportCardPortalPreviewStatus | string;
  reasonCode: string;
  safeMessage: string;
}

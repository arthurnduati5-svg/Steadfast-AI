import type {
  ResultReportCardAccessGrantStatus,
  ResultReportCardAccessGrantMode,
} from './resultReportCardAccessContracts';

export interface ResultReportCardAccessGrant {
  resultReportCardAccessGrantId: string;
  schoolId: string;
  resultReportCardAssemblyId: string;
  resultReportCardAudienceProjectionId: string;
  resultReportCardReviewId: string;
  studentRef: string;
  audienceType: string;
  resultReportCardExportJobId: string;
  resultReportCardExportTargetId: string;
  resultReportCardExportEnvelopeId: string;
  resultReportCardExportReceiptId: string | null;
  resultReportCardArchiveManifestId: string | null;
  resultReleasePacketId: string;
  paperId: string;
  paperVersionId: string;
  deliverySessionId: string;
  grantStatus: ResultReportCardAccessGrantStatus | string;
  grantMode: ResultReportCardAccessGrantMode | string;
  grantPurpose: string;
  safeGrantSummary: string;
  sourceRefsJson: Record<string, unknown> | null;
  allowedChannelsJson: Record<string, unknown> | null;
  blockedChannelsJson: Record<string, unknown> | null;
  blockedReasonCodesJson: Record<string, unknown> | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  validatedAt: string | null;
  readyAt: string | null;
  suppressedAt: string | null;
  revokedAt: string | null;
  expiredAt: string | null;
  blockedAt: string | null;
  voidedAt: string | null;
}

export interface CreateAccessGrantInput {
  resultReportCardAssemblyId: string;
  resultReportCardAudienceProjectionId: string;
  resultReportCardReviewId: string;
  studentRef: string;
  audienceType: string;
  resultReportCardExportJobId: string;
  resultReportCardExportTargetId: string;
  resultReportCardExportEnvelopeId: string;
  resultReportCardExportReceiptId?: string;
  resultReportCardArchiveManifestId?: string;
  resultReleasePacketId: string;
  paperId: string;
  paperVersionId: string;
  deliverySessionId: string;
  grantMode: ResultReportCardAccessGrantMode | string;
  grantPurpose: string;
  safeGrantSummary: string;
  sourceRefsJson?: Record<string, unknown>;
  allowedChannelsJson?: Record<string, unknown>;
  blockedChannelsJson?: Record<string, unknown>;
  blockedReasonCodesJson?: Record<string, unknown>;
}

export interface ResultReportCardAccessGrantPreview {
  resultReportCardAccessGrantId: string;
  schoolId: string;
  grantStatus: string;
  grantMode: string;
  grantPurpose: string;
  safeGrantSummary: string;
  studentRef: string;
  audienceType: string;
  resultReportCardExportJobId: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateAccessGrantStatusInput {
  status: ResultReportCardAccessGrantStatus | string;
  reasonCode: string;
  safeMessage: string;
}

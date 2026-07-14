import type {
  ResultReportCardExportJobStatus,
  ResultReportCardExportMode,
} from './resultReportCardExportContracts';

export interface ResultReportCardExportJob {
  resultReportCardExportJobId: string;
  schoolId: string;
  resultReportCardAssemblyId: string;
  resultReportCardAudienceProjectionId: string;
  resultReportCardReviewId: string;
  resultReportCardExportIntentId: string;
  resultReportCardRenderManifestId: string;
  resultReleasePacketId: string;
  resultDeliveryReceiptId: string | null;
  studentRef: string;
  paperId: string;
  paperVersionId: string;
  deliverySessionId: string;
  exportJobStatus: ResultReportCardExportJobStatus | string;
  exportJobMode: ResultReportCardExportMode | string;
  exportJobPurpose: string;
  safeExportJobSummary: string;
  sourceRefsJson: Record<string, unknown> | null;
  allowedChannelsJson: Record<string, unknown> | null;
  blockedChannelsJson: Record<string, unknown> | null;
  blockedReasonCodesJson: Record<string, unknown> | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  validatedAt: string | null;
  queuedAt: string | null;
  completedAt: string | null;
  blockedAt: string | null;
  cancelledAt: string | null;
  voidedAt: string | null;
}

export interface CreateExportJobInput {
  resultReportCardAssemblyId: string;
  resultReportCardAudienceProjectionId: string;
  resultReportCardReviewId: string;
  resultReportCardExportIntentId: string;
  resultReportCardRenderManifestId: string;
  resultReleasePacketId: string;
  resultDeliveryReceiptId?: string;
  studentRef: string;
  paperId: string;
  paperVersionId: string;
  deliverySessionId: string;
  exportJobMode: ResultReportCardExportMode | string;
  exportJobPurpose: string;
  safeExportJobSummary: string;
  sourceRefsJson?: Record<string, unknown>;
  allowedChannelsJson?: Record<string, unknown>;
  blockedChannelsJson?: Record<string, unknown>;
  blockedReasonCodesJson?: Record<string, unknown>;
}

export interface ResultReportCardExportJobPreview {
  resultReportCardExportJobId: string;
  schoolId: string;
  exportJobStatus: string;
  exportJobMode: string;
  exportJobPurpose: string;
  safeExportJobSummary: string;
  studentRef: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateExportJobStatusInput {
  status: ResultReportCardExportJobStatus | string;
  reasonCode: string;
  safeMessage: string;
}

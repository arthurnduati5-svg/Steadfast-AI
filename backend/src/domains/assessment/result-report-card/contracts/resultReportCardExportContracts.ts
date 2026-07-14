import type { ResultReportCardExportIntentStatus, ResultReportCardExportChannel, ResultReportCardExportMode } from './resultReportCardContracts';

export interface ResultReportCardExportIntent {
  resultReportCardExportIntentId: string;
  schoolId: string;
  resultReportCardAssemblyId: string;
  resultReportCardReviewId: string;
  resultReportCardAudienceProjectionId: string;
  exportStatus: ResultReportCardExportIntentStatus | string;
  exportChannel: ResultReportCardExportChannel | string;
  exportMode: ResultReportCardExportMode | string;
  safeExportIntentSummary: string;
  blockedReasonCodesJson: Record<string, unknown> | null;
  sourceRefsJson: Record<string, unknown> | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  eligibleAt: string | null;
  blockedAt: string | null;
  voidedAt: string | null;
}

export interface CreateExportIntentInput {
  resultReportCardAssemblyId: string;
  resultReportCardReviewId: string;
  resultReportCardAudienceProjectionId: string;
  exportChannel: ResultReportCardExportChannel | string;
  exportMode: ResultReportCardExportMode | string;
  safeExportIntentSummary: string;
  blockedReasonCodesJson?: Record<string, unknown>;
  sourceRefsJson?: Record<string, unknown>;
}

export interface ResultReportCardExportIntentPreview {
  resultReportCardExportIntentId: string;
  schoolId: string;
  resultReportCardAssemblyId: string;
  exportStatus: string;
  exportChannel: string;
  exportMode: string;
  safeExportIntentSummary: string;
  createdAt: string;
}

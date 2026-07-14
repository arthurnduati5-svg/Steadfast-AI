import type {
  ResultReportCardExportSuppressionStatus,
  ResultReportCardExportSuppressionScope,
} from './resultReportCardExportContracts';

export interface ResultReportCardExportSuppression {
  resultReportCardExportSuppressionId: string;
  schoolId: string;
  resultReportCardExportJobId: string;
  resultReportCardExportTargetId: string | null;
  resultReportCardExportEnvelopeId: string | null;
  suppressionStatus: ResultReportCardExportSuppressionStatus | string;
  suppressionReason: string;
  suppressionScope: ResultReportCardExportSuppressionScope | string;
  safeSuppressionSummary: string;
  reasonCodesJson: Record<string, unknown> | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  liftedAt: string | null;
  voidedAt: string | null;
}

export interface CreateExportSuppressionInput {
  resultReportCardExportJobId: string;
  resultReportCardExportTargetId?: string;
  resultReportCardExportEnvelopeId?: string;
  suppressionReason: string;
  suppressionScope: ResultReportCardExportSuppressionScope | string;
  safeSuppressionSummary: string;
  reasonCodesJson?: Record<string, unknown>;
}

export interface ResultReportCardExportSuppressionPreview {
  resultReportCardExportSuppressionId: string;
  schoolId: string;
  resultReportCardExportJobId: string;
  suppressionStatus: string;
  suppressionReason: string;
  suppressionScope: string;
  safeSuppressionSummary: string;
  createdAt: string;
}

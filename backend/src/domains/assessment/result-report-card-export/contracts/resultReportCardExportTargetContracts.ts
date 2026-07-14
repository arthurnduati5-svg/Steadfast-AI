import type {
  ResultReportCardExportTargetStatus,
  ResultReportCardExportTargetType,
} from './resultReportCardExportContracts';
import type { ResultReportCardAudienceType } from '../../result-report-card/contracts/resultReportCardContracts';

export interface ResultReportCardExportTarget {
  resultReportCardExportTargetId: string;
  schoolId: string;
  resultReportCardExportJobId: string;
  targetType: ResultReportCardExportTargetType | string;
  targetStatus: ResultReportCardExportTargetStatus | string;
  targetMode: string;
  audienceType: ResultReportCardAudienceType | string;
  safeTargetSummary: string;
  targetDescriptorJson: Record<string, unknown> | null;
  blockedReasonCodesJson: Record<string, unknown> | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  validatedAt: string | null;
  blockedAt: string | null;
  voidedAt: string | null;
}

export interface CreateExportTargetInput {
  resultReportCardExportJobId: string;
  targetType: ResultReportCardExportTargetType | string;
  targetMode: string;
  audienceType: ResultReportCardAudienceType | string;
  safeTargetSummary: string;
  targetDescriptorJson?: Record<string, unknown>;
  blockedReasonCodesJson?: Record<string, unknown>;
}

export interface ResultReportCardExportTargetPreview {
  resultReportCardExportTargetId: string;
  schoolId: string;
  resultReportCardExportJobId: string;
  targetType: string;
  targetStatus: string;
  safeTargetSummary: string;
  createdAt: string;
}

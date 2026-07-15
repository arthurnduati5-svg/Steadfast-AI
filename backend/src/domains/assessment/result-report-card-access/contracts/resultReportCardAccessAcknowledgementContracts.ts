import type {
  ResultReportCardAccessAcknowledgementStatus,
  ResultReportCardAccessAcknowledgementType,
} from './resultReportCardAccessContracts';

export interface ResultReportCardAccessAcknowledgement {
  resultReportCardAccessAcknowledgementId: string;
  schoolId: string;
  resultReportCardAccessGrantId: string;
  resultReportCardAccessRecipientId: string;
  resultReportCardPortalPreviewId: string;
  acknowledgementStatus: ResultReportCardAccessAcknowledgementStatus | string;
  acknowledgementType: ResultReportCardAccessAcknowledgementType | string;
  safeAcknowledgementSummary: string;
  providerSimulationJson: Record<string, unknown> | null;
  blockedReasonCodesJson: Record<string, unknown> | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  blockedAt: string | null;
  voidedAt: string | null;
}

export interface CreateAccessAcknowledgementInput {
  resultReportCardAccessGrantId: string;
  resultReportCardAccessRecipientId: string;
  resultReportCardPortalPreviewId: string;
  acknowledgementType: ResultReportCardAccessAcknowledgementType | string;
  safeAcknowledgementSummary: string;
  providerSimulationJson?: Record<string, unknown>;
  blockedReasonCodesJson?: Record<string, unknown>;
}

export interface ResultReportCardAccessAcknowledgementPreview {
  resultReportCardAccessAcknowledgementId: string;
  schoolId: string;
  resultReportCardAccessGrantId: string;
  acknowledgementStatus: string;
  acknowledgementType: string;
  safeAcknowledgementSummary: string;
  createdAt: string;
}

export interface UpdateAccessAcknowledgementStatusInput {
  status: ResultReportCardAccessAcknowledgementStatus | string;
  reasonCode: string;
  safeMessage: string;
}

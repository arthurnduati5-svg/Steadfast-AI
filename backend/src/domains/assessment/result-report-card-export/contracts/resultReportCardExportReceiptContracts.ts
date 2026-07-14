import type {
  ResultReportCardExportReceiptStatus,
  ResultReportCardExportReceiptType,
} from './resultReportCardExportContracts';

export interface ResultReportCardExportReceipt {
  resultReportCardExportReceiptId: string;
  schoolId: string;
  resultReportCardExportJobId: string;
  resultReportCardExportTargetId: string;
  resultReportCardExportEnvelopeId: string;
  resultReportCardMockExportAttemptId: string;
  receiptStatus: ResultReportCardExportReceiptStatus | string;
  receiptType: ResultReportCardExportReceiptType | string;
  safeReceiptSummary: string;
  providerSimulationJson: Record<string, unknown> | null;
  blockedReasonCodesJson: Record<string, unknown> | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  voidedAt: string | null;
}

export interface CreateExportReceiptInput {
  resultReportCardExportJobId: string;
  resultReportCardExportTargetId: string;
  resultReportCardExportEnvelopeId: string;
  resultReportCardMockExportAttemptId: string;
  receiptType: ResultReportCardExportReceiptType | string;
  safeReceiptSummary: string;
  providerSimulationJson?: Record<string, unknown>;
  blockedReasonCodesJson?: Record<string, unknown>;
}

export interface ResultReportCardExportReceiptPreview {
  resultReportCardExportReceiptId: string;
  schoolId: string;
  resultReportCardExportJobId: string;
  receiptStatus: string;
  receiptType: string;
  safeReceiptSummary: string;
  createdAt: string;
}

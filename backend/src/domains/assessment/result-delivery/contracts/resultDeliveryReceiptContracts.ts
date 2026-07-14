import type { ResultDeliveryReceiptStatus, ResultDeliveryReceiptType } from './resultDeliveryContracts';

export interface ResultDeliveryReceipt {
  resultDeliveryReceiptId: string;
  schoolId: string;
  resultDeliveryAttemptId: string;
  resultDeliveryJobId: string;
  resultDeliveryRecipientId: string;
  resultDeliveryChannelEnvelopeId: string;
  receiptStatus: ResultDeliveryReceiptStatus;
  receiptType: ResultDeliveryReceiptType;
  safeReceiptSummary: string;
  providerSimulationJson: Record<string, unknown> | null;
  blockedReasonCodesJson: Record<string, unknown> | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  voidedAt: string | null;
}

export interface CreateReceiptInput {
  resultDeliveryAttemptId: string;
  resultDeliveryJobId: string;
  resultDeliveryRecipientId: string;
  resultDeliveryChannelEnvelopeId: string;
  receiptType: ResultDeliveryReceiptType;
  safeReceiptSummary: string;
  providerSimulationJson?: Record<string, unknown> | null;
  blockedReasonCodesJson?: Record<string, unknown> | null;
}

export interface ResultDeliveryReceiptPreview {
  resultDeliveryReceiptId: string;
  receiptType: string;
  receiptStatus: string;
  safeReceiptSummary: string;
  createdAt: string;
}

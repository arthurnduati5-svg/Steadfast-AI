import type { ResultDeliveryAttemptStatus, ResultDeliveryAttemptMode, ResultDeliveryChannel } from './resultDeliveryContracts';

export interface ResultDeliveryAttempt {
  resultDeliveryAttemptId: string;
  schoolId: string;
  resultDeliveryJobId: string;
  resultDeliveryRecipientId: string;
  resultDeliveryChannelEnvelopeId: string;
  deliveryChannel: ResultDeliveryChannel;
  attemptStatus: ResultDeliveryAttemptStatus;
  attemptMode: ResultDeliveryAttemptMode;
  mockProviderName: string;
  safeAttemptSummary: string;
  attemptNumber: number;
  blockedReasonCodesJson: Record<string, unknown> | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  blockedAt: string | null;
  voidedAt: string | null;
}

export interface CreateMockAttemptInput {
  resultDeliveryJobId: string;
  resultDeliveryRecipientId: string;
  resultDeliveryChannelEnvelopeId: string;
  deliveryChannel: ResultDeliveryChannel;
  attemptMode: ResultDeliveryAttemptMode;
  mockProviderName: string;
  safeAttemptSummary: string;
  attemptNumber: number;
  blockedReasonCodesJson?: Record<string, unknown> | null;
}

export interface ResultDeliveryAttemptPreview {
  resultDeliveryAttemptId: string;
  deliveryChannel: string;
  attemptStatus: string;
  attemptMode: string;
  mockProviderName: string;
  safeAttemptSummary: string;
  attemptNumber: number;
  createdAt: string;
}

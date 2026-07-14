import type { ResultReleaseDeliveryIntentStatus, ResultReleaseDeliveryChannel } from './resultReleaseContracts';

export interface ResultReleaseDeliveryIntent {
  resultReleaseDeliveryIntentId: string;
  schoolId: string;
  resultReleasePacketId: string;
  resultReleaseApprovalId: string;
  studentRef: string;
  audienceType: string;
  deliveryChannel: ResultReleaseDeliveryChannel;
  intentStatus: ResultReleaseDeliveryIntentStatus;
  safeIntentSummary: string;
  blockedReasonCodesJson?: Record<string, unknown>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  blockedAt?: string;
  voidedAt?: string;
}

export interface CreateDeliveryIntentInput {
  schoolId: string;
  resultReleasePacketId: string;
  resultReleaseApprovalId: string;
  studentRef: string;
  audienceType: string;
  deliveryChannel: ResultReleaseDeliveryChannel;
  safeIntentSummary: string;
  blockedReasonCodesJson?: Record<string, unknown>;
  createdByActorId: string;
  createdByRole: string;
}

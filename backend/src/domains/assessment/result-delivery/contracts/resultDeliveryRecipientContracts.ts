import type { ResultDeliveryRecipientStatus, ResultDeliveryRecipientScope, ResultDeliveryAudienceType } from './resultDeliveryContracts';

export interface ResultDeliveryRecipient {
  resultDeliveryRecipientId: string;
  schoolId: string;
  resultDeliveryJobId: string;
  studentRef: string;
  audienceType: ResultDeliveryAudienceType;
  recipientScope: ResultDeliveryRecipientScope;
  recipientStatus: ResultDeliveryRecipientStatus;
  recipientRefHash: string;
  recipientDisplayLabel: string;
  relationshipToStudent: string;
  resolutionSource: string;
  safeRecipientSummary: string;
  blockedReasonCodesJson: Record<string, unknown> | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  verifiedAt: string | null;
  blockedAt: string | null;
  voidedAt: string | null;
}

export interface CreateRecipientInput {
  resultDeliveryJobId: string;
  studentRef: string;
  audienceType: ResultDeliveryAudienceType;
  recipientScope: ResultDeliveryRecipientScope;
  recipientRefHash: string;
  recipientDisplayLabel: string;
  relationshipToStudent: string;
  resolutionSource: string;
  safeRecipientSummary: string;
  blockedReasonCodesJson?: Record<string, unknown> | null;
}

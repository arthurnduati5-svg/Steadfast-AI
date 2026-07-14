import type { ResultDeliveryChannelEnvelopeStatus, ResultDeliveryAudienceType, ResultDeliveryChannel } from './resultDeliveryContracts';

export interface ResultDeliveryChannelEnvelope {
  resultDeliveryChannelEnvelopeId: string;
  schoolId: string;
  resultDeliveryJobId: string;
  resultDeliveryRecipientId: string;
  resultAudienceProjectionId: string;
  envelopeStatus: ResultDeliveryChannelEnvelopeStatus;
  audienceType: ResultDeliveryAudienceType;
  deliveryChannel: ResultDeliveryChannel;
  safeSubject: string;
  safePreview: string;
  safeBodyJson: Record<string, unknown> | null;
  allowedFieldNamesJson: Record<string, unknown> | null;
  blockedFieldNamesJson: Record<string, unknown> | null;
  redactionRulesJson: Record<string, unknown> | null;
  sourceRefsJson: Record<string, unknown> | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  sealedAt: string | null;
  blockedAt: string | null;
  voidedAt: string | null;
}

export interface CreateChannelEnvelopeInput {
  resultDeliveryJobId: string;
  resultDeliveryRecipientId: string;
  resultAudienceProjectionId: string;
  audienceType: ResultDeliveryAudienceType;
  deliveryChannel: ResultDeliveryChannel;
  safeSubject: string;
  safePreview: string;
  safeBodyJson?: Record<string, unknown> | null;
  allowedFieldNamesJson?: Record<string, unknown> | null;
  blockedFieldNamesJson?: Record<string, unknown> | null;
  redactionRulesJson?: Record<string, unknown> | null;
  sourceRefsJson?: Record<string, unknown> | null;
}

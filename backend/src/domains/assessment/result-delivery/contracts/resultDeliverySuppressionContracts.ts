import type { ResultDeliverySuppressionStatus, ResultDeliverySuppressionType } from './resultDeliveryContracts';

export interface ResultDeliverySuppression {
  resultDeliverySuppressionId: string;
  schoolId: string;
  resultDeliveryJobId: string;
  resultDeliveryRecipientId: string | null;
  resultDeliveryChannelEnvelopeId: string | null;
  suppressionStatus: ResultDeliverySuppressionStatus;
  suppressionType: ResultDeliverySuppressionType;
  suppressionReasonCode: string;
  safeSuppressionSummary: string;
  sourceRefsJson: Record<string, unknown> | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  clearedAt: string | null;
  voidedAt: string | null;
}

export interface CreateSuppressionInput {
  resultDeliveryJobId: string;
  resultDeliveryRecipientId?: string | null;
  resultDeliveryChannelEnvelopeId?: string | null;
  suppressionType: ResultDeliverySuppressionType;
  suppressionReasonCode: string;
  safeSuppressionSummary: string;
  sourceRefsJson?: Record<string, unknown> | null;
}

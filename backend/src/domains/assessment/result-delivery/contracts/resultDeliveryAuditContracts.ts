export interface ResultDeliveryAuditEvent {
  resultDeliveryAuditId: string;
  schoolId: string;
  resultDeliveryJobId: string | null;
  resultDeliveryRecipientId: string | null;
  resultDeliveryChannelEnvelopeId: string | null;
  resultDeliveryAttemptId: string | null;
  resultDeliveryReceiptId: string | null;
  resultDeliverySuppressionId: string | null;
  resultDeliveryRetryPlanId: string | null;
  actorId: string;
  actorRole: string;
  eventType: string;
  decision: string;
  safeSummary: string;
  reasonCodesJson: Record<string, unknown> | null;
  metadataJson: Record<string, unknown> | null;
  requestId: string | null;
  correlationId: string | null;
  createdAt: string;
}

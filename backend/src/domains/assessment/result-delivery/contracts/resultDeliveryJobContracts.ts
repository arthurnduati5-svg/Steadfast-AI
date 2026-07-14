import type { ResultDeliveryJobStatus, ResultDeliveryJobMode, ResultDeliveryChannel, ResultDeliveryAudienceType } from './resultDeliveryContracts';

export interface ResultDeliveryJob {
  resultDeliveryJobId: string;
  schoolId: string;
  resultReleaseDeliveryIntentId: string;
  resultReleasePacketId: string;
  resultReleaseApprovalId: string;
  resultAudienceProjectionId: string;
  studentRef: string;
  audienceType: ResultDeliveryAudienceType;
  deliveryChannel: ResultDeliveryChannel;
  jobStatus: ResultDeliveryJobStatus;
  jobMode: ResultDeliveryJobMode;
  safeJobSummary: string;
  sourceRefsJson: Record<string, unknown> | null;
  allowedFieldsJson: Record<string, unknown> | null;
  blockedFieldsJson: Record<string, unknown> | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  validatedAt: string | null;
  queuedAt: string | null;
  completedAt: string | null;
  blockedAt: string | null;
  cancelledAt: string | null;
  voidedAt: string | null;
}

export interface CreateDeliveryJobInput {
  resultReleaseDeliveryIntentId: string;
  resultReleasePacketId: string;
  resultReleaseApprovalId: string;
  resultAudienceProjectionId: string;
  studentRef: string;
  audienceType: ResultDeliveryAudienceType;
  deliveryChannel: ResultDeliveryChannel;
  jobMode: ResultDeliveryJobMode;
  safeJobSummary: string;
  sourceRefsJson?: Record<string, unknown> | null;
  allowedFieldsJson?: Record<string, unknown> | null;
  blockedFieldsJson?: Record<string, unknown> | null;
}

export interface ResultDeliveryJobPreview {
  resultDeliveryJobId: string;
  schoolId: string;
  studentRef: string;
  audienceType: string;
  deliveryChannel: string;
  jobStatus: string;
  jobMode: string;
  safeJobSummary: string;
  createdAt: string;
  updatedAt: string;
}

import type { ResultAudienceProjectionStatus } from './resultReleaseContracts';

export interface ResultAudienceProjection {
  resultAudienceProjectionId: string;
  schoolId: string;
  resultReleasePacketId: string;
  studentRef: string;
  audienceType: string;
  projectionStatus: ResultAudienceProjectionStatus;
  projectionVersion: number;
  safeProjectionJson?: Record<string, unknown>;
  allowedFieldsJson?: Record<string, unknown>;
  blockedFieldsJson?: Record<string, unknown>;
  redactionRulesJson?: Record<string, unknown>;
  safeProjectionSummary: string;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  voidedAt?: string;
}

export interface CreateAudienceProjectionInput {
  schoolId: string;
  resultReleasePacketId: string;
  studentRef: string;
  audienceType: string;
  safeProjectionJson?: Record<string, unknown>;
  allowedFieldsJson?: Record<string, unknown>;
  blockedFieldsJson?: Record<string, unknown>;
  redactionRulesJson?: Record<string, unknown>;
  safeProjectionSummary: string;
  createdByActorId: string;
  createdByRole: string;
}

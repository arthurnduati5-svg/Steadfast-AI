import type { ResultReleasePacketStatus, ResultReleasePacketAudience, ResultReleasePacketMode } from './resultReleaseContracts';

export interface ResultReleasePacket {
  resultReleasePacketId: string;
  schoolId: string;
  resultFinalizationDecisionId: string;
  resultReleaseReadinessId: string;
  resultReleaseBoundaryId: string;
  resultLearningEvidenceBridgeId?: string;
  markingResultVersionId: string;
  studentRef: string;
  paperId?: string;
  paperVersionId?: string;
  deliverySessionId?: string;
  packetStatus: ResultReleasePacketStatus;
  packetAudience: ResultReleasePacketAudience;
  packetMode: ResultReleasePacketMode;
  safePacketSummary: string;
  allowedFieldsJson?: Record<string, unknown>;
  blockedFieldsJson?: Record<string, unknown>;
  sourceRefsJson?: Record<string, unknown>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  blockedAt?: string;
  cancelledAt?: string;
  voidedAt?: string;
}

export interface CreateReleasePacketInput {
  schoolId: string;
  resultFinalizationDecisionId: string;
  resultReleaseReadinessId: string;
  resultReleaseBoundaryId: string;
  resultLearningEvidenceBridgeId?: string;
  markingResultVersionId: string;
  studentRef: string;
  paperId?: string;
  paperVersionId?: string;
  deliverySessionId?: string;
  packetAudience: ResultReleasePacketAudience;
  packetMode: ResultReleasePacketMode;
  safePacketSummary: string;
  allowedFieldsJson?: Record<string, unknown>;
  blockedFieldsJson?: Record<string, unknown>;
  sourceRefsJson?: Record<string, unknown>;
  createdByActorId: string;
  createdByRole: string;
}

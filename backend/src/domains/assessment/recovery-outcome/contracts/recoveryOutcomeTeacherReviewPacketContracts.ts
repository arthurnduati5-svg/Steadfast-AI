import { RecoveryOutcomeDecisionStatus } from './recoveryOutcomeContracts';

export interface RecoveryOutcomeTeacherReviewPacket {
  recoveryOutcomeTeacherReviewPacketId: string;
  schoolId: string;
  studentRef: string;
  teacherRef: string;
  resultRecoveryPlanId: string;
  recoveryOutcomeDecisionReadinessId?: string;
  recoveryEvidenceRollupId?: string;
  recoveryProgressSummaryId?: string;
  packetStatus: RecoveryOutcomeDecisionStatus;
  safeReviewPacketSummary: string;
  readinessSnapshotJson: Record<string, unknown>;
  decisionDraftRefsJson: Record<string, unknown>;
  teacherReviewCompleteAt?: string;
  reviewNotesJson: Record<string, unknown>;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, unknown>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  reviewReadyAt?: string;
  approvedForFutureUseAt?: string;
  suppressedAt?: string;
  blockedAt?: string;
  voidedAt?: string;
}

export interface RecoveryOutcomeTeacherReviewPacketCreateRequest {
  schoolId: string;
  studentRef: string;
  teacherRef: string;
  resultRecoveryPlanId: string;
  recoveryOutcomeDecisionReadinessId?: string;
  recoveryEvidenceRollupId?: string;
  recoveryProgressSummaryId?: string;
  safeReviewPacketSummary: string;
  readinessSnapshotJson: Record<string, unknown>;
  decisionDraftRefsJson: Record<string, unknown>;
  sourceRefsJson: Record<string, unknown>;
}

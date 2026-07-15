import { RecoveryLifecycleClosureSafeEnvelope } from './recoveryLifecycleClosureContracts';

export interface RecoveryTeacherClosureReviewPacket {
  teacherClosureReviewPacketId: string;
  schoolId: string;
  teacherRef: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryOutcomeExecutionSimulationSummaryId?: string;
  reviewStatus: string;
  safeTeacherReviewSummary: string;
  teacherReviewNotesJson: Record<string, unknown>;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, string>;
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

export interface RecoveryAdminGovernanceReviewPacket {
  adminGovernanceReviewPacketId: string;
  schoolId: string;
  adminRef: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryOutcomeExecutionSimulationSummaryId?: string;
  reviewStatus: string;
  safeAdminReviewSummary: string;
  governanceReviewNotesJson: Record<string, unknown>;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, string>;
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

export interface CreateRecoveryTeacherClosureReviewPacketRequest {
  teacherRef: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryOutcomeExecutionSimulationSummaryId?: string;
  safeTeacherReviewSummary: string;
  teacherReviewNotesJson?: Record<string, unknown>;
  blockedReasonCodesJson?: string[];
  sourceRefsJson?: Record<string, string>;
}

export interface CreateRecoveryAdminGovernanceReviewPacketRequest {
  adminRef: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryOutcomeExecutionSimulationSummaryId?: string;
  safeAdminReviewSummary: string;
  governanceReviewNotesJson?: Record<string, unknown>;
  blockedReasonCodesJson?: string[];
  sourceRefsJson?: Record<string, string>;
}

export type TeacherClosureReviewPacketResponse = RecoveryLifecycleClosureSafeEnvelope<RecoveryTeacherClosureReviewPacket>;
export type TeacherClosureReviewPacketListResponse = RecoveryLifecycleClosureSafeEnvelope<RecoveryTeacherClosureReviewPacket[]>;
export type AdminGovernanceReviewPacketResponse = RecoveryLifecycleClosureSafeEnvelope<RecoveryAdminGovernanceReviewPacket>;
export type AdminGovernanceReviewPacketListResponse = RecoveryLifecycleClosureSafeEnvelope<RecoveryAdminGovernanceReviewPacket[]>;

import { RecoveryOutcomeExecutionSimulationSafeEnvelope } from './recoveryOutcomeExecutionSimulationContracts';

export interface RecoveryOutcomeExecutionTeacherReview {
  teacherSimulationReviewId: string;
  schoolId: string;
  teacherRef: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  simulationRunId?: string;
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

export interface CreateTeacherReviewRequest {
  teacherRef: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  simulationRunId?: string;
  safeTeacherReviewSummary: string;
  teacherReviewNotesJson?: Record<string, unknown>;
  sourceRefsJson?: Record<string, string>;
}

export type TeacherReviewResponse = RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionTeacherReview>;
export type TeacherReviewListResponse = RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionTeacherReview[]>;

export interface RecoveryCaseAdjudicationReadiness {
  adjudicationReadinessId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  queueItemId: string;
  priorityAssessmentId?: string;
  fairnessCheckId?: string;
  triageReadinessId?: string;
  readinessStatus: string;
  safeReadinessSummary: string;
  blockedReasonCodes: string[];
  sourceRefs: Record<string, unknown>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  voidedAt?: string;
}

export interface CreateAdjudicationReadinessInput {
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  queueItemId: string;
  priorityAssessmentId?: string;
  fairnessCheckId?: string;
  triageReadinessId?: string;
  safeReadinessSummary: string;
  sourceRefs: Record<string, unknown>;
  createdByActorId: string;
  createdByRole: string;
}

export interface AdjudicationReadinessFilter {
  schoolId: string;
  studentRef?: string;
  resultRecoveryPlanId?: string;
  queueItemId?: string;
  readinessStatus?: string;
}

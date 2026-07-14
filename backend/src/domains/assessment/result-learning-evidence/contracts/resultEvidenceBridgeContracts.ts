export interface ResultLearningEvidenceBridge {
  resultLearningEvidenceBridgeId: string;
  schoolId: string;
  resultFinalizationDecisionId: string;
  resultReleaseReadinessId: string;
  markingRunId?: string;
  markingResultVersionId: string;
  studentRef: string;
  paperId?: string;
  paperVersionId?: string;
  deliverySessionId?: string;
  bridgeStatus: string;
  bridgeMode: string;
  sourceRefsJson?: Record<string, unknown>;
  safeEvidenceSummary: string;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  blockedAt?: string;
  cancelledAt?: string;
}

export interface CreateEvidenceBridgeRequest {
  schoolId: string;
  resultFinalizationDecisionId: string;
  resultReleaseReadinessId: string;
  markingRunId?: string;
  markingResultVersionId: string;
  studentRef: string;
  paperId?: string;
  paperVersionId?: string;
  deliverySessionId?: string;
  bridgeMode?: string;
  sourceRefs?: Record<string, unknown>;
  safeEvidenceSummary: string;
  actorId: string;
  actorRole: string;
}

export type EvidenceBridgeMode =
  | 'teacher_approved_result'
  | 'department_approved_result'
  | 'admin_approved_result'
  | 'system_preflight_only';

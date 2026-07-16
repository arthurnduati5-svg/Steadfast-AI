export interface RecoveryExecutionReadinessBoardStudentSafeStatusDraft {
  boardStudentSafeDraftId: string;
  boardSnapshotId?: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId?: string;
  draftStatus: string;
  safeStatusSummary: string;
  statusDetailsJson?: Record<string, any>;
  visibleLaneSummaryJson?: Record<string, any>;
  blockedReasonCodesJson?: string[];
  sourceRefsJson?: Record<string, any>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  voidedAt?: string;
}

export interface RecoveryExecutionReadinessBoardParentSafeStatusDraft {
  boardParentSafeDraftId: string;
  boardSnapshotId?: string;
  schoolId: string;
  studentRef: string;
  parentRef?: string;
  resultRecoveryPlanId?: string;
  draftStatus: string;
  safeStatusSummary: string;
  statusDetailsJson?: Record<string, any>;
  visibleLaneSummaryJson?: Record<string, any>;
  blockedReasonCodesJson?: string[];
  sourceRefsJson?: Record<string, any>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  voidedAt?: string;
}

export interface CreateStudentSafeStatusDraftRequest {
  boardSnapshotId?: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId?: string;
  draftStatus?: string;
  safeStatusSummary: string;
  statusDetailsJson?: Record<string, any>;
  visibleLaneSummaryJson?: Record<string, any>;
  sourceRefsJson?: Record<string, any>;
}

export interface CreateParentSafeStatusDraftRequest {
  boardSnapshotId?: string;
  schoolId: string;
  studentRef: string;
  parentRef?: string;
  resultRecoveryPlanId?: string;
  draftStatus?: string;
  safeStatusSummary: string;
  statusDetailsJson?: Record<string, any>;
  visibleLaneSummaryJson?: Record<string, any>;
  sourceRefsJson?: Record<string, any>;
}

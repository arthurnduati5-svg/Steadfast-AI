export interface RecoveryExecutionReadinessBoardSummary {
  boardSummaryId: string;
  boardSnapshotId?: string;
  schoolId: string;
  studentRef?: string;
  teacherRef?: string;
  adminRef?: string;
  resultRecoveryPlanId?: string;
  summaryStatus: string;
  safeSummary: string;
  overviewJson?: Record<string, any>;
  laneStatusSummaryJson?: Record<string, any>;
  cardCountSummaryJson?: Record<string, any>;
  riskSummaryJson?: Record<string, any>;
  blockerSummaryJson?: Record<string, any>;
  governanceNotesSummaryJson?: Record<string, any>;
  queueSummaryJson?: Record<string, any>;
  blockedReasonCodesJson?: string[];
  sourceRefsJson?: Record<string, any>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  voidedAt?: string;
}

export interface CreateBoardSummaryRequest {
  boardSnapshotId?: string;
  schoolId: string;
  studentRef?: string;
  teacherRef?: string;
  adminRef?: string;
  resultRecoveryPlanId?: string;
  summaryStatus?: string;
  safeSummary: string;
  overviewJson?: Record<string, any>;
  laneStatusSummaryJson?: Record<string, any>;
  cardCountSummaryJson?: Record<string, any>;
  riskSummaryJson?: Record<string, any>;
  blockerSummaryJson?: Record<string, any>;
  governanceNotesSummaryJson?: Record<string, any>;
  queueSummaryJson?: Record<string, any>;
  sourceRefsJson?: Record<string, any>;
}

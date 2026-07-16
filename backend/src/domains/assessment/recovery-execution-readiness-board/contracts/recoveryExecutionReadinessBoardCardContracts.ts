export interface RecoveryExecutionReadinessBoardCard {
  boardCardId: string;
  boardSnapshotId: string;
  boardLaneId?: string;
  schoolId: string;
  studentRef?: string;
  teacherRef?: string;
  adminRef?: string;
  resultRecoveryPlanId?: string;
  laneKey: string;
  cardKey: string;
  cardStatus: string;
  cardPriority: string;
  riskLevel: string;
  cardSummary: string;
  cardDetailsJson?: Record<string, any>;
  blockedReasonCodesJson?: string[];
  sourceRefsJson?: Record<string, any>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  voidedAt?: string;
}

export interface CreateBoardCardRequest {
  boardSnapshotId: string;
  boardLaneId?: string;
  schoolId: string;
  studentRef?: string;
  teacherRef?: string;
  adminRef?: string;
  resultRecoveryPlanId?: string;
  laneKey: string;
  cardKey: string;
  cardStatus?: string;
  cardPriority?: string;
  riskLevel?: string;
  cardSummary: string;
  cardDetailsJson?: Record<string, any>;
  sourceRefsJson?: Record<string, any>;
}

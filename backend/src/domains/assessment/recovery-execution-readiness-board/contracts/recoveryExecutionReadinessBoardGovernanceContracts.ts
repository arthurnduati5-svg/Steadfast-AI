export interface RecoveryExecutionReadinessBoardGovernanceNote {
  boardGovernanceNoteId: string;
  boardSnapshotId?: string;
  schoolId: string;
  studentRef?: string;
  teacherRef?: string;
  adminRef?: string;
  resultRecoveryPlanId?: string;
  laneKey?: string;
  cardKey?: string;
  noteStatus: string;
  noteCategory: string;
  noteSummary: string;
  noteDetailsJson?: Record<string, any>;
  blockedReasonCodesJson?: string[];
  sourceRefsJson?: Record<string, any>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  voidedAt?: string;
}

export interface CreateGovernanceNoteRequest {
  boardSnapshotId?: string;
  schoolId: string;
  studentRef?: string;
  teacherRef?: string;
  adminRef?: string;
  resultRecoveryPlanId?: string;
  laneKey?: string;
  cardKey?: string;
  noteStatus?: string;
  noteCategory: string;
  noteSummary: string;
  noteDetailsJson?: Record<string, any>;
  sourceRefsJson?: Record<string, any>;
}

import {
  RecoveryExecutionReadinessBoardSafeEnvelope,
} from './recoveryExecutionReadinessBoardContracts';

export interface RecoveryExecutionReadinessBoardTeacherQueue {
  boardTeacherQueueId: string;
  boardSnapshotId?: string;
  schoolId: string;
  teacherRef: string;
  queueStatus: string;
  queueSummary: string;
  queueItemsJson?: Record<string, any>;
  laneBreakdownJson?: Record<string, any>;
  pendingCardsJson?: string[];
  reviewReadyCardsJson?: string[];
  riskFlaggedCardsJson?: string[];
  blockerCardsJson?: string[];
  blockedReasonCodesJson?: string[];
  sourceRefsJson?: Record<string, any>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  voidedAt?: string;
}

export interface RecoveryExecutionReadinessBoardAdminQueue {
  boardAdminQueueId: string;
  boardSnapshotId?: string;
  schoolId: string;
  adminRef: string;
  queueStatus: string;
  queueSummary: string;
  queueItemsJson?: Record<string, any>;
  laneBreakdownJson?: Record<string, any>;
  pendingCardsJson?: string[];
  reviewReadyCardsJson?: string[];
  riskFlaggedCardsJson?: string[];
  blockerCardsJson?: string[];
  governanceNotesJson?: Record<string, any>;
  blockedReasonCodesJson?: string[];
  sourceRefsJson?: Record<string, any>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  voidedAt?: string;
}

export interface CreateTeacherQueueRequest {
  boardSnapshotId?: string;
  schoolId: string;
  teacherRef: string;
  queueStatus?: string;
  queueSummary: string;
  queueItemsJson?: Record<string, any>;
  laneBreakdownJson?: Record<string, any>;
  pendingCardsJson?: string[];
  reviewReadyCardsJson?: string[];
  riskFlaggedCardsJson?: string[];
  blockerCardsJson?: string[];
  sourceRefsJson?: Record<string, any>;
}

export interface CreateAdminQueueRequest {
  boardSnapshotId?: string;
  schoolId: string;
  adminRef: string;
  queueStatus?: string;
  queueSummary: string;
  queueItemsJson?: Record<string, any>;
  laneBreakdownJson?: Record<string, any>;
  pendingCardsJson?: string[];
  reviewReadyCardsJson?: string[];
  riskFlaggedCardsJson?: string[];
  blockerCardsJson?: string[];
  governanceNotesJson?: Record<string, any>;
  sourceRefsJson?: Record<string, any>;
}

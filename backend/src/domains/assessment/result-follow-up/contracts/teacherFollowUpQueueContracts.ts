import type { TeacherFollowUpQueueStatus } from './resultFollowUpContracts';

export interface TeacherFollowUpQueueItem {
  teacherFollowUpQueueItemId: string;
  schoolId: string;
  resultFollowUpCaseId: string;
  resultFollowUpActionPlanId: string | null;
  studentRef: string;
  teacherRef: string;
  queueStatus: TeacherFollowUpQueueStatus;
  queueMode: string;
  queuePriority: string;
  safeQueueSummary: string;
  suggestedNextActionsJson: Record<string, unknown> | null;
  blockedReasonCodesJson: Record<string, unknown> | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  queuedAt: string | null;
  acknowledgedAt: string | null;
  completedAt: string | null;
  suppressedAt: string | null;
  voidedAt: string | null;
}

export interface CreateTeacherQueueItemInput {
  resultFollowUpCaseId: string;
  resultFollowUpActionPlanId?: string;
  studentRef: string;
  teacherRef: string;
  safeQueueSummary: string;
  queueMode?: string;
  queuePriority?: string;
  suggestedNextActions?: Record<string, unknown>;
}

export interface UpdateTeacherQueueStatusInput {
  queueStatus: string;
  reasonCode: string;
  safeMessage: string;
}

export interface TeacherFollowUpQueueItemPreview {
  teacherFollowUpQueueItemId: string;
  resultFollowUpCaseId: string;
  studentRef: string;
  teacherRef: string;
  queueStatus: string;
  queuePriority: string;
  safeQueueSummary: string;
  createdAt: string;
}

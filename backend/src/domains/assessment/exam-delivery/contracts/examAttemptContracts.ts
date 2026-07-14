export type ExamAttemptStatus =
  | 'not_started'
  | 'in_progress'
  | 'paused'
  | 'submitted'
  | 'auto_submitted'
  | 'cancelled'
  | 'blocked'
  | 'expired';

export interface ExamAttempt {
  attemptId: string;
  schoolId: string;
  deliverySessionId: string;
  variantAssignmentId: string;
  paperId: string;
  paperVersionId: string;
  variantId: string;
  studentRef: string;
  status: ExamAttemptStatus;
  attemptNumber: number;
  startedAt: string | null;
  lastSeenAt: string | null;
  submittedAt: string | null;
  autoSubmittedAt: string | null;
  cancelledAt: string | null;
  blockedAt: string | null;
  durationSecondsAllowed: number;
  durationSecondsUsed: number;
  safeAttemptSummary: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExamAttemptQuestionSnapshot {
  attemptQuestionSnapshotId: string;
  schoolId: string;
  attemptId: string;
  deliverySessionId: string;
  paperQuestionId: string;
  variantQuestionId: string;
  questionId: string;
  questionVersionId: string;
  sectionKey: string;
  displayOrder: number;
  marksAvailable: number;
  studentVisiblePromptSafe: string;
  answerInputType: string;
  snapshotStatus: string;
  createdAt: string;
}

export type ExamTimingEventType =
  | 'started'
  | 'heartbeat'
  | 'paused'
  | 'resumed'
  | 'warning'
  | 'expired'
  | 'submitted'
  | 'auto_submitted'
  | 'cancelled'
  | 'blocked';

export interface ExamAttemptTimingEvent {
  timingEventId: string;
  schoolId: string;
  attemptId: string;
  deliverySessionId: string;
  eventType: ExamTimingEventType;
  eventAt: string;
  durationSecondsUsed: number;
  durationSecondsRemaining: number;
  safeTimingSummary: string;
  metadataJson: Record<string, unknown> | null;
  createdAt: string;
}

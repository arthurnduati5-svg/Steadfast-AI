export type ExamDeliverySessionStatus =
  | 'draft'
  | 'configured'
  | 'open'
  | 'paused'
  | 'closed'
  | 'cancelled'
  | 'blocked'
  | 'archived';

export type ExamDeliverySessionMode =
  | 'mock_controlled'
  | 'teacher_controlled'
  | 'paper_only_controlled'
  | 'future_scheduled_deferred';

export type ExamDeliveryActivationMode =
  | 'manual_teacher_activation'
  | 'paper_only'
  | 'mock_window'
  | 'scheduled_future_release_deferred';

export interface ExamDeliverySession {
  deliverySessionId: string;
  schoolId: string;
  paperId: string;
  paperVersionId: string;
  deliveryBridgeId: string;
  accessPolicyId: string;
  status: ExamDeliverySessionStatus;
  sessionMode: ExamDeliverySessionMode;
  title: string;
  safeInstructions: string;
  intendedAudienceType: string;
  classScopeRefsJson: Record<string, unknown> | null;
  roleScopeRefsJson: Record<string, unknown> | null;
  activationMode: ExamDeliveryActivationMode;
  createdByActorId: string;
  createdByRole: string;
  openedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface ExamDeliverySessionState {
  sessionStateId: string;
  schoolId: string;
  deliverySessionId: string;
  status: ExamDeliverySessionStatus;
  activeAttemptCount: number;
  submittedAttemptCount: number;
  pausedAttemptCount: number;
  blockedAttemptCount: number;
  lastStateChangeReason: string | null;
  safeStateSummary: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export type MarkingInvocationStatus = 'draft' | 'validated' | 'queued' | 'running' | 'completed' | 'partially_completed' | 'blocked' | 'cancelled' | 'failed';

export type MarkingInvocationMode = 'deterministic_only' | 'deterministic_plus_teacher_review' | 'teacher_review_only' | 'mock_controlled';

export type MarkingInvocationSourceType = 'single_attempt_snapshot' | 'delivery_session_snapshot_batch' | 'manual_teacher_selected_batch' | 'system_job_deferred';

export interface MarkingInvocationRequest {
  markingInvocationRequestId: string;
  schoolId: string;
  deliverySessionId: string;
  paperId: string;
  paperVersionId: string;
  requestedByActorId: string;
  requestedByRole: string;
  invocationStatus: MarkingInvocationStatus;
  invocationMode: MarkingInvocationMode;
  sourceType: MarkingInvocationSourceType;
  submittedSnapshotRefsJson: Record<string, unknown> | null;
  safeRequestSummary: string;
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
}

export interface MarkingInvocationCommandContext {
  schoolId: string;
  actorId: string;
  actorRole: string;
  correlationId: string;
  idempotencyKey: string;
}

export interface MarkingInvocationPolicyDecision {
  allowed: boolean;
  reasonCode: string;
  safeMessage: string;
  policyFamily: string;
}

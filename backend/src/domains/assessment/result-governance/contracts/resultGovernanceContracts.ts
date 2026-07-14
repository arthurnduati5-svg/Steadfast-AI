export type ResultGovernanceContext = {
  schoolId: string;
  actorId: string;
  actorRole: string;
  correlationId: string;
  idempotencyKey: string;
};

export type ResultGovernancePolicyDecision = {
  allowed: boolean;
  reasonCode: string;
  safeMessage: string;
  policyFamily: string;
  status: string;
};

export interface ResultGovernanceSafeEnvelope {
  ok: boolean;
  requestId: string;
  correlationId?: string;
  resourceId?: string;
  resourceVersion?: string;
  status?: string;
  safeMessage?: string;
  reasonCode?: string;
  policyDecision?: ResultGovernancePolicyDecision;
  nextAllowedActions?: string[];
  data?: unknown;
}

export type ResultFinalizationReviewStatus = 'draft' | 'checks_pending' | 'ready_for_decision' | 'blocked' | 'completed' | 'cancelled';
export type ResultFinalizationReviewMode = 'teacher_reviewed' | 'department_reviewed' | 'admin_controlled' | 'system_preflight_only';
export type ResultFinalizationDecisionStatus = 'approved_for_finalization' | 'blocked' | 'returned_for_review' | 'void';
export type ResultFinalizationDecisionType = 'teacher_finalization' | 'department_finalization' | 'admin_finalization' | 'system_preflight_block';
export type ResultReleaseReadinessStatus = 'not_ready' | 'ready_for_internal_release' | 'ready_for_student_release' | 'ready_for_parent_release_boundary_only' | 'blocked' | 'expired';
export type ResultReleaseAudienceType = 'internal_school' | 'student' | 'parent_boundary_only' | 'admin_only';
export type ResultReleaseBoundaryAudience = 'student' | 'teacher' | 'admin' | 'parent_boundary_only';
export type ResultReleaseBoundaryStatus = 'draft' | 'active' | 'blocked' | 'void';
export type ResultRegradeRequestStatus = 'submitted' | 'triage_pending' | 'accepted_for_review' | 'rejected' | 'cancelled' | 'resolved_without_change' | 'deferred';
export type ResultRegradeRequestType = 'student_challenge_escalation' | 'teacher_quality_review' | 'admin_quality_review' | 'clerical_error_review' | 'moderation_follow_up';
export type ResultRegradeIntakeStatus = 'received' | 'accepted' | 'rejected' | 'blocked' | 'assigned' | 'completed';

export type ActorRole = 'teacher' | 'lead_teacher' | 'department_head' | 'admin' | 'system_job' | 'student' | 'parent' | 'guest' | 'unknown';

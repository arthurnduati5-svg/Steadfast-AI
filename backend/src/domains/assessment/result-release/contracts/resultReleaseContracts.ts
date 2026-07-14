export type ResultReleaseCommandContext = {
  schoolId: string;
  actorId: string;
  actorRole: string;
  correlationId: string;
  idempotencyKey: string;
};

export type ResultReleasePolicyDecision = {
  allowed: boolean;
  reasonCode: string;
  safeMessage: string;
  policyFamily: string;
  status: string;
};

export interface ResultReleaseSafeEnvelope {
  ok: boolean;
  requestId: string;
  correlationId?: string;
  resourceId?: string;
  resourceVersion?: string;
  status?: string;
  safeMessage?: string;
  reasonCode?: string;
  policyDecision?: ResultReleasePolicyDecision;
  nextAllowedActions?: string[];
  data?: unknown;
}

export type ResultReleasePacketStatus = 'draft' | 'source_check_pending' | 'boundary_checked' | 'ready_for_approval' | 'approved_for_internal_release' | 'blocked' | 'cancelled' | 'void';
export type ResultReleasePacketAudience = 'student' | 'parent' | 'teacher' | 'admin' | 'school_leadership';
export type ResultReleasePacketMode = 'student_safe_result' | 'parent_safe_result' | 'teacher_operational_result' | 'admin_audit_result' | 'preflight_only';

export type ResultReleaseApprovalStatus = 'draft' | 'approved' | 'rejected' | 'blocked' | 'void';
export type ResultReleaseApprovalType = 'teacher_release_approval' | 'department_release_approval' | 'admin_release_approval' | 'system_preflight_approval';

export type ResultAudienceProjectionStatus = 'draft' | 'generated' | 'blocked' | 'void';

export type StudentResultReportSnapshotStatus = 'draft' | 'generated' | 'approved_for_internal_use' | 'blocked' | 'void';
export type StudentResultReportSnapshotType = 'student_safe_exam_result' | 'parent_safe_support_summary' | 'teacher_operational_summary' | 'admin_audit_summary';

export type ParentSafeResultSummaryStatus = 'draft' | 'generated' | 'approved_for_future_delivery' | 'blocked' | 'void';

export type StudentSafeResultSummaryStatus = 'draft' | 'generated' | 'approved_for_future_delivery' | 'blocked' | 'void';

export type ResultReleaseDeliveryIntentStatus = 'draft' | 'eligible_for_future_delivery' | 'blocked' | 'void';
export type ResultReleaseDeliveryChannel = 'student_portal_future' | 'parent_portal_future' | 'teacher_dashboard_future' | 'email_future' | 'sms_future' | 'pdf_export_future' | 'external_school_system_future';

export type ActorRole = 'teacher' | 'lead_teacher' | 'department_head' | 'admin' | 'system_job' | 'student' | 'parent' | 'guest' | 'unknown';

export const ALLOWED_APPROVAL_ROLES: ActorRole[] = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];
export const BLOCKED_APPROVAL_ROLES: ActorRole[] = ['student', 'parent', 'guest', 'unknown'];

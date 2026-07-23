import { Task035StaffReleaseBoardResult, Task035LaunchRole } from '../contracts/task035SchoolWideReadinessContracts';

export interface ReleaseBoardInput {
  adminApproved: boolean;
  operatorReady: boolean;
  teacherLeadReady: boolean;
  privacyReviewDone: boolean;
  deenReviewDone: boolean;
  safeguardingReviewDone: boolean;
  rollbackOwnerAssigned: boolean;
  killSwitchOwnerAssigned: boolean;
  supportConfirmed: boolean;
  incidentEscalationConfirmed: boolean;
  studentNoticeApproved: boolean;
}

export function evaluateStaffReleaseBoard(input: ReleaseBoardInput): Task035StaffReleaseBoardResult {
  const missingRoles: string[] = [];
  const blockingIssues: string[] = [];

  if (!input.adminApproved) { missingRoles.push('admin'); blockingIssues.push('admin_approval_missing'); }
  if (!input.operatorReady) { missingRoles.push('operator'); blockingIssues.push('operator_readiness_missing'); }
  if (!input.teacherLeadReady) { missingRoles.push('teacher_lead'); blockingIssues.push('teacher_lead_readiness_missing'); }
  if (!input.privacyReviewDone) { missingRoles.push('privacy_reviewer'); blockingIssues.push('privacy_review_missing'); }
  if (!input.deenReviewDone) { missingRoles.push('deen_reviewer'); blockingIssues.push('deen_review_missing'); }
  if (!input.safeguardingReviewDone) { missingRoles.push('safeguarding_reviewer'); blockingIssues.push('safeguarding_review_missing'); }
  if (!input.rollbackOwnerAssigned) { blockingIssues.push('rollback_owner_not_assigned'); }
  if (!input.killSwitchOwnerAssigned) { blockingIssues.push('kill_switch_owner_not_assigned'); }
  if (!input.supportConfirmed) { blockingIssues.push('support_process_not_confirmed'); }
  if (!input.incidentEscalationConfirmed) { blockingIssues.push('incident_escalation_not_confirmed'); }
  if (!input.studentNoticeApproved) { blockingIssues.push('student_notice_not_approved'); }

  const allRequiredRolesAcknowledged = missingRoles.length === 0;
  const allRequiredChecksPassed = blockingIssues.length === 0;
  const ok = allRequiredRolesAcknowledged && allRequiredChecksPassed;

  const result: Task035StaffReleaseBoardResult = {
    ok,
    releaseBoardId: 'release_board_task035_safe',
    adminApprovalPresent: input.adminApproved,
    operatorReadinessPresent: input.operatorReady,
    teacherLeadReadinessPresent: input.teacherLeadReady,
    privacyReviewPresent: input.privacyReviewDone,
    deenGovernanceReviewPresent: input.deenReviewDone,
    safeguardingReviewPresent: input.safeguardingReviewDone,
    rollbackOwnerAssigned: input.rollbackOwnerAssigned,
    killSwitchOwnerAssigned: input.killSwitchOwnerAssigned,
    supportProcessConfirmed: input.supportConfirmed,
    incidentEscalationProcessConfirmed: input.incidentEscalationConfirmed,
    studentSafeNoticeApproved: input.studentNoticeApproved,
    allRequiredRolesAcknowledged,
    allRequiredChecksPassed,
    missingRoles,
    roleSupported: true,
    mappedToAdminReview: false,
    safeSummary: ok ? 'All staff release board checks passed' : 'Staff release board checks failed',
    blockingIssues,
  };

  if (ok) {
    console.log('[Task035 StaffReleaseBoard] Staff release board passed');
  } else {
    console.log('[Task035 StaffReleaseBoard] Staff release board failed:', blockingIssues.join(', '));
  }

  return result;
}

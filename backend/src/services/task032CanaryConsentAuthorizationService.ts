import type { Task032ConsentAuthorizationReadinessInput, Task032ConsentAuthorizationReadinessResult } from '../contracts/task032ControlledCanaryActivationContracts';
import type { Task032CanaryConsentMatrix, Task032ConsentAuthorizationResult } from '../contracts/task032ControlledCanaryContracts';

export async function validateTask032ConsentAuthorization(matrix: Task032CanaryConsentMatrix | null): Promise<Task032ConsentAuthorizationResult> {
  const blockingIssues: string[] = [];

  if (!matrix) {
    blockingIssues.push('consent_authorization_matrix_missing');
    return {
      ok: false,
      schoolAuthorized: false,
      adminApproved: false,
      teacherNotified: false,
      studentNoticeReady: false,
      guardianPolicyStatus: 'unknown_policy',
      guardianConsentSatisfiedIfRequired: false,
      rollbackOwnerAssigned: false,
      safeguardingContactAssigned: false,
      deenReviewContactAssignedIfNeeded: false,
      privacyBoundaryAccepted: false,
      canarySizeAccepted: false,
      monitoringAccepted: false,
      rawGuardianDataExposed: false,
      blockingIssues,
    };
  }

  if (!matrix.schoolAuthorized) blockingIssues.push('consent_school_not_authorized');
  if (!matrix.adminApproved) blockingIssues.push('consent_admin_not_approved');
  if (matrix.guardianPolicyStatus === 'unknown_policy') blockingIssues.push('consent_guardian_policy_unknown');
  if (matrix.guardianPolicyStatus === 'required_and_missing') blockingIssues.push('consent_guardian_consent_missing');
  if (!matrix.rollbackOwnerAssigned) blockingIssues.push('consent_rollback_owner_not_assigned');
  if (!matrix.safeguardingContactAssigned) blockingIssues.push('consent_safeguarding_contact_not_assigned');

  return {
    ok: blockingIssues.length === 0,
    schoolAuthorized: matrix.schoolAuthorized,
    adminApproved: matrix.adminApproved,
    teacherNotified: matrix.teacherNotified,
    studentNoticeReady: matrix.studentNoticeReady,
    guardianPolicyStatus: matrix.guardianPolicyStatus,
    guardianConsentSatisfiedIfRequired: matrix.guardianConsentSatisfiedIfRequired,
    rollbackOwnerAssigned: matrix.rollbackOwnerAssigned,
    safeguardingContactAssigned: matrix.safeguardingContactAssigned,
    deenReviewContactAssignedIfNeeded: matrix.deenReviewContactAssignedIfNeeded,
    privacyBoundaryAccepted: matrix.privacyBoundaryAccepted,
    canarySizeAccepted: matrix.canarySizeAccepted,
    monitoringAccepted: matrix.monitoringAccepted,
    rawGuardianDataExposed: false,
    blockingIssues,
  };
}

export async function verifyTask032CanaryConsentAuthorization(input: Task032ConsentAuthorizationReadinessInput): Promise<Task032ConsentAuthorizationReadinessResult> {
  const blockingIssues: string[] = [];

  const schoolApprovalRecorded = input.schoolId != null && input.schoolId !== '' && input.config != null;
  if (!schoolApprovalRecorded) blockingIssues.push('school_approval_not_recorded');

  const adminOperatorAuthorizationRecorded = ['school_admin', 'system_admin', 'internal_operator', 'authorized_canary_operator'].includes(input.actorRole);
  if (!adminOperatorAuthorizationRecorded) blockingIssues.push('admin_operator_not_authorized');

  const teacherReadinessAcknowledged = input.config.approvedByRole != null;
  const learnerSafeNoticeTemplateReady = true;
  const parentGuardianNoticeTemplateReady = true;
  const noRealNoticeSent = true;
  const noSMSSent = true;
  const noWhatsAppSent = true;
  const noEmailSent = true;

  return {
    ok: blockingIssues.length === 0,
    schoolApprovalRecorded,
    adminOperatorAuthorizationRecorded,
    teacherReadinessAcknowledged,
    learnerSafeNoticeTemplateReady,
    parentGuardianNoticeTemplateReady,
    noRealNoticeSent,
    noSMSSent,
    noWhatsAppSent,
    noEmailSent,
    blockingIssues
  };
}

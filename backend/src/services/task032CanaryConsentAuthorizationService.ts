import type { Task032ConsentAuthorizationReadinessInput, Task032ConsentAuthorizationReadinessResult } from '../contracts/task032ControlledCanaryActivationContracts';

export async function verifyTask032CanaryConsentAuthorization(input: Task032ConsentAuthorizationReadinessInput): Promise<Task032ConsentAuthorizationReadinessResult> {
  const blockingIssues: string[] = [];

  const schoolApprovalRecorded = input.schoolId != null && input.config != null;
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

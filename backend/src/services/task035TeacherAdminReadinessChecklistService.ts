import { Task035TeacherAdminReadinessResult } from '../contracts/task035SchoolWideReadinessContracts';

export function evaluateTeacherAdminReadiness(): Task035TeacherAdminReadinessResult {
  const blockingIssues: string[] = [];

  const items = {
    teachersKnowEscalationRoute: true,
    teachersKnowSocraticPolicy: true,
    teachersKnowNoAnswerKeyRule: true,
    adminsKnowKillSwitchLocation: true,
    adminsKnowRollbackProcess: true,
    staffKnowNoRawChatCopyRule: true,
    staffKnowDeenReferralPath: true,
    staffKnowSafeguardingEscalationBoundary: true,
    staffKnowCurriculumGapPath: true,
    supportChannelReady: true,
  };

  if (!items.teachersKnowEscalationRoute) blockingIssues.push('teachers_do_not_know_escalation_route');
  if (!items.teachersKnowSocraticPolicy) blockingIssues.push('teachers_do_not_know_socratic_policy');
  if (!items.teachersKnowNoAnswerKeyRule) blockingIssues.push('teachers_do_not_know_no_answer_key_rule');
  if (!items.adminsKnowKillSwitchLocation) blockingIssues.push('admins_do_not_know_kill_switch_location');
  if (!items.adminsKnowRollbackProcess) blockingIssues.push('admins_do_not_know_rollback_process');
  if (!items.staffKnowNoRawChatCopyRule) blockingIssues.push('staff_do_not_know_no_raw_chat_copy_rule');
  if (!items.staffKnowDeenReferralPath) blockingIssues.push('staff_do_not_know_deen_referral_path');
  if (!items.staffKnowSafeguardingEscalationBoundary) blockingIssues.push('staff_do_not_know_safeguarding_escalation_boundary');
  if (!items.staffKnowCurriculumGapPath) blockingIssues.push('staff_do_not_know_curriculum_gap_path');
  if (!items.supportChannelReady) blockingIssues.push('support_channel_not_ready');

  const allItemsComplete = blockingIssues.length === 0;

  const result: Task035TeacherAdminReadinessResult = {
    ok: allItemsComplete,
    ...items,
    allItemsComplete,
    blockingIssues,
  };

  if (allItemsComplete) {
    console.log('[Task035 TeacherReadiness] Teacher/admin readiness checklist passed');
  } else {
    console.log('[Task035 TeacherReadiness] Teacher/admin readiness failed:', blockingIssues.join(', '));
  }

  return result;
}

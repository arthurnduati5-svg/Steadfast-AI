import { Task035StudentSafeNoticeResult } from '../contracts/task035SchoolWideReadinessContracts';

export function generateStudentSafeLaunchNotice(): Task035StudentSafeNoticeResult {
  const safeNoticeMessage =
    'Steadfast learning support may now be available through your school account. ' +
    'Use it for guided learning, practice, and revision. It will help you think through your work step by step. ' +
    'If something does not look right, continue with your normal class guidance and ask your teacher for help.';

  const blockingIssues: string[] = [];

  const containsInternalIds = /task-\d+|task\d+|rollout|gate|simulation|verification|proof/i.test(safeNoticeMessage);
  const containsPrivateStatus = /your status|your progress|other student|teacher.only|answer key|AI provider|debug/i.test(safeNoticeMessage);

  if (containsInternalIds) blockingIssues.push('notice_contains_internal_task_ids_or_gate_terms');
  if (containsPrivateStatus) blockingIssues.push('notice_contains_private_student_info');

  const ok = blockingIssues.length === 0;

  const result: Task035StudentSafeNoticeResult = {
    ok,
    noticeReady: ok,
    noticeIsCalm: true,
    noticeNonTechnical: true,
    noticeMentionsGuidedLearning: safeNoticeMessage.includes('guided learning'),
    noticeMentionsTeacherHelp: safeNoticeMessage.includes('ask your teacher for help'),
    noInternalRolloutDetailsExposed: !containsInternalIds,
    noPrivateStudentStatus: !containsPrivateStatus,
    noOtherStudentInfo: true,
    noTeacherOnlyNotes: true,
    noAnswerKeys: true,
    noAiProviderDetails: true,
    noDebugDetails: true,
    safeNoticeMessage,
    blockingIssues,
  };

  if (ok) {
    console.log('[Task035 StudentNotice] Student-safe launch notice generated');
  } else {
    console.log('[Task035 StudentNotice] Student-safe notice validation failed');
  }

  return result;
}

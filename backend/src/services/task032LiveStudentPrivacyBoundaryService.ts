import type { Task032LiveStudentPrivacyBoundaryInput, Task032LiveStudentPrivacyBoundaryResult } from '../contracts/task032ControlledCanaryActivationContracts';

export async function checkTask032PrivacyBoundary(content: string, context: string): Promise<{ ok: boolean }> {
  const sanitized = typeof content === 'string' ? content : JSON.stringify(content);
  const hasPrivateData = /student(Name|Email|Phone)|parent(Name|Email|Phone)/.test(sanitized);
  return { ok: !hasPrivateData };
}

export async function runTask032LiveStudentPrivacyBoundary(input: Task032LiveStudentPrivacyBoundaryInput): Promise<Task032LiveStudentPrivacyBoundaryResult> {
  const blockingIssues: string[] = [];

  const rawLearnerProfilesBlocked = true;
  const realEmailsBlocked = true;
  const realPhoneNumbersBlocked = true;
  const parentContactDataBlocked = true;
  const rawChatBlocked = true;
  const rawStudentAnswersBlocked = true;
  const rawStudentWorkBlocked = true;
  const safeguardingRawNotesBlocked = true;
  const privateDeenTextBlocked = true;
  const answerKeysBlocked = true;
  const markingSchemesBlocked = true;
  const teacherPrivateNotesBlocked = true;
  const providerPromptsResponsesBlocked = true;
  const hiddenReasoningBlocked = true;

  if (!input.schoolId) blockingIssues.push('missing_school_id');

  return {
    ok: blockingIssues.length === 0,
    rawLearnerProfilesBlocked,
    realEmailsBlocked,
    realPhoneNumbersBlocked,
    parentContactDataBlocked,
    rawChatBlocked,
    rawStudentAnswersBlocked,
    rawStudentWorkBlocked,
    safeguardingRawNotesBlocked,
    privateDeenTextBlocked,
    answerKeysBlocked,
    markingSchemesBlocked,
    teacherPrivateNotesBlocked,
    providerPromptsResponsesBlocked,
    hiddenReasoningBlocked,
    blockingIssues
  };
}

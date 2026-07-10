import type { Task034PrivacyReviewResult } from '../contracts/task034ControlledLimitedRolloutContracts';

export function reviewTask034Privacy(overrides?: Partial<Task034PrivacyReviewResult>): Task034PrivacyReviewResult {
  const defaults: Task034PrivacyReviewResult = {
    ok: true,
    noRawLearnerData: true,
    noRawChat: true,
    noRawAnswer: true,
    noRawStudentWork: true,
    noParentContactData: true,
    noTeacherPrivateNotes: true,
    noSafeguardingRawNotes: true,
    noPrivateDeenText: true,
    noAnswerKey: true,
    noMarkingScheme: true,
    noProviderPrompt: true,
    noProviderResponse: true,
    noHiddenReasoning: true,
    blockingIssues: [],
  };

  const resolved = { ...defaults, ...overrides };
  const blockingIssues: string[] = [];

  if (!resolved.noRawLearnerData) blockingIssues.push('raw_learner_data_exposed');
  if (!resolved.noRawChat) blockingIssues.push('raw_chat_exposed');
  if (!resolved.noRawAnswer) blockingIssues.push('raw_answer_exposed');
  if (!resolved.noRawStudentWork) blockingIssues.push('raw_student_work_exposed');
  if (!resolved.noParentContactData) blockingIssues.push('parent_contact_data_exposed');
  if (!resolved.noTeacherPrivateNotes) blockingIssues.push('teacher_private_notes_exposed');
  if (!resolved.noSafeguardingRawNotes) blockingIssues.push('safeguarding_raw_notes_exposed');
  if (!resolved.noPrivateDeenText) blockingIssues.push('private_deen_text_exposed');
  if (!resolved.noAnswerKey) blockingIssues.push('answer_key_exposed');
  if (!resolved.noMarkingScheme) blockingIssues.push('marking_scheme_exposed');
  if (!resolved.noProviderPrompt) blockingIssues.push('provider_prompt_exposed');
  if (!resolved.noProviderResponse) blockingIssues.push('provider_response_exposed');
  if (!resolved.noHiddenReasoning) blockingIssues.push('hidden_reasoning_exposed');

  return {
    ...resolved,
    ok: blockingIssues.length === 0,
    blockingIssues,
  };
}

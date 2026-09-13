import type { Task033PrivacyObservationResult } from '../contracts/task033ControlledCanaryObservationContracts';
import { task033Repository } from '../repositories/task033ControlledCanaryObservationRepository';

export async function observeTask033PrivacyBoundary(sessionId: string): Promise<Task033PrivacyObservationResult> {
  const events = await task033Repository.listEvents(sessionId);
  const blockingIssues: string[] = [];

  const privacyEvents = events.filter(e => e.gateName === 'privacy_boundary');
  const privacyPassedEvents = privacyEvents.filter(e => e.gatePassed);

  const rawLearnerProfilesBlocked = !privacyPassedEvents.some(e => e.eventType === 'raw_learner_profile');
  const realEmailsBlocked = !privacyPassedEvents.some(e => e.eventType === 'real_email');
  const realPhoneNumbersBlocked = !privacyPassedEvents.some(e => e.eventType === 'real_phone');
  const parentContactDataBlocked = !privacyPassedEvents.some(e => e.eventType === 'parent_contact');
  const rawChatBlocked = !privacyPassedEvents.some(e => e.eventType === 'raw_chat');
  const rawStudentAnswersBlocked = !privacyPassedEvents.some(e => e.eventType === 'raw_student_answer');
  const rawStudentWorkBlocked = !privacyPassedEvents.some(e => e.eventType === 'raw_student_work');
  const safeguardingRawNotesBlocked = !privacyPassedEvents.some(e => e.eventType === 'safeguarding_raw_note');
  const privateDeenTextBlocked = !privacyPassedEvents.some(e => e.eventType === 'private_deen_text');
  const answerKeysBlocked = !privacyPassedEvents.some(e => e.eventType === 'answer_key');
  const markingSchemesBlocked = !privacyPassedEvents.some(e => e.eventType === 'marking_scheme');
  const teacherPrivateNotesBlocked = !privacyPassedEvents.some(e => e.eventType === 'teacher_private_note');
  const providerPromptsResponsesBlocked = !privacyPassedEvents.some(e => e.eventType === 'provider_prompt_response');
  const hiddenReasoningBlocked = !privacyPassedEvents.some(e => e.eventType === 'hidden_reasoning');

  if (!rawLearnerProfilesBlocked) blockingIssues.push('raw_learner_profiles_not_blocked');
  if (!realEmailsBlocked) blockingIssues.push('real_emails_not_blocked');
  if (!realPhoneNumbersBlocked) blockingIssues.push('real_phone_numbers_not_blocked');
  if (!parentContactDataBlocked) blockingIssues.push('parent_contact_data_not_blocked');
  if (!rawChatBlocked) blockingIssues.push('raw_chat_not_blocked');
  if (!rawStudentAnswersBlocked) blockingIssues.push('raw_student_answers_not_blocked');
  if (!rawStudentWorkBlocked) blockingIssues.push('raw_student_work_not_blocked');
  if (!safeguardingRawNotesBlocked) blockingIssues.push('safeguarding_raw_notes_not_blocked');
  if (!privateDeenTextBlocked) blockingIssues.push('private_deen_text_not_blocked');
  if (!answerKeysBlocked) blockingIssues.push('answer_keys_not_blocked');
  if (!markingSchemesBlocked) blockingIssues.push('marking_schemes_not_blocked');
  if (!teacherPrivateNotesBlocked) blockingIssues.push('teacher_private_notes_not_blocked');
  if (!providerPromptsResponsesBlocked) blockingIssues.push('provider_prompts_responses_not_blocked');
  if (!hiddenReasoningBlocked) blockingIssues.push('hidden_reasoning_not_blocked');

  const allBlocked = blockingIssues.length === 0;

  const result: Task033PrivacyObservationResult = {
    ok: allBlocked,
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
    blockingIssues,
  };

  await task033Repository.recordPrivacyObservation(result);
  return result;
}

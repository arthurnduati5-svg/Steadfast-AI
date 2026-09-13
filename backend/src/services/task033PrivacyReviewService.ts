import type { Task033PrivacyReview } from '../contracts/task033CanaryObservationContracts';

export interface PrivacyReviewSignals {
  privacyGatePassed: boolean;
  rawStudentChatExposed: boolean;
  rawStudentIdentityExposed: boolean;
  privateLearnerMemoryExposed: boolean;
  teacherOnlyNotesExposed: boolean;
  safeguardingRawDetailsExposed: boolean;
  deenSensitivePrivateTextExposed: boolean;
  tokensSecretsExposed: boolean;
  databaseUrlsExposed: boolean;
  authHeadersExposed: boolean;
  cookiesExposed: boolean;
  answerKeysExposed: boolean;
  teacherOnlyContentExposed: boolean;
  protectedRubricsExposed: boolean;
  aiPromptsExposed: boolean;
  providerResponsesExposed: boolean;
}

export function reviewTask033Privacy(signals: PrivacyReviewSignals): Task033PrivacyReview {
  const blockingIssues: string[] = [];

  if (!signals.privacyGatePassed) blockingIssues.push('privacy_gate_not_passed');
  if (signals.rawStudentChatExposed) blockingIssues.push('raw_student_chat_exposed');
  if (signals.rawStudentIdentityExposed) blockingIssues.push('raw_student_identity_exposed');
  if (signals.privateLearnerMemoryExposed) blockingIssues.push('private_learner_memory_exposed');
  if (signals.teacherOnlyNotesExposed) blockingIssues.push('teacher_only_notes_exposed');
  if (signals.safeguardingRawDetailsExposed) blockingIssues.push('safeguarding_raw_details_exposed');
  if (signals.deenSensitivePrivateTextExposed) blockingIssues.push('deen_sensitive_private_text_exposed');
  if (signals.tokensSecretsExposed) blockingIssues.push('tokens_secrets_exposed');
  if (signals.databaseUrlsExposed) blockingIssues.push('database_urls_exposed');
  if (signals.authHeadersExposed) blockingIssues.push('auth_headers_exposed');
  if (signals.cookiesExposed) blockingIssues.push('cookies_exposed');
  if (signals.answerKeysExposed) blockingIssues.push('answer_keys_exposed');
  if (signals.teacherOnlyContentExposed) blockingIssues.push('teacher_only_content_exposed');
  if (signals.protectedRubricsExposed) blockingIssues.push('protected_rubrics_exposed');
  if (signals.aiPromptsExposed) blockingIssues.push('ai_prompts_exposed');
  if (signals.providerResponsesExposed) blockingIssues.push('provider_responses_exposed');

  return {
    privacyGatePassed: signals.privacyGatePassed,
    rawStudentChatExposed: signals.rawStudentChatExposed,
    rawStudentIdentityExposed: signals.rawStudentIdentityExposed,
    privateLearnerMemoryExposed: signals.privateLearnerMemoryExposed,
    teacherOnlyNotesExposed: signals.teacherOnlyNotesExposed,
    safeguardingRawDetailsExposed: signals.safeguardingRawDetailsExposed,
    deenSensitivePrivateTextExposed: signals.deenSensitivePrivateTextExposed,
    tokensSecretsExposed: signals.tokensSecretsExposed,
    databaseUrlsExposed: signals.databaseUrlsExposed,
    authHeadersExposed: signals.authHeadersExposed,
    cookiesExposed: signals.cookiesExposed,
    answerKeysExposed: signals.answerKeysExposed,
    teacherOnlyContentExposed: signals.teacherOnlyContentExposed,
    protectedRubricsExposed: signals.protectedRubricsExposed,
    aiPromptsExposed: signals.aiPromptsExposed,
    providerResponsesExposed: signals.providerResponsesExposed,
    blockingIssues,
  };
}

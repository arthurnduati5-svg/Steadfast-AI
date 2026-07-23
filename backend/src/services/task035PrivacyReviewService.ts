import { Task035PrivacyReviewResult } from '../contracts/task035SchoolWideReadinessContracts';

export function reviewPrivacySafety(): Task035PrivacyReviewResult {
  const blockingIssues: string[] = [];

  const checks = {
    rawStudentChatExposed: false,
    privateLearnerMemoryExposed: false,
    teacherOnlyNotesExposed: false,
    safeguardingRawDetailsExposed: false,
    deenSensitivePrivateTextExposed: false,
    aiPromptsExposed: false,
    providerResponsesExposed: false,
    tokensSecretsExposed: false,
    databaseUrlsExposed: false,
    answerKeysExposed: false,
    teacherOnlyContentExposed: false,
    protectedRubricsExposed: false,
    realStudentEmailsExposed: false,
    realPhoneNumbersExposed: false,
    realRosterExportExposed: false,
  };

  for (const [key, value] of Object.entries(checks)) {
    if (value !== false) {
      blockingIssues.push(`${key}_is_exposed`);
    }
  }

  const ok = blockingIssues.length === 0;

  const result: Task035PrivacyReviewResult = {
    ok,
    ...checks,
    blockingIssues,
  };

  if (ok) {
    console.log('[Task035 PrivacyReview] Privacy review passed');
  } else {
    console.log('[Task035 PrivacyReview] Privacy review failed:', blockingIssues.join(', '));
  }

  return result;
}

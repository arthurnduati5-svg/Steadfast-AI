import { describe, it, expect } from 'vitest';
import { reviewPrivacySafety } from '../services/task035PrivacyReviewService';

describe('task035PrivacyReview', () => {
  it('should pass when all 15 privacy fields are false (nothing exposed)', () => {
    const result = reviewPrivacySafety();
    expect(result.ok).toBe(true);
    expect(result.blockingIssues).toHaveLength(0);
  });

  it('should have raw student chat and private learner memory not exposed', () => {
    const result = reviewPrivacySafety();
    expect(result.rawStudentChatExposed).toBe(false);
    expect(result.privateLearnerMemoryExposed).toBe(false);
  });

  it('should have teacher-only notes, safeguarding details, and deen sensitive text not exposed', () => {
    const result = reviewPrivacySafety();
    expect(result.teacherOnlyNotesExposed).toBe(false);
    expect(result.safeguardingRawDetailsExposed).toBe(false);
    expect(result.deenSensitivePrivateTextExposed).toBe(false);
  });

  it('should have internal infrastructure fields not exposed', () => {
    const result = reviewPrivacySafety();
    expect(result.aiPromptsExposed).toBe(false);
    expect(result.providerResponsesExposed).toBe(false);
    expect(result.tokensSecretsExposed).toBe(false);
    expect(result.databaseUrlsExposed).toBe(false);
  });

  it('should have academic and teacher-only content not exposed', () => {
    const result = reviewPrivacySafety();
    expect(result.answerKeysExposed).toBe(false);
    expect(result.teacherOnlyContentExposed).toBe(false);
    expect(result.protectedRubricsExposed).toBe(false);
  });

  it('should have real student personal data and roster not exposed', () => {
    const result = reviewPrivacySafety();
    expect(result.realStudentEmailsExposed).toBe(false);
    expect(result.realPhoneNumbersExposed).toBe(false);
    expect(result.realRosterExportExposed).toBe(false);
  });
});

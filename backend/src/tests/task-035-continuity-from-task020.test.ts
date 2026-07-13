import { describe, it, expect } from 'vitest';
import { resolveSchoolWideReadinessRole035, getSchoolWideReadinessRolePermissions035 } from '../contracts/task035SchoolWideReadinessContracts';
import { reviewPrivacySafety } from '../services/task035PrivacyReviewService';

describe('task035 continuity from task020 (privacy governance)', () => {
  it('privacy governance functions are importable', () => {
    expect(typeof reviewPrivacySafety).toBe('function');
    expect(typeof resolveSchoolWideReadinessRole035).toBe('function');
  });

  it('privacy review blocks all 15 forbidden data categories', () => {
    const result = reviewPrivacySafety();
    expect(result.rawStudentChatExposed).toBe(false);
    expect(result.privateLearnerMemoryExposed).toBe(false);
    expect(result.teacherOnlyNotesExposed).toBe(false);
    expect(result.safeguardingRawDetailsExposed).toBe(false);
    expect(result.deenSensitivePrivateTextExposed).toBe(false);
    expect(result.aiPromptsExposed).toBe(false);
    expect(result.providerResponsesExposed).toBe(false);
    expect(result.tokensSecretsExposed).toBe(false);
    expect(result.databaseUrlsExposed).toBe(false);
    expect(result.answerKeysExposed).toBe(false);
    expect(result.teacherOnlyContentExposed).toBe(false);
    expect(result.protectedRubricsExposed).toBe(false);
    expect(result.realStudentEmailsExposed).toBe(false);
    expect(result.realPhoneNumbersExposed).toBe(false);
    expect(result.realRosterExportExposed).toBe(false);
  });

  it('privacy review passes with no blocking issues', () => {
    const result = reviewPrivacySafety();
    expect(result.ok).toBe(true);
    expect(result.blockingIssues).toHaveLength(0);
  });
});

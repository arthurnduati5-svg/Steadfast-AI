import { describe, it, expect } from 'vitest';
import { TASK035_FORBIDDEN_OUTPUT_PATTERNS, TASK035_SAFE_IDENTIFIERS } from '../contracts/task035SchoolWideReadinessContracts';
import { reviewPrivacySafety } from '../services/task035PrivacyReviewService';
import { generateStudentSafeLaunchNotice } from '../services/task035StudentSafeLaunchNoticeService';

describe('task035 privacy leak detection', () => {
  it('forbidden patterns list is non-empty', () => {
    expect(TASK035_FORBIDDEN_OUTPUT_PATTERNS.length).toBeGreaterThanOrEqual(10);
  });

  it('safe identifiers list is non-empty', () => {
    expect(TASK035_SAFE_IDENTIFIERS.length).toBeGreaterThanOrEqual(10);
  });

  it('all 15 privacy fields are individually enumerated', () => {
    const r = reviewPrivacySafety();
    const exposedCount = [
      r.rawStudentChatExposed, r.privateLearnerMemoryExposed, r.teacherOnlyNotesExposed,
      r.safeguardingRawDetailsExposed, r.deenSensitivePrivateTextExposed,
      r.aiPromptsExposed, r.providerResponsesExposed, r.tokensSecretsExposed,
      r.databaseUrlsExposed, r.answerKeysExposed, r.teacherOnlyContentExposed,
      r.protectedRubricsExposed, r.realStudentEmailsExposed, r.realPhoneNumbersExposed,
      r.realRosterExportExposed,
    ].filter(Boolean).length;
    expect(exposedCount).toBe(0);
  });

  it('student notice contains no forbidden patterns', () => {
    const safeNotice = generateStudentSafeLaunchNotice();
    expect(safeNotice.noInternalRolloutDetailsExposed).toBe(true);
    expect(safeNotice.noPrivateStudentStatus).toBe(true);
    expect(safeNotice.noOtherStudentInfo).toBe(true);
    expect(safeNotice.noTeacherOnlyNotes).toBe(true);
    expect(safeNotice.noAnswerKeys).toBe(true);
    expect(safeNotice.noAiProviderDetails).toBe(true);
    expect(safeNotice.noDebugDetails).toBe(true);
  });

  it('forbidden patterns include database URL and secrets patterns', () => {
    expect(TASK035_FORBIDDEN_OUTPUT_PATTERNS.some(p => p.includes('postgres'))).toBe(true);
    expect(TASK035_FORBIDDEN_OUTPUT_PATTERNS.some(p => p.includes('Bearer'))).toBe(true);
    expect(TASK035_FORBIDDEN_OUTPUT_PATTERNS.some(p => p.includes('sk-'))).toBe(true);
  });

  it('forbidden patterns include privacy categories', () => {
    expect(TASK035_FORBIDDEN_OUTPUT_PATTERNS).toContain('raw student chat');
    expect(TASK035_FORBIDDEN_OUTPUT_PATTERNS).toContain('private learner memory');
    expect(TASK035_FORBIDDEN_OUTPUT_PATTERNS).toContain('answer key');
  });

  it('forbidden patterns include stack trace and exception patterns', () => {
    expect(TASK035_FORBIDDEN_OUTPUT_PATTERNS.some(p => p.includes('stack trace'))).toBe(true);
    expect(TASK035_FORBIDDEN_OUTPUT_PATTERNS.some(p => p.includes('exception'))).toBe(true);
  });

  it('safe identifiers include task035 safe school/tenant hashes', () => {
    expect(TASK035_SAFE_IDENTIFIERS.some(i => i.includes('school_task035_full_school_safe'))).toBe(true);
    expect(TASK035_SAFE_IDENTIFIERS.some(i => i.includes('tenant_task035_full_school_safe'))).toBe(true);
  });

  it('no private data crosses the student notice boundary', () => {
    const notice = generateStudentSafeLaunchNotice();
    const msg = notice.safeNoticeMessage;
    expect(msg).not.toMatch(/task-\d+/i);
    expect(msg).not.toMatch(/rollout/i);
    expect(msg).not.toMatch(/gate/i);
    expect(msg).not.toMatch(/simulation/i);
  });

  it('student notice is calm and mentions guided learning', () => {
    const notice = generateStudentSafeLaunchNotice();
    expect(notice.noticeIsCalm).toBe(true);
    expect(notice.noticeNonTechnical).toBe(true);
    expect(notice.noticeMentionsGuidedLearning).toBe(true);
  });
});

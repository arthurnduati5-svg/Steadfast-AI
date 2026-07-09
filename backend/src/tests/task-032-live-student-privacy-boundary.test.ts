import { describe, it, expect } from 'vitest';
import { runTask032LiveStudentPrivacyBoundary } from '../services/task032LiveStudentPrivacyBoundaryService';

describe('Task 032 - Live Student Privacy Boundary', () => {
  it('should pass with valid schoolId', async () => {
    const result = await runTask032LiveStudentPrivacyBoundary({
      schoolId: 'school_task032_safe',
      actorRole: 'school_admin',
    });
    expect(result.ok).toBe(true);
    expect(result.blockingIssues).toHaveLength(0);
  });

  it('should block all raw learner profile data', async () => {
    const result = await runTask032LiveStudentPrivacyBoundary({
      schoolId: 'school_task032_safe',
      actorRole: 'school_admin',
    });
    expect(result.rawLearnerProfilesBlocked).toBe(true);
  });

  it('should block all real email data', async () => {
    const result = await runTask032LiveStudentPrivacyBoundary({
      schoolId: 'school_task032_safe',
      actorRole: 'school_admin',
    });
    expect(result.realEmailsBlocked).toBe(true);
  });

  it('should block all real phone numbers', async () => {
    const result = await runTask032LiveStudentPrivacyBoundary({
      schoolId: 'school_task032_safe',
      actorRole: 'school_admin',
    });
    expect(result.realPhoneNumbersBlocked).toBe(true);
  });

  it('should block parent contact data', async () => {
    const result = await runTask032LiveStudentPrivacyBoundary({
      schoolId: 'school_task032_safe',
      actorRole: 'school_admin',
    });
    expect(result.parentContactDataBlocked).toBe(true);
  });

  it('should block raw chat data', async () => {
    const result = await runTask032LiveStudentPrivacyBoundary({
      schoolId: 'school_task032_safe',
      actorRole: 'school_admin',
    });
    expect(result.rawChatBlocked).toBe(true);
  });

  it('should block raw student answers and work', async () => {
    const result = await runTask032LiveStudentPrivacyBoundary({
      schoolId: 'school_task032_safe',
      actorRole: 'school_admin',
    });
    expect(result.rawStudentAnswersBlocked).toBe(true);
    expect(result.rawStudentWorkBlocked).toBe(true);
  });

  it('should block safeguarding raw notes', async () => {
    const result = await runTask032LiveStudentPrivacyBoundary({
      schoolId: 'school_task032_safe',
      actorRole: 'school_admin',
    });
    expect(result.safeguardingRawNotesBlocked).toBe(true);
  });

  it('should block private Deen text', async () => {
    const result = await runTask032LiveStudentPrivacyBoundary({
      schoolId: 'school_task032_safe',
      actorRole: 'school_admin',
    });
    expect(result.privateDeenTextBlocked).toBe(true);
  });

  it('should block answer keys and marking schemes', async () => {
    const result = await runTask032LiveStudentPrivacyBoundary({
      schoolId: 'school_task032_safe',
      actorRole: 'school_admin',
    });
    expect(result.answerKeysBlocked).toBe(true);
    expect(result.markingSchemesBlocked).toBe(true);
  });

  it('should block teacher private notes', async () => {
    const result = await runTask032LiveStudentPrivacyBoundary({
      schoolId: 'school_task032_safe',
      actorRole: 'school_admin',
    });
    expect(result.teacherPrivateNotesBlocked).toBe(true);
  });

  it('should block provider prompts and responses', async () => {
    const result = await runTask032LiveStudentPrivacyBoundary({
      schoolId: 'school_task032_safe',
      actorRole: 'school_admin',
    });
    expect(result.providerPromptsResponsesBlocked).toBe(true);
  });

  it('should block hidden reasoning', async () => {
    const result = await runTask032LiveStudentPrivacyBoundary({
      schoolId: 'school_task032_safe',
      actorRole: 'school_admin',
    });
    expect(result.hiddenReasoningBlocked).toBe(true);
  });

  it('should fail with missing schoolId', async () => {
    const result = await runTask032LiveStudentPrivacyBoundary({
      schoolId: '',
      actorRole: 'school_admin',
    });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('missing_school_id');
  });
});

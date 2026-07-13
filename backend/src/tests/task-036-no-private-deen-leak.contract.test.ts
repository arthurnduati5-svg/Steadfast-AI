import { describe, it, expect } from 'vitest';
import { TASK036_FORBIDDEN_OUTPUT_FIELDS } from '../contracts/task036LiveSchoolLaunchContracts';
import { validateForbiddenOutputFields, validateDeenBoundaryResult, validatePrivacyBoundaryResult } from '../lib/task036LiveSchoolLaunchValidation';

describe('No Private Deen Leak Contract', () => {
  it('forbids privateDeenText exposure', () => {
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('privateDeenText');
  });

  it('validateForbiddenOutputFields detects private deen text', () => {
    const errors = validateForbiddenOutputFields({ privateDeenText: 'sensitive deen content' });
    expect(errors).toContain('forbidden_field_present:privateDeenText');
  });

  it('deen boundary result catches deen text exposure', () => {
    const errors = validateDeenBoundaryResult({
      ok: false, passed: false, noFatwaEngineMode: true,
      approvedDeenSourceRequired: true, teacherScholarReferralPreserved: true,
      noPietyScoring: true, noUnsafeDeenAuthority: true,
      deenSensitiveTextProtected: false, blockingIssues: [],
    });
    expect(errors).toContain('deen_sensitive_text_not_protected');
  });

  it('raw deen text exposure is caught in privacy boundary', () => {
    const errors = validatePrivacyBoundaryResult({
      ok: false, passed: false, rawStudentChatExposed: false,
      rawAnswersExposed: false, rawSafeguardingNotesExposed: false,
      rawDeenTextExposed: true, rawProviderPayloadExposed: false,
      parentContactExposed: false, teacherPrivateNotesExposed: false,
      hiddenReasoningExposed: false, secretsExposed: false,
      answerKeyExposed: false, markingSchemeExposed: false,
      blockingIssues: [],
    });
    expect(errors).toContain('raw_deen_text_exposed');
  });
});

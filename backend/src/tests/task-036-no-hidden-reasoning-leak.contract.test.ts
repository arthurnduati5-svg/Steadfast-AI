import { describe, it, expect } from 'vitest';
import { TASK036_FORBIDDEN_OUTPUT_FIELDS } from '../contracts/task036LiveSchoolLaunchContracts';
import { validateForbiddenOutputFields, validatePrivacyBoundaryResult } from '../lib/task036LiveSchoolLaunchValidation';

describe('No Hidden Reasoning Leak Contract', () => {
  it('forbids hiddenReasoning exposure', () => {
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('hiddenReasoning');
  });

  it('validateForbiddenOutputFields detects hidden reasoning', () => {
    const errors = validateForbiddenOutputFields({ hiddenReasoning: 'model internal thoughts' });
    expect(errors).toContain('forbidden_field_present:hiddenReasoning');
  });

  it('hidden reasoning is caught in privacy boundary checks', () => {
    const errors = validatePrivacyBoundaryResult({
      ok: false, passed: false, rawStudentChatExposed: false,
      rawAnswersExposed: false, rawSafeguardingNotesExposed: false,
      rawDeenTextExposed: false, rawProviderPayloadExposed: false,
      parentContactExposed: false, teacherPrivateNotesExposed: false,
      hiddenReasoningExposed: true, secretsExposed: false,
      answerKeyExposed: false, markingSchemeExposed: false,
      blockingIssues: [],
    });
    expect(errors).toContain('hidden_reasoning_exposed');
  });

  it('safeguarding output fields are protected', () => {
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('rawSafeguardingNote');
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('rawChat');
  });
});

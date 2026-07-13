import { describe, it, expect } from 'vitest';
import { TASK036_FORBIDDEN_OUTPUT_FIELDS } from '../contracts/task036LiveSchoolLaunchContracts';
import { validateForbiddenOutputFields, validatePrivacyBoundaryResult, validateSocraticIntegrityResult } from '../lib/task036LiveSchoolLaunchValidation';

describe('No Safeguarding Raw Leak Contract', () => {
  it('forbids rawSafeguardingNote exposure', () => {
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('rawSafeguardingNote');
  });

  it('validateForbiddenOutputFields detects raw safeguarding note', () => {
    const errors = validateForbiddenOutputFields({ rawSafeguardingNote: 'sensitive safeguarding info' });
    expect(errors).toContain('forbidden_field_present:rawSafeguardingNote');
  });

  it('privacy boundary catches raw safeguarding notes exposure', () => {
    const errors = validatePrivacyBoundaryResult({
      ok: false, passed: false, rawStudentChatExposed: false,
      rawAnswersExposed: false, rawSafeguardingNotesExposed: true,
      rawDeenTextExposed: false, rawProviderPayloadExposed: false,
      parentContactExposed: false, teacherPrivateNotesExposed: false,
      hiddenReasoningExposed: false, secretsExposed: false,
      answerKeyExposed: false, markingSchemeExposed: false,
      blockingIssues: [],
    });
    expect(errors).toContain('raw_safeguarding_notes_exposed');
  });

  it('Socratic integrity protects against cheating bypass', () => {
    const errors = validateSocraticIntegrityResult({
      ok: false, passed: false, socraticGuidancePreserved: true,
      noFinalAnswerBotBehavior: true, cheatingPreventionPreserved: false,
      noHomeworkShortcut: true, blockingIssues: [],
    });
    expect(errors).toContain('cheating_prevention_not_preserved');
  });
});

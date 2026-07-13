import { describe, it, expect } from 'vitest';
import {
  TASK036_FORBIDDEN_OUTPUT_FIELDS,
} from '../contracts/task036LiveSchoolLaunchContracts';
import {
  validateForbiddenOutputFields,
  validatePrivacyBoundaryResult,
} from '../lib/task036LiveSchoolLaunchValidation';

describe('Task036 Forbidden Output Fields', () => {
  it('list contains all expected forbidden fields', () => {
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('rawLearnerData');
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('rawChat');
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('rawAnswer');
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('parentContact');
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('teacherPrivateNote');
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('providerPayload');
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('hiddenReasoning');
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('secret');
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('privateDeenText');
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('answerKey');
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('markingScheme');
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('rawSafeguardingNote');
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('studentPhone');
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('studentEmail');
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('parentPhone');
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('parentEmail');
  });

  it('forbidden list has exactly 16 entries', () => {
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS.length).toBe(16);
  });

  it('validateForbiddenOutputFields returns errors for each forbidden field', () => {
    const obj: Record<string, unknown> = {};
    for (const field of TASK036_FORBIDDEN_OUTPUT_FIELDS) {
      obj[field] = 'exposed';
    }
    const errors = validateForbiddenOutputFields(obj);
    expect(errors.length).toBe(TASK036_FORBIDDEN_OUTPUT_FIELDS.length);
  });

  it('validateForbiddenOutputFields ignores undefined values', () => {
    const obj: Record<string, unknown> = {
      rawLearnerData: undefined,
      rawChat: undefined,
    };
    const errors = validateForbiddenOutputFields(obj);
    expect(errors).toEqual([]);
  });

  it('validatePrivacyBoundaryResult catches all exposure types', () => {
    const result = {
      ok: false, passed: false, rawStudentChatExposed: true,
      rawAnswersExposed: true, rawSafeguardingNotesExposed: true,
      rawDeenTextExposed: true, rawProviderPayloadExposed: true,
      parentContactExposed: true, teacherPrivateNotesExposed: true,
      hiddenReasoningExposed: true, secretsExposed: true,
      answerKeyExposed: true, markingSchemeExposed: true,
      blockingIssues: [],
    };
    const errors = validatePrivacyBoundaryResult(result);
    expect(errors.length).toBe(13);
  });

  it('forbidden fields include no duplicates', () => {
    const unique = new Set(TASK036_FORBIDDEN_OUTPUT_FIELDS);
    expect(unique.size).toBe(TASK036_FORBIDDEN_OUTPUT_FIELDS.length);
  });
});

import { describe, it, expect } from 'vitest';
import { TASK034_FORBIDDEN_OUTPUT_FIELDS } from '../contracts/task034ControlledLimitedRolloutContracts';
import { rejectTask034ForbiddenFields, validateTask034PrivacyReview } from '../lib/task034ControlledLimitedRolloutValidation';

describe('task034 no hidden reasoning leak', () => {
  it('forbidden fields contains hiddenReasoning', () => {
    expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).toContain('hiddenReasoning');
  });

  it('forbidden fields contains chainOfThought', () => {
    expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).toContain('chainOfThought');
  });

  it('rejectTask034ForbiddenFields matches hiddenReasoning', () => {
    const result = rejectTask034ForbiddenFields({ hiddenReasoning: 'internal thoughts' });
    expect(result.hasForbiddenFields).toBe(true);
    expect(result.matchedFields).toContain('hiddenReasoning');
  });

  it('rejectTask034ForbiddenFields matches chainOfThought', () => {
    const result = rejectTask034ForbiddenFields({ chainOfThought: 'step by step' });
    expect(result.hasForbiddenFields).toBe(true);
    expect(result.matchedFields).toContain('chainOfThought');
  });

  it('rejectTask034ForbiddenFields returns false for safe object', () => {
    const result = rejectTask034ForbiddenFields({ safeReasonCodes: ['R1'] });
    expect(result.hasForbiddenFields).toBe(false);
  });

  it('validateTask034PrivacyReview requires noHiddenReasoning', () => {
    const result = validateTask034PrivacyReview({
      ok: true,
      noRawLearnerData: true,
      noRawChat: true,
      noRawAnswer: true,
      noRawStudentWork: true,
      noParentContactData: true,
      noTeacherPrivateNotes: true,
      noSafeguardingRawNotes: true,
      noPrivateDeenText: true,
      noAnswerKey: true,
      noMarkingScheme: true,
      noProviderPrompt: true,
      noProviderResponse: true,
      noHiddenReasoning: true,
      blockingIssues: [],
    });
    expect(result.ok).toBe(true);
  });
});

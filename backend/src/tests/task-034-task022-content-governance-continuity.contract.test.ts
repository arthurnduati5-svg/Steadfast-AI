import { describe, it, expect } from 'vitest';
import {
  Task034ContentGovernanceReviewResult,
  TASK034_FORBIDDEN_OUTPUT_FIELDS,
  TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS,
} from '../contracts/task034ControlledLimitedRolloutContracts';
import { validateTask034ContentGovernanceReview } from '../lib/task034ControlledLimitedRolloutValidation';

describe('task034 task022 content governance continuity', () => {
  it('valid content governance review passes', () => {
    const result = validateTask034ContentGovernanceReview({
      ok: true,
      approvedCurriculumSourceRequired: true,
      noInventedTeachingClaim: true,
      noAnswerKeyLeakage: true,
      noMarkingSchemeLeakage: true,
      noTeacherOnlyLeakage: true,
      blockingIssues: [],
    });
    expect(result.ok).toBe(true);
  });

  it('missing approvedCurriculumSourceRequired fails', () => {
    const result = validateTask034ContentGovernanceReview({
      ok: true,
      noInventedTeachingClaim: true,
      noAnswerKeyLeakage: true,
      noMarkingSchemeLeakage: true,
      noTeacherOnlyLeakage: true,
      blockingIssues: [],
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('missing_approvedCurriculumSourceRequired');
  });

  it('rejects null input', () => {
    const result = validateTask034ContentGovernanceReview(null);
    expect(result.ok).toBe(false);
  });

  it('forbidden fields include answerKey', () => {
    expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).toContain('answerKey');
  });

  it('forbidden fields include markingScheme', () => {
    expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).toContain('markingScheme');
  });

  it('forbidden fields include teacherPrivateNotes', () => {
    expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).toContain('teacherPrivateNotes');
  });

  it('blockingIssues must be array', () => {
    const result = validateTask034ContentGovernanceReview({
      ok: true,
      approvedCurriculumSourceRequired: true,
      noInventedTeachingClaim: true,
      noAnswerKeyLeakage: true,
      noMarkingSchemeLeakage: true,
      noTeacherOnlyLeakage: true,
      blockingIssues: 'not-array',
    });
    expect(result.ok).toBe(false);
  });

  it('interface has all content governance fields', () => {
    const review: Task034ContentGovernanceReviewResult = {
      ok: true,
      approvedCurriculumSourceRequired: true,
      noInventedTeachingClaim: true,
      noAnswerKeyLeakage: true,
      noMarkingSchemeLeakage: true,
      noTeacherOnlyLeakage: true,
      blockingIssues: [],
    };
    expect(review.noAnswerKeyLeakage).toBe(true);
    expect(review.noMarkingSchemeLeakage).toBe(true);
    expect(review.noTeacherOnlyLeakage).toBe(true);
    expect(review.noInventedTeachingClaim).toBe(true);
    expect(review.approvedCurriculumSourceRequired).toBe(true);
  });
});

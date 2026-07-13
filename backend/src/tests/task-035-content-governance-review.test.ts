import { describe, it, expect } from 'vitest';
import { reviewCurriculumSource } from '../services/task035CurriculumSourceReviewService';

describe('task035CurriculumSourceReviewService', () => {
  it('returns a result with expected fields', () => {
    const result = reviewCurriculumSource();
    expect(result).toBeDefined();
    expect(typeof result.ok).toBe('boolean');
    expect(Array.isArray(result.blockingIssues)).toBe(true);
  });

  it('requires approved source scope', () => {
    const result = reviewCurriculumSource();
    expect(result.approvedSourceScopeRequired).toBe(true);
  });

  it('blocks unapproved subjects', () => {
    const result = reviewCurriculumSource();
    expect(result.unapprovedSubjectBlocked).toBe(true);
  });

  it('does not expose teacher-only content', () => {
    const result = reviewCurriculumSource();
    expect(result.teacherOnlyContentExposed).toBe(false);
  });

  it('does not expose answer keys', () => {
    const result = reviewCurriculumSource();
    expect(result.answerKeyExposureDetected).toBe(false);
  });

  it('handles content gaps safely', () => {
    const result = reviewCurriculumSource();
    expect(result.contentGapHandledSafely).toBe(true);
  });

  it('has no blocking issues when all gates pass', () => {
    const result = reviewCurriculumSource();
    expect(result.ok).toBe(true);
    expect(result.blockingIssues).toHaveLength(0);
  });
});

import { describe, it, expect } from 'vitest';
import { reviewCurriculumSource } from '../services/task035CurriculumSourceReviewService';

describe('task035CurriculumSourceReview', () => {
  it('should pass the curriculum gate', () => {
    const result = reviewCurriculumSource();
    expect(result.ok).toBe(true);
    expect(result.curriculumGatePassed).toBe(true);
    expect(result.blockingIssues).toHaveLength(0);
  });

  it('should have approved curriculum and source scope required', () => {
    const result = reviewCurriculumSource();
    expect(result.approvedCurriculumScopeRequired).toBe(true);
    expect(result.approvedSourceScopeRequired).toBe(true);
  });

  it('should block unapproved subjects and handle content gaps safely', () => {
    const result = reviewCurriculumSource();
    expect(result.unapprovedSubjectBlocked).toBe(true);
    expect(result.contentGapHandledSafely).toBe(true);
  });

  it('should not expose teacher-only content or answer keys', () => {
    const result = reviewCurriculumSource();
    expect(result.teacherOnlyContentExposed).toBe(false);
    expect(result.answerKeyExposureDetected).toBe(false);
  });

  it('should have full school subject coverage classified', () => {
    const result = reviewCurriculumSource();
    expect(result.fullSchoolSubjectCoverageClassified).toBe(true);
  });
});

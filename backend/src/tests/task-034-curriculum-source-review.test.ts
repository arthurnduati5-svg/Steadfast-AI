import { describe, it, expect } from 'vitest';
import { reviewCurriculumSource } from '../services/task034CurriculumSourceReviewService';

describe('Task034CurriculumSourceReview', () => {
  it('should pass with default values', () => {
    const result = reviewCurriculumSource();
    expect(result.curriculumGatePassed).toBe(true);
    expect(result.approvedCurriculumScopeRequired).toBe(true);
    expect(result.approvedSourceScopeRequired).toBe(true);
    expect(result.unapprovedSubjectBlocked).toBe(true);
    expect(result.teacherOnlyContentExposed).toBe(false);
    expect(result.answerKeyExposureDetected).toBe(false);
    expect(result.contentGapHandledSafely).toBe(true);
    expect(result.blockingIssues).toEqual([]);
  });

  it('should fail when curriculum gate fails', () => {
    const result = reviewCurriculumSource({ curriculumGatePassed: false });
    expect(result.blockingIssues).toContain('CURRICULUM_GATE_FAILED');
  });

  it('should fail when approved curriculum scope not required', () => {
    const result = reviewCurriculumSource({ approvedCurriculumScopeRequired: false });
    expect(result.blockingIssues).toContain('APPROVED_CURRICULUM_SCOPE_NOT_REQUIRED');
  });

  it('should fail when unapproved subject not blocked', () => {
    const result = reviewCurriculumSource({ unapprovedSubjectBlocked: false });
    expect(result.blockingIssues).toContain('UNAPPROVED_SUBJECT_NOT_BLOCKED');
  });

  it('should fail when teacher-only content exposed', () => {
    const result = reviewCurriculumSource({ teacherOnlyContentExposed: true });
    expect(result.blockingIssues).toContain('TEACHER_ONLY_CONTENT_EXPOSED');
  });

  it('should fail when answer key exposure detected', () => {
    const result = reviewCurriculumSource({ answerKeyExposureDetected: true });
    expect(result.blockingIssues).toContain('ANSWER_KEY_EXPOSURE_DETECTED');
  });

  it('should fail when content gap not handled safely', () => {
    const result = reviewCurriculumSource({ contentGapHandledSafely: false });
    expect(result.blockingIssues).toContain('CONTENT_GAP_NOT_HANDLED_SAFELY');
  });
});

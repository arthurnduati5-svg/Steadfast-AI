import { describe, it, expect, beforeAll } from 'vitest';

describe('Task 035 - Curriculum/Source Review', () => {
  let service: any;

  beforeAll(async () => {
    service = await import('../services/task035CurriculumSourceReviewService');
  });

  it('should export reviewCurriculumSource function', () => {
    expect(typeof service.reviewCurriculumSource).toBe('function');
  });

  it('should confirm curriculum/source governance is intact', () => {
    const result = service.reviewCurriculumSource();
    expect(result.ok).toBe(true);
    expect(result.curriculumGatePassed).toBe(true);
    expect(result.approvedCurriculumScopeRequired).toBe(true);
    expect(result.approvedSourceScopeRequired).toBe(true);
    expect(result.unapprovedSubjectBlocked).toBe(true);
    expect(result.teacherOnlyContentExposed).toBe(false);
    expect(result.answerKeyExposureDetected).toBe(false);
    expect(result.contentGapHandledSafely).toBe(true);
  });
});

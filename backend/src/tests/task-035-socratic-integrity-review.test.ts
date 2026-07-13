import { describe, it, expect, beforeAll } from 'vitest';

describe('Task 035 - Socratic Integrity Review', () => {
  let service: any;

  beforeAll(async () => {
    service = await import('../services/task035SocraticIntegrityReviewService');
  });

  it('should export reviewSocraticIntegrity function', () => {
    expect(typeof service.reviewSocraticIntegrity).toBe('function');
  });

  it('should confirm Socratic gate is intact', () => {
    const result = service.reviewSocraticIntegrity();
    expect(result.ok).toBe(true);
    expect(result.socraticGatePassed).toBe(true);
    expect(result.noFinalAnswerPolicyWeakened).toBe(false);
    expect(result.answerKeyExposureDetected).toBe(false);
    expect(result.homeworkShortcutDetected).toBe(false);
    expect(result.studentReasoningFirstPreserved).toBe(true);
    expect(result.hintLadderPreserved).toBe(true);
    expect(result.teacherEscalationAvailable).toBe(true);
  });
});

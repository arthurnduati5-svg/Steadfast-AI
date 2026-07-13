import { describe, it, expect } from 'vitest';
import { reviewSocraticIntegrity } from '../services/task035SocraticIntegrityReviewService';

describe('task035SocraticIntegrityReview', () => {
  it('should pass the socratic gate and preserve student reasoning first', () => {
    const result = reviewSocraticIntegrity();
    expect(result.ok).toBe(true);
    expect(result.socraticGatePassed).toBe(true);
    expect(result.studentReasoningFirstPreserved).toBe(true);
  });

  it('should not weaken the no-final-answer policy', () => {
    const result = reviewSocraticIntegrity();
    expect(result.noFinalAnswerPolicyWeakened).toBe(false);
    expect(result.hintLadderPreserved).toBe(true);
  });

  it('should not have answer key exposure or homework shortcuts', () => {
    const result = reviewSocraticIntegrity();
    expect(result.answerKeyExposureDetected).toBe(false);
    expect(result.homeworkShortcutDetected).toBe(false);
  });

  it('should have teacher escalation available', () => {
    const result = reviewSocraticIntegrity();
    expect(result.teacherEscalationAvailable).toBe(true);
    expect(result.blockingIssues).toHaveLength(0);
  });
});

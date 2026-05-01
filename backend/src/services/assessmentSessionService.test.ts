import { describe, expect, it } from 'vitest';
import { __assessmentSessionServiceInternals } from './assessmentSessionService';

describe('assessmentSessionService internals', () => {
  it('resolves exam and focus presets with locked defaults', () => {
    const examPreset = __assessmentSessionServiceInternals.resolveModePreset('exam');
    const focusPreset = __assessmentSessionServiceInternals.resolveModePreset('focus');

    expect(examPreset.modeType).toBe('quick_drill');
    expect(examPreset.questionCount).toBe(3);
    expect(examPreset.reviewMode).toBe('immediate');

    expect(focusPreset.modeType).toBe('focus_session');
    expect(focusPreset.questionCount).toBe(5);
    expect(focusPreset.strictness).toBe('light_support');
  });

  it('derives strictness policy gates correctly', () => {
    const strictPolicy = __assessmentSessionServiceInternals.derivePolicy('strict_exam', 'delayed_block');
    const lightPolicy = __assessmentSessionServiceInternals.derivePolicy('light_support', 'immediate');

    expect(strictPolicy.preSubmitHelpAllowed).toBe(false);
    expect(strictPolicy.hintsPerQuestion).toBe(0);

    expect(lightPolicy.preSubmitHelpAllowed).toBe(true);
    expect(lightPolicy.hintsPerQuestion).toBe(1);
  });

  it('marks review availability based on review mode and progress', () => {
    expect(
      __assessmentSessionServiceInternals.canReviewNow({
        reviewMode: 'immediate',
        sessionStatus: 'in_progress',
        answeredCount: 1,
        flaggedCount: 0,
      })
    ).toBe(true);

    expect(
      __assessmentSessionServiceInternals.canReviewNow({
        reviewMode: 'delayed_block',
        sessionStatus: 'in_progress',
        answeredCount: 4,
        flaggedCount: 0,
      })
    ).toBe(false);

    expect(
      __assessmentSessionServiceInternals.canReviewNow({
        reviewMode: 'delayed_block',
        sessionStatus: 'in_progress',
        answeredCount: 5,
        flaggedCount: 0,
      })
    ).toBe(true);

    expect(
      __assessmentSessionServiceInternals.canReviewNow({
        reviewMode: 'post_mock',
        sessionStatus: 'completed',
        answeredCount: 2,
        flaggedCount: 0,
      })
    ).toBe(true);
  });

  it('defers detailed feedback for review-gated policies', () => {
    expect(__assessmentSessionServiceInternals.shouldDeferDetailedFeedback('review_after_attempt', 'immediate')).toBe(true);
    expect(__assessmentSessionServiceInternals.shouldDeferDetailedFeedback('strict_exam', 'post_mock')).toBe(true);
    expect(__assessmentSessionServiceInternals.shouldDeferDetailedFeedback('light_support', 'immediate')).toBe(false);
  });

  it('classifies timer urgency with calm thresholds', () => {
    expect(__assessmentSessionServiceInternals.timerUrgency(100, 19)).toBe('warning');
    expect(__assessmentSessionServiceInternals.timerUrgency(100, 5)).toBe('critical');
    expect(__assessmentSessionServiceInternals.timerUrgency(100, 0)).toBe('expired');
    expect(__assessmentSessionServiceInternals.timerUrgency(null, null)).toBe('normal');
  });
});

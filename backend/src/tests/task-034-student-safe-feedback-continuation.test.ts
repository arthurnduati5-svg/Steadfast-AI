import { describe, it, expect } from 'vitest';
import { createStudentSafeFeedback } from '../services/task034StudentSafeFeedbackContinuationService';

describe('Task034StudentSafeFeedbackContinuation', () => {
  it('should create valid category-only feedback', () => {
    const result = createStudentSafeFeedback({
      studentHash: 'student_hash_task034_safe_001',
      rolloutRunId: 'rollout_run_task034_safe',
      feedbackCategory: 'helpful',
      safeSentiment: 'positive',
      difficultyLevel: 'medium',
      feltHelped: true,
      safeNextStepNeeded: 'continue',
    });

    expect(result.ok).toBe(true);
    expect(result.rawFreeformBlocked).toBe(true);
    expect(result.blockingIssues).toEqual([]);
  });

  it('should reject invalid category', () => {
    const result = createStudentSafeFeedback({
      studentHash: 'student_hash_task034_safe_001',
      rolloutRunId: 'rollout_run_task034_safe',
      feedbackCategory: 'invalid_category' as any,
      safeSentiment: 'ok',
      difficultyLevel: 'medium',
      feltHelped: true,
      safeNextStepNeeded: 'continue',
    });

    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('INVALID_FEEDBACK_CATEGORY');
  });

  it('should reject invalid student hash', () => {
    const result = createStudentSafeFeedback({
      studentHash: 'unknown_student',
      rolloutRunId: 'rollout_run_task034_safe',
      feedbackCategory: 'helpful',
      safeSentiment: 'positive',
      difficultyLevel: 'easy',
      feltHelped: true,
      safeNextStepNeeded: 'continue',
    });

    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('INVALID_STUDENT_HASH');
  });

  it('should reject raw private data in feedback', () => {
    const result = createStudentSafeFeedback({
      studentHash: 'student_hash_task034_safe_001',
      rolloutRunId: 'rollout_run_task034_safe',
      feedbackCategory: 'confusing',
      safeSentiment: 'raw student chat here',
      difficultyLevel: 'hard',
      feltHelped: false,
      safeNextStepNeeded: 'needs help',
    });

    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('RAW_PRIVATE_DATA_IN_FEEDBACK');
  });

  it('should allow all valid categories', () => {
    const categories = ['helpful', 'confusing', 'too_hard', 'too_easy', 'technical_issue', 'needs_teacher_help', 'not_sure'];
    for (const category of categories) {
      const result = createStudentSafeFeedback({
        studentHash: 'student_hash_task034_safe_001',
        rolloutRunId: 'rollout_run_task034_safe',
        feedbackCategory: category as any,
        safeSentiment: 'ok',
        difficultyLevel: 'medium',
        feltHelped: false,
        safeNextStepNeeded: 'continue',
      });
      expect(result.ok).toBe(true);
    }
  });
});

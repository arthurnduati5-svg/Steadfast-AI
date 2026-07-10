import { describe, it, expect } from 'vitest';
import { reviewTask034ContentGovernance } from '../services/task034ContentGovernanceReviewService';

describe('Task034 Content Governance Review', () => {
  it('All governance fields pass by default', () => {
    const result = reviewTask034ContentGovernance();
    expect(result.ok).toBe(true);
    expect(result.approvedCurriculumSourceRequired).toBe(true);
    expect(result.noInventedTeachingClaim).toBe(true);
    expect(result.noAnswerKeyLeakage).toBe(true);
    expect(result.noMarkingSchemeLeakage).toBe(true);
    expect(result.noTeacherOnlyLeakage).toBe(true);
  });

  it('approvedCurriculumSourceRequired false blocks', () => {
    const result = reviewTask034ContentGovernance({ approvedCurriculumSourceRequired: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('approved_curriculum_source_not_required');
  });

  it('noInventedTeachingClaim false blocks', () => {
    const result = reviewTask034ContentGovernance({ noInventedTeachingClaim: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('invented_teaching_claim_detected');
  });

  it('noAnswerKeyLeakage false blocks', () => {
    const result = reviewTask034ContentGovernance({ noAnswerKeyLeakage: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('answer_key_leakage_detected');
  });

  it('noMarkingSchemeLeakage false blocks', () => {
    const result = reviewTask034ContentGovernance({ noMarkingSchemeLeakage: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('marking_scheme_leakage_detected');
  });

  it('noTeacherOnlyLeakage false blocks', () => {
    const result = reviewTask034ContentGovernance({ noTeacherOnlyLeakage: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('teacher_only_leakage_detected');
  });

  it('Multiple failures aggregate blocking issues', () => {
    const result = reviewTask034ContentGovernance({
      approvedCurriculumSourceRequired: false,
      noInventedTeachingClaim: false,
    });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues.length).toBe(2);
  });

  it('Partial override preserves remaining defaults', () => {
    const result = reviewTask034ContentGovernance({ noAnswerKeyLeakage: false });
    expect(result.approvedCurriculumSourceRequired).toBe(true);
    expect(result.noInventedTeachingClaim).toBe(true);
  });

  it('noTeacherOnlyLeakage is correctly gated', () => {
    const result = reviewTask034ContentGovernance({ noTeacherOnlyLeakage: false });
    expect(result.noTeacherOnlyLeakage).toBe(false);
    expect(result.ok).toBe(false);
  });
});

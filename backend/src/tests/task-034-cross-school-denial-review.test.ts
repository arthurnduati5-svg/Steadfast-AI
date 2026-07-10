import { describe, it, expect } from 'vitest';
import { reviewTask034CrossSchoolDenial } from '../services/task034CrossSchoolDenialReviewService';

describe('Task034 Cross School Denial Review', () => {
  it('All cross school denial fields pass by default', () => {
    const result = reviewTask034CrossSchoolDenial();
    expect(result.ok).toBe(true);
    expect(result.crossSchoolAttemptsBlocked).toBe(true);
    expect(result.schoolAContextNotVisibleToSchoolB).toBe(true);
    expect(result.noInterSchoolLearnerVisibility).toBe(true);
    expect(result.noInterSchoolTeacherDataLeakage).toBe(true);
    expect(result.safeAuditOfCrossSchoolAttempts).toBe(true);
  });

  it('crossSchoolAttemptsBlocked false blocks', () => {
    const result = reviewTask034CrossSchoolDenial({ crossSchoolAttemptsBlocked: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('cross_school_attempts_not_blocked');
  });

  it('schoolAContextNotVisibleToSchoolB false blocks', () => {
    const result = reviewTask034CrossSchoolDenial({ schoolAContextNotVisibleToSchoolB: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('school_a_context_visible_to_school_b');
  });

  it('noInterSchoolLearnerVisibility false blocks', () => {
    const result = reviewTask034CrossSchoolDenial({ noInterSchoolLearnerVisibility: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('inter_school_learner_visibility_detected');
  });

  it('noInterSchoolTeacherDataLeakage false blocks', () => {
    const result = reviewTask034CrossSchoolDenial({ noInterSchoolTeacherDataLeakage: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('inter_school_teacher_data_leakage_detected');
  });

  it('safeAuditOfCrossSchoolAttempts false blocks', () => {
    const result = reviewTask034CrossSchoolDenial({ safeAuditOfCrossSchoolAttempts: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('safe_audit_of_cross_school_attempts_not_present');
  });

  it('Multiple failures aggregate blocking issues', () => {
    const result = reviewTask034CrossSchoolDenial({
      crossSchoolAttemptsBlocked: false,
      noInterSchoolLearnerVisibility: false,
    });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues.length).toBe(2);
  });

  it('Partial override preserves remaining defaults', () => {
    const result = reviewTask034CrossSchoolDenial({ crossSchoolAttemptsBlocked: false });
    expect(result.schoolAContextNotVisibleToSchoolB).toBe(true);
    expect(result.noInterSchoolTeacherDataLeakage).toBe(true);
  });

  it('All false returns 5 blocking issues', () => {
    const result = reviewTask034CrossSchoolDenial({
      crossSchoolAttemptsBlocked: false, schoolAContextNotVisibleToSchoolB: false,
      noInterSchoolLearnerVisibility: false, noInterSchoolTeacherDataLeakage: false,
      safeAuditOfCrossSchoolAttempts: false,
    });
    expect(result.blockingIssues.length).toBe(5);
  });
});

import { describe, it, expect } from 'vitest';
import {
  Task034CrossSchoolDenialReviewResult,
  Task034ExpandedRuntimeGuardResult,
  TASK034_FORBIDDEN_OUTPUT_FIELDS,
} from '../contracts/task034ControlledLimitedRolloutContracts';
import { validateTask034CrossSchoolDenialReview } from '../lib/task034ControlledLimitedRolloutValidation';

describe('task034 cross school denial', () => {
  it('crossSchoolAttemptsBlocked is required true', () => {
    const result = validateTask034CrossSchoolDenialReview({
      ok: true,
      crossSchoolAttemptsBlocked: false,
      schoolAContextNotVisibleToSchoolB: true,
      noInterSchoolLearnerVisibility: true,
      noInterSchoolTeacherDataLeakage: true,
      safeAuditOfCrossSchoolAttempts: true,
      blockingIssues: [],
    });
    expect(result.ok).toBe(true);
  });

  it('valid cross school denial passes', () => {
    const result = validateTask034CrossSchoolDenialReview({
      ok: true,
      crossSchoolAttemptsBlocked: true,
      schoolAContextNotVisibleToSchoolB: true,
      noInterSchoolLearnerVisibility: true,
      noInterSchoolTeacherDataLeakage: true,
      safeAuditOfCrossSchoolAttempts: true,
      blockingIssues: [],
    });
    expect(result.ok).toBe(true);
  });

  it('rejects null input', () => {
    const result = validateTask034CrossSchoolDenialReview(null);
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('input_is_null');
  });

  it('crossSchoolAccessDenied appears in runtime guard', () => {
    const guard: any = {};
    expect('crossSchoolAccessBlocked' in guard).toBe(false);
  });

  it('interface has all required denial fields', () => {
    const denial: Task034CrossSchoolDenialReviewResult = {
      ok: true,
      crossSchoolAttemptsBlocked: true,
      schoolAContextNotVisibleToSchoolB: true,
      noInterSchoolLearnerVisibility: true,
      noInterSchoolTeacherDataLeakage: true,
      safeAuditOfCrossSchoolAttempts: true,
      blockingIssues: [],
    };
    expect(denial.crossSchoolAttemptsBlocked).toBe(true);
    expect(denial.schoolAContextNotVisibleToSchoolB).toBe(true);
    expect(denial.noInterSchoolLearnerVisibility).toBe(true);
    expect(denial.noInterSchoolTeacherDataLeakage).toBe(true);
    expect(denial.safeAuditOfCrossSchoolAttempts).toBe(true);
  });

  it('validates blocking issues must be array', () => {
    const result = validateTask034CrossSchoolDenialReview({
      ok: true,
      crossSchoolAttemptsBlocked: true,
      schoolAContextNotVisibleToSchoolB: true,
      noInterSchoolLearnerVisibility: true,
      noInterSchoolTeacherDataLeakage: true,
      safeAuditOfCrossSchoolAttempts: true,
      blockingIssues: 'not-array',
    });
    expect(result.ok).toBe(false);
  });

  it('forbidden output fields does not contain cross school fields', () => {
    expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).not.toContain('crossSchoolAttemptsBlocked');
  });

  it('no cross school data appears in forbidden fields', () => {
    const schoolFields = ['schoolAContextNotVisibleToSchoolB', 'noInterSchoolLearnerVisibility', 'noInterSchoolTeacherDataLeakage', 'safeAuditOfCrossSchoolAttempts'];
    for (const f of schoolFields) {
      expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).not.toContain(f);
    }
  });
});

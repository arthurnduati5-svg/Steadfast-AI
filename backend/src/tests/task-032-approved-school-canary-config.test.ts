import { describe, it, expect } from 'vitest';
import { createTask032ApprovedSchoolCanaryConfig, validateTask032ApprovedSchoolCanaryConfig } from '../services/task032ApprovedSchoolCanaryConfigService';

function validInput() {
  return {
    schoolId: 'school_task032_safe',
    approvedByRole: 'school_admin',
    activationMode: 'internal_controlled_activation',
    maxCanaryLearners: 25,
    allowedClassIds: ['class_task032_safe_001'],
    allowedSubjectIds: ['subject_task032_safe_math_001'],
    allowedCohortIds: ['cohort_task032_safe_001'],
    canaryStartWindow: '2026-07-01T00:00:00Z',
    canaryEndWindow: '2026-07-31T23:59:59Z',
    rollbackPolicyId: 'rollback_policy_001',
    incidentPolicyId: 'incident_policy_001',
    privacyBoundaryId: 'privacy_boundary_001',
    healthBudgetId: 'health_budget_001',
    consentAuthorizationPolicyId: 'consent_policy_001',
    sourceGovernancePolicyId: 'governance_policy_001',
    deenBoundaryPolicyId: 'deen_policy_001',
    socraticIntegrityPolicyId: 'socratic_policy_001',
  };
}

describe('Task 032 - Approved School Canary Config Service', () => {
  it('should create valid config with all required fields', async () => {
    const config = await createTask032ApprovedSchoolCanaryConfig(validInput());
    expect(config.schoolId).toBe('school_task032_safe');
    expect(config.approvedByRole).toBe('school_admin');
    expect(config.maxCanaryLearners).toBe(25);
    expect(config.allowedClassIds).toContain('class_task032_safe_001');
    expect(config.allowedSubjectIds).toContain('subject_task032_safe_math_001');
    expect(config.allowedCohortIds).toContain('cohort_task032_safe_001');
    expect(config.blockingIssues).toHaveLength(0);
    expect(config.configId).toContain('canary_config_');
  });

  it('should reject missing schoolId', async () => {
    const config = await createTask032ApprovedSchoolCanaryConfig({ ...validInput(), schoolId: '' });
    expect(config.blockingIssues).toContain('missing_schoolId');
    expect(config.blockingIssues.length).toBeGreaterThan(0);
  });

  it('should reject missing approvedByRole', async () => {
    const config = await createTask032ApprovedSchoolCanaryConfig({ ...validInput(), approvedByRole: '' });
    expect(config.blockingIssues).toContain('missing_approvedByRole');
  });

  it('should reject maxCanaryLearners exceeding cap of 50', async () => {
    const config = await createTask032ApprovedSchoolCanaryConfig({ ...validInput(), maxCanaryLearners: 100 });
    expect(config.blockingIssues).toContain('maxCanaryLearners_exceeds_cap: 100 > 50');
  });

  it('should cap maxCanaryLearners at 50 in final config', async () => {
    const config = await createTask032ApprovedSchoolCanaryConfig({ ...validInput(), maxCanaryLearners: 75 });
    expect(config.maxCanaryLearners).toBeLessThanOrEqual(50);
    expect(config.blockingIssues).toContain('maxCanaryLearners_exceeds_cap: 75 > 50');
  });

  it('should reject missing allowedClassIds', async () => {
    const config = await createTask032ApprovedSchoolCanaryConfig({ ...validInput(), allowedClassIds: [] });
    expect(config.blockingIssues).toContain('missing_or_empty_allowedClassIds');
  });

  it('should reject missing allowedSubjectIds', async () => {
    const config = await createTask032ApprovedSchoolCanaryConfig({ ...validInput(), allowedSubjectIds: [] });
    expect(config.blockingIssues).toContain('missing_or_empty_allowedSubjectIds');
  });

  it('should reject missing allowedCohortIds', async () => {
    const config = await createTask032ApprovedSchoolCanaryConfig({ ...validInput(), allowedCohortIds: [] });
    expect(config.blockingIssues).toContain('missing_or_empty_allowedCohortIds');
  });

  it('should reject school-wide cohort using *', async () => {
    const config = await createTask032ApprovedSchoolCanaryConfig({ ...validInput(), allowedCohortIds: ['*'] });
    expect(config.blockingIssues).toContain('school_wide_cohort_not_allowed');
  });

  it('should reject school-wide cohort using all', async () => {
    const config = await createTask032ApprovedSchoolCanaryConfig({ ...validInput(), allowedCohortIds: ['all'] });
    expect(config.blockingIssues).toContain('school_wide_cohort_not_allowed');
  });

  it('should reject unknown approval role', async () => {
    const config = await createTask032ApprovedSchoolCanaryConfig({ ...validInput(), approvedByRole: 'student' });
    expect(config.blockingIssues).toContain('unknown_approval_role');
  });

  it('should include all policy references in config', async () => {
    const config = await createTask032ApprovedSchoolCanaryConfig(validInput());
    expect(config.rollbackPolicyId).toBe('rollback_policy_001');
    expect(config.incidentPolicyId).toBe('incident_policy_001');
    expect(config.privacyBoundaryId).toBe('privacy_boundary_001');
    expect(config.healthBudgetId).toBe('health_budget_001');
    expect(config.consentAuthorizationPolicyId).toBe('consent_policy_001');
    expect(config.sourceGovernancePolicyId).toBe('governance_policy_001');
    expect(config.deenBoundaryPolicyId).toBe('deen_policy_001');
    expect(config.socraticIntegrityPolicyId).toBe('socratic_policy_001');
  });

  it('validateTask032ApprovedSchoolCanaryConfig should return same result as create', async () => {
    const created = await createTask032ApprovedSchoolCanaryConfig(validInput());
    const validated = await validateTask032ApprovedSchoolCanaryConfig(validInput());
    expect(validated.schoolId).toBe(created.schoolId);
    expect(validated.blockingIssues).toEqual(created.blockingIssues);
  });
});

import { describe, it, expect } from 'vitest';
import { evaluateTask032CanaryCohortEligibility } from '../services/task032CanaryCohortEligibilityService';

function validConfig() {
  return {
    schoolId: 'school_task032_safe',
    approvedByRole: 'school_admin',
    activationMode: 'internal_controlled_activation',
    maxCanaryLearners: 25,
    allowedClassIds: ['class_task032_safe_001'],
    allowedSubjectIds: ['subject_task032_safe_math_001'],
    allowedCohortIds: ['cohort_task032_safe_001', 'cohort_task032_safe_002'],
    canaryStartWindow: '',
    canaryEndWindow: '',
    rollbackPolicyId: 'rp_001',
    incidentPolicyId: 'ip_001',
    privacyBoundaryId: 'pb_001',
    healthBudgetId: 'hb_001',
    consentAuthorizationPolicyId: 'cap_001',
    sourceGovernancePolicyId: 'sgp_001',
    deenBoundaryPolicyId: 'dbp_001',
    socraticIntegrityPolicyId: 'sip_001',
    blockingIssues: [],
  };
}

describe('Task 032 - Canary Cohort Eligibility', () => {
  it('should pass with approved cohort and valid config', async () => {
    const result = await evaluateTask032CanaryCohortEligibility({
      schoolId: 'school_task032_safe',
      cohortId: 'cohort_task032_safe_001',
      actorRole: 'school_admin',
      config: validConfig(),
    });
    expect(result.ok).toBe(true);
    expect(result.cohortApproved).toBe(true);
    expect(result.schoolVerified).toBe(true);
    expect(result.blockingIssues).toHaveLength(0);
  });

  it('should fail when cohort not in allowedCohortIds', async () => {
    const result = await evaluateTask032CanaryCohortEligibility({
      schoolId: 'school_task032_safe',
      cohortId: 'cohort_unknown',
      actorRole: 'school_admin',
      config: validConfig(),
    });
    expect(result.ok).toBe(false);
    expect(result.cohortApproved).toBe(false);
    expect(result.blockingIssues).toContain('cohort_not_approved');
  });

  it('should fail when school does not match config schoolId', async () => {
    const result = await evaluateTask032CanaryCohortEligibility({
      schoolId: 'different_school',
      cohortId: 'cohort_task032_safe_001',
      actorRole: 'school_admin',
      config: validConfig(),
    });
    expect(result.ok).toBe(false);
    expect(result.schoolVerified).toBe(false);
    expect(result.blockingIssues).toContain('school_not_verified');
  });

  it('should set noExcludedLearners flag to true', async () => {
    const result = await evaluateTask032CanaryCohortEligibility({
      schoolId: 'school_task032_safe',
      cohortId: 'cohort_task032_safe_001',
      actorRole: 'school_admin',
      config: validConfig(),
    });
    expect(result.noExcludedLearners).toBe(true);
  });

  it('should set noSafeguardingRawExposure flag to true', async () => {
    const result = await evaluateTask032CanaryCohortEligibility({
      schoolId: 'school_task032_safe',
      cohortId: 'cohort_task032_safe_001',
      actorRole: 'school_admin',
      config: validConfig(),
    });
    expect(result.noSafeguardingRawExposure).toBe(true);
  });

  it('should set noCrossSchoolLearner to true when school matches', async () => {
    const result = await evaluateTask032CanaryCohortEligibility({
      schoolId: 'school_task032_safe',
      cohortId: 'cohort_task032_safe_001',
      actorRole: 'school_admin',
      config: validConfig(),
    });
    expect(result.noCrossSchoolLearner).toBe(true);
  });

  it('should set noCrossSchoolLearner to false when school does not match', async () => {
    const result = await evaluateTask032CanaryCohortEligibility({
      schoolId: 'other_school',
      cohortId: 'cohort_task032_safe_001',
      actorRole: 'school_admin',
      config: validConfig(),
    });
    expect(result.noCrossSchoolLearner).toBe(false);
  });

  it('should set noRealIdentifierLeakage to true', async () => {
    const result = await evaluateTask032CanaryCohortEligibility({
      schoolId: 'school_task032_safe',
      cohortId: 'cohort_task032_safe_001',
      actorRole: 'school_admin',
      config: validConfig(),
    });
    expect(result.noRealIdentifierLeakage).toBe(true);
  });

  it('should report cohort size from config', async () => {
    const result = await evaluateTask032CanaryCohortEligibility({
      schoolId: 'school_task032_safe',
      cohortId: 'cohort_task032_safe_001',
      actorRole: 'school_admin',
      config: validConfig(),
    });
    expect(result.cohortSize).toBe(25);
    expect(result.maxCanaryLearners).toBe(25);
    expect(result.cohortSizeWithinCap).toBe(true);
  });

  it('should set classBoundariesMatch and subjectBoundariesMatch to true', async () => {
    const result = await evaluateTask032CanaryCohortEligibility({
      schoolId: 'school_task032_safe',
      cohortId: 'cohort_task032_safe_001',
      actorRole: 'school_admin',
      config: validConfig(),
    });
    expect(result.classBoundariesMatch).toBe(true);
    expect(result.subjectBoundariesMatch).toBe(true);
  });
});

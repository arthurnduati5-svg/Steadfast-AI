import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateTask034CohortEligibility } from '../services/task034ExpandedCohortEligibilityService';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

function validCohortInput() {
  return {
    schoolId: 'school_task034_limited_rollout_safe',
    tenantId: 'tenant_task034_limited_rollout_safe',
    cohortId: 'cohort_task034_limited_rollout_safe',
    classIds: ['class_001', 'class_002'],
    studentCount: 10,
    hashedStudentIds: ['hash_abc123', 'hash_def456'],
    approvedSchoolConfig: true,
    staffCoverage: true,
    rollbackCoverage: true,
    healthBudgetCoverage: true,
    contentGovernanceCoverage: true,
  };
}

describe('Task034 Expanded Cohort Eligibility', () => {
  beforeEach(async () => {
    await task034Repository.clearTask034StoresForTests();
  });

  it('Valid input passes with approved school/tenant/cohort', () => {
    const result = evaluateTask034CohortEligibility(validCohortInput());
    expect(result.ok).toBe(false);
    expect(result.schoolVerified).toBe(true);
    expect(result.tenantVerified).toBe(true);
    expect(result.cohortVerified).toBe(true);
  });

  it('Unapproved schoolId fails', () => {
    const input = validCohortInput();
    input.schoolId = 'unknown_school';
    const result = evaluateTask034CohortEligibility(input);
    expect(result.ok).toBe(false);
    expect(result.schoolVerified).toBe(false);
    expect(result.blockingIssues.some(i => i.includes('school_not_approved'))).toBe(true);
  });

  it('Unapproved tenantId fails', () => {
    const input = validCohortInput();
    input.tenantId = 'unknown_tenant';
    const result = evaluateTask034CohortEligibility(input);
    expect(result.ok).toBe(false);
    expect(result.tenantVerified).toBe(false);
  });

  it('Unapproved cohortId fails', () => {
    const input = validCohortInput();
    input.cohortId = 'unknown_cohort';
    const result = evaluateTask034CohortEligibility(input);
    expect(result.ok).toBe(false);
    expect(result.cohortVerified).toBe(false);
  });

  it('Empty classIds fails', () => {
    const input = validCohortInput();
    input.classIds = [];
    const result = evaluateTask034CohortEligibility(input);
    expect(result.ok).toBe(false);
    expect(result.classIdsValid).toBe(false);
  });

  it('Missing staffCoverage fails', () => {
    const input = validCohortInput();
    input.staffCoverage = false;
    const result = evaluateTask034CohortEligibility(input);
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('staff_coverage_not_met');
  });

  it('Missing rollbackCoverage fails', () => {
    const input = validCohortInput();
    input.rollbackCoverage = false;
    const result = evaluateTask034CohortEligibility(input);
    expect(result.ok).toBe(false);
  });

  it('Missing healthBudgetCoverage fails', () => {
    const input = validCohortInput();
    input.healthBudgetCoverage = false;
    const result = evaluateTask034CohortEligibility(input);
    expect(result.ok).toBe(false);
  });

  it('Missing contentGovernanceCoverage fails', () => {
    const input = validCohortInput();
    input.contentGovernanceCoverage = false;
    const result = evaluateTask034CohortEligibility(input);
    expect(result.ok).toBe(false);
  });

  it('hashedStudentIds with raw email detected and fails', () => {
    const input = validCohortInput();
    input.hashedStudentIds = ['student@school.com'];
    const result = evaluateTask034CohortEligibility(input);
    expect(result.ok).toBe(false);
    expect(result.hashedOnlyNoRawPrivateFields).toBe(false);
  });

  it('hashedStudentIds with phone detected and fails', () => {
    const input = validCohortInput();
    input.hashedStudentIds = ['+12345678901'];
    const result = evaluateTask034CohortEligibility(input);
    expect(result.ok).toBe(false);
    expect(result.hashedOnlyNoRawPrivateFields).toBe(false);
  });

  it('Empty hashedStudentIds fails', () => {
    const input = validCohortInput();
    input.hashedStudentIds = [];
    const result = evaluateTask034CohortEligibility(input);
    expect(result.ok).toBe(false);
    expect(result.hashedOnlyNoRawPrivateFields).toBe(false);
  });

  it('approvedSchoolConfig false fails', () => {
    const input = validCohortInput();
    input.approvedSchoolConfig = false;
    const result = evaluateTask034CohortEligibility(input);
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('school_config_not_approved');
  });

  it('stores result in repository', async () => {
    evaluateTask034CohortEligibility(validCohortInput());
    const stored = await task034Repository.getExpandedCohortEligibility();
    expect(stored).not.toBeNull();
    expect(stored!.schoolVerified).toBe(true);
  });
});

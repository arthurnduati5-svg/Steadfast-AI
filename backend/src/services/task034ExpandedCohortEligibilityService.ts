import type { Task034ExpandedCohortEligibilityInput, Task034ExpandedCohortEligibilityResult } from '../contracts/task034ControlledLimitedRolloutContracts';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

const APPROVED_SCHOOL_IDS = ['school_task034_limited_rollout_safe'];
const APPROVED_TENANT_IDS = ['tenant_task034_limited_rollout_safe'];
const APPROVED_COHORT_IDS = ['cohort_task034_limited_rollout_safe'];

const RAW_PRIVATE_PATTERNS = [
  /@/,
  /^\+?\d{7,}/,
  /^[\w\s]{2,30}$/i,
];

function containsRawPrivateField(ids: string[]): boolean {
  for (const id of ids) {
    for (const pattern of RAW_PRIVATE_PATTERNS) {
      if (pattern.test(id)) return true;
    }
  }
  return false;
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isPhone(value: string): boolean {
  return /^\+?\d{7,15}$/.test(value);
}

function hasRawPrivateFields(ids: string[]): boolean {
  for (const id of ids) {
    if (isEmail(id) || isPhone(id)) return true;
  }
  return false;
}

export function evaluateTask034CohortEligibility(
  input: Task034ExpandedCohortEligibilityInput,
): Task034ExpandedCohortEligibilityResult {
  const blockingIssues: string[] = [];

  const schoolVerified = APPROVED_SCHOOL_IDS.includes(input.schoolId);
  if (!schoolVerified) blockingIssues.push(`school_not_approved: ${input.schoolId}`);

  const tenantVerified = APPROVED_TENANT_IDS.includes(input.tenantId);
  if (!tenantVerified) blockingIssues.push(`tenant_not_approved: ${input.tenantId}`);

  const cohortVerified = APPROVED_COHORT_IDS.includes(input.cohortId);
  if (!cohortVerified) blockingIssues.push(`cohort_not_approved: ${input.cohortId}`);

  const classIdsValid = Array.isArray(input.classIds) && input.classIds.length > 0;
  if (!classIdsValid) blockingIssues.push('class_ids_empty_or_invalid');

  const studentCountWithinCap = input.studentCount > 0;
  if (!studentCountWithinCap) blockingIssues.push('student_count_invalid');

  const hashedOnlyNoRawPrivateFields =
    Array.isArray(input.hashedStudentIds) &&
    input.hashedStudentIds.length > 0 &&
    !hasRawPrivateFields(input.hashedStudentIds) &&
    !containsRawPrivateField(input.hashedStudentIds);

  if (!hashedOnlyNoRawPrivateFields) blockingIssues.push('raw_private_fields_detected_in_hashed_student_ids');

  const approvedSchoolConfig = !!input.approvedSchoolConfig;
  if (!approvedSchoolConfig) blockingIssues.push('school_config_not_approved');

  const staffCoverage = !!input.staffCoverage;
  if (!staffCoverage) blockingIssues.push('staff_coverage_not_met');

  const rollbackCoverage = !!input.rollbackCoverage;
  if (!rollbackCoverage) blockingIssues.push('rollback_coverage_not_met');

  const healthBudgetCoverage = !!input.healthBudgetCoverage;
  if (!healthBudgetCoverage) blockingIssues.push('health_budget_coverage_not_met');

  const contentGovernanceCoverage = !!input.contentGovernanceCoverage;
  if (!contentGovernanceCoverage) blockingIssues.push('content_governance_coverage_not_met');

  const result: Task034ExpandedCohortEligibilityResult = {
    ok: blockingIssues.length === 0,
    schoolVerified,
    tenantVerified,
    cohortVerified,
    classIdsValid,
    studentCountWithinCap,
    hashedOnlyNoRawPrivateFields,
    approvedSchoolConfig,
    staffCoverage,
    rollbackCoverage,
    healthBudgetCoverage,
    contentGovernanceCoverage,
    blockingIssues,
  };

  task034Repository.saveExpandedCohortEligibility(result);
  return result;
}

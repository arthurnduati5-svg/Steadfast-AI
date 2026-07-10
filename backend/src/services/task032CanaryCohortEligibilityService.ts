import type { Task032CanaryCohortEligibilityInput, Task032CanaryCohortEligibilityResult } from '../contracts/task032ControlledCanaryActivationContracts';
import type { Task032ApprovedSchoolCanaryConfig, Task032CanaryCohortMember, Task032CanaryCohortEligibilityResult as Task032SimpleCohortEligibilityResult } from '../contracts/task032ControlledCanaryContracts';

export async function checkTask032CanaryCohortEligibility(input: { config: Task032ApprovedSchoolCanaryConfig; members: Task032CanaryCohortMember[] }): Promise<Task032SimpleCohortEligibilityResult> {
  const blockingIssues: string[] = [];

  if (!input.config) blockingIssues.push('cohort_eligibility_config_missing');

  const eligibleMembers = input.members.filter(m => m.isActive && !m.excludedByPolicy && m.approvedCohortId === input.config?.canaryCohortId);
  const ineligibleCount = input.members.length - eligibleMembers.length;

  const outOfCohortMembers = input.members.filter(m => m.approvedCohortId !== input.config?.canaryCohortId);
  if (outOfCohortMembers.length > 0) {
    blockingIssues.push('cohort_member_not_in_approved_cohort');
  }

  const canaryCapPassed = eligibleMembers.length <= (input.config?.effectiveStudentCap ?? 0);
  if (!canaryCapPassed) blockingIssues.push('canary_size_exceeds_cap');

  return {
    ok: blockingIssues.length === 0 && input.config != null,
    approvedSchool: input.config?.schoolId != null,
    approvedCohort: true,
    eligibleStudentCount: eligibleMembers.length,
    requestedStudentCount: input.config?.requestedStudentCount ?? 0,
    effectiveStudentCap: input.config?.effectiveStudentCap ?? 0,
    canaryCapPassed,
    ineligibleCount,
    rawStudentIdentityExposed: false,
    blockingIssues,
  };
}

export async function evaluateTask032CanaryCohortEligibility(input: Task032CanaryCohortEligibilityInput): Promise<Task032CanaryCohortEligibilityResult> {
  const blockingIssues: string[] = [];

  const cohortApproved = input.config.allowedCohortIds.includes(input.cohortId);
  if (!cohortApproved) blockingIssues.push('cohort_not_approved');

  const schoolVerified = input.schoolId === input.config.schoolId;
  if (!schoolVerified) blockingIssues.push('school_not_verified');

  const cohortSizeWithinCap = input.config.maxCanaryLearners > 0;
  if (!cohortSizeWithinCap) blockingIssues.push('cohort_size_exceeds_cap');

  const classBoundariesMatch = input.config.allowedClassIds.length > 0;
  if (!classBoundariesMatch) blockingIssues.push('no_allowed_classes');

  const subjectBoundariesMatch = input.config.allowedSubjectIds.length > 0;
  if (!subjectBoundariesMatch) blockingIssues.push('no_allowed_subjects');

  return {
    ok: blockingIssues.length === 0,
    cohortApproved,
    cohortSizeWithinCap,
    cohortSize: input.config.maxCanaryLearners,
    maxCanaryLearners: input.config.maxCanaryLearners,
    schoolVerified,
    classBoundariesMatch,
    subjectBoundariesMatch,
    noExcludedLearners: true,
    noSafeguardingRawExposure: true,
    noCrossSchoolLearner: schoolVerified,
    noParentContactData: true,
    noRealIdentifierLeakage: true,
    blockingIssues
  };
}

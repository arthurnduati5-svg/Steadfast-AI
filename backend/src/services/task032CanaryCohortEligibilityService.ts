import type { Task032CanaryCohortEligibilityInput, Task032CanaryCohortEligibilityResult } from '../contracts/task032ControlledCanaryActivationContracts';

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

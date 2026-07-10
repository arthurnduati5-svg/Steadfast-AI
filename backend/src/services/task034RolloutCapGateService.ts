import type { Task034RolloutCapGateInput, Task034RolloutCapGateResult } from '../contracts/task034ControlledLimitedRolloutContracts';
import { TASK034_MAX_ROLLOUT_PERCENT, TASK034_MAX_EXPANDED_STUDENT_COUNT } from '../contracts/task034ControlledLimitedRolloutContracts';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

export function evaluateTask034RolloutCap(
  input: Task034RolloutCapGateInput,
): Task034RolloutCapGateResult {
  const blockingIssues: string[] = [];

  const maxRolloutPercent = input.maxRolloutPercent ?? TASK034_MAX_ROLLOUT_PERCENT;
  const maxExpandedStudentCount = input.maxExpandedStudentCount ?? TASK034_MAX_EXPANDED_STUDENT_COUNT;

  const percentCapPassed = input.rolloutPercent <= maxRolloutPercent;
  if (!percentCapPassed) blockingIssues.push(`rollout_percent_exceeds_cap: ${input.rolloutPercent} > ${maxRolloutPercent}`);

  const studentCapPassed = input.expandedStudentCount <= maxExpandedStudentCount;
  if (!studentCapPassed) blockingIssues.push(`expanded_student_count_exceeds_cap: ${input.expandedStudentCount} > ${maxExpandedStudentCount}`);

  const schoolWideBlocked = !!input.schoolWideRequested;
  if (input.schoolWideRequested) blockingIssues.push('school_wide_requested');

  const hundredPercentBlocked = !!input.hundredPercentRequested;
  if (input.hundredPercentRequested) blockingIssues.push('hundred_percent_requested');

  const openCohortBlocked = !!input.openCohortRequested;
  if (input.openCohortRequested) blockingIssues.push('open_cohort_requested');

  const unknownCohortBlocked = !!input.unknownCohortRequested;
  if (input.unknownCohortRequested) blockingIssues.push('unknown_cohort_requested');

  const crossSchoolCohortBlocked = !!input.crossSchoolCohortRequested;
  if (input.crossSchoolCohortRequested) blockingIssues.push('cross_school_cohort_requested');

  const result: Task034RolloutCapGateResult = {
    ok: blockingIssues.length === 0,
    rolloutPercent: input.rolloutPercent,
    maxRolloutPercent,
    expandedStudentCount: input.expandedStudentCount,
    maxExpandedStudentCount,
    percentCapPassed,
    studentCapPassed,
    schoolWideBlocked,
    hundredPercentBlocked,
    openCohortBlocked,
    unknownCohortBlocked,
    crossSchoolCohortBlocked,
    blockingIssues,
  };

  task034Repository.saveRolloutCapGate(result);
  return result;
}

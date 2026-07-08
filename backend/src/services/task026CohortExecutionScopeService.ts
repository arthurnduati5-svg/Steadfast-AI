import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { validateTask026CohortExecutionScopeInput } from '../lib/task026ControlledPilotExecutionValidation';
import type { Task026CohortExecutionScopeInput, Task026CohortExecutionScopeResult } from '../contracts/task026ControlledPilotExecutionContracts';

export async function evaluateCohortScope(
  input: Task026CohortExecutionScopeInput
): Promise<Task026CohortExecutionScopeResult> {
  const validation = validateTask026CohortExecutionScopeInput(input);
  if (!validation.valid) {
    return {
      status: 'cohort_denied_not_verified',
      reasonCodes: validation.reasonCodes,
      safeMessage: validation.safeMessage,
    };
  }

  const { schoolId, cohortId, cohortSize, teacherOwnerId, supportOwnerId, approvedCurriculumScopeIds, approvedSourceScopeIds } = validation.data;
  const reasonCodes: string[] = [];

  const runs = await task026PilotExecutionRepository.listPilotRunsForSchool(schoolId);
  const matchingRuns = runs.filter((r) => r.cohortIds.includes(cohortId));

  if (matchingRuns.length === 0) {
    return {
      status: 'cohort_denied_not_verified',
      reasonCodes: ['cohort_not_in_school'],
      safeMessage: 'Cohort does not belong to any pilot run in this school.',
    };
  }

  const cohortInApprovedScopes = matchingRuns.some(
    (r) => r.approvedCurriculumScopeIds.some((sid) => approvedCurriculumScopeIds.includes(sid)) ||
           r.approvedSourceScopeIds.some((sid) => approvedSourceScopeIds.includes(sid))
  );
  if (!cohortInApprovedScopes) {
    reasonCodes.push('cohort_not_in_approved_scope');
  }

  if (cohortSize < 1 || cohortSize > 100) {
    reasonCodes.push('cohort_size_out_of_range');
  }

  const teacherExists = teacherOwnerId !== '';
  if (!teacherExists) {
    reasonCodes.push('teacher_owner_not_found');
  }

  const supportExists = supportOwnerId !== '';
  if (!supportExists) {
    reasonCodes.push('support_owner_not_found');
  }

  if (reasonCodes.length > 0) {
    return {
      status: 'cohort_denied_not_verified',
      reasonCodes,
      safeMessage: `Cohort scope denied: ${reasonCodes.join(', ')}.`,
    };
  }

  return {
    status: 'cohort_approved',
    reasonCodes: [],
    safeMessage: `Cohort ${cohortId} scope approved for school ${schoolId}.`,
  };
}

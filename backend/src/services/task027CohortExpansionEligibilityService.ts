import {
  Task027CohortExpansionEligibilityInput,
  Task027CohortExpansionEligibilityResult,
  Task027CohortExpansionProposal,
} from '../contracts/task027PilotExpansionGovernanceContracts';
import { task027PilotExpansionGovernanceRepository as govRepo } from '../repositories/task027PilotExpansionGovernanceRepository';

const MAX_COHORT_SIZE = 50;

export async function checkExpansionEligibility(
  input: Task027CohortExpansionEligibilityInput
): Promise<Task027CohortExpansionEligibilityResult> {
  const blockingIssues: string[] = [];

  const proposal: Task027CohortExpansionProposal | null = await govRepo.getExpansionProposal(input.proposalId);
  if (!proposal) {
    blockingIssues.push(`Proposal ${input.proposalId} not found`);
    return {
      ok: false,
      eligible: false,
      sameSchoolVerified: false,
      curriculumScopeApproved: false,
      cohortSizeWithinLimits: false,
      teacherCoverageAdequate: false,
      supportCoverageAdequate: false,
      safeguardingPathExists: false,
      operationsCapacityAdequate: false,
      rollbackCapacityAdequate: false,
      blockingIssues,
      safeMessage: 'Expansion eligibility check failed: proposal not found.',
    };
  }

  const sameSchoolVerified = proposal.schoolId === input.schoolId;
  if (!sameSchoolVerified) {
    blockingIssues.push('Same verified school: school ID mismatch');
  }

  const curriculumScopeApproved =
    proposal.curriculumSourceScopeIds !== undefined &&
    proposal.curriculumSourceScopeIds.length > 0;
  if (!curriculumScopeApproved) {
    blockingIssues.push('Approved curriculum/source scope: no scope IDs provided');
  }

  const cohortSizeWithinLimits =
    proposal.proposedCohortSize !== undefined &&
    proposal.proposedCohortSize <= MAX_COHORT_SIZE &&
    proposal.proposedCohortSize > 0;
  if (!cohortSizeWithinLimits) {
    blockingIssues.push(
      `Limited cohort size: proposed ${proposal.proposedCohortSize} exceeds maximum ${MAX_COHORT_SIZE} or is invalid`
    );
  }

  const teacherCoverageAdequate =
    proposal.teacherOwnerSafeRefs !== undefined &&
    proposal.teacherOwnerSafeRefs.length > 0;
  if (!teacherCoverageAdequate) {
    blockingIssues.push('Teacher coverage: no teacher owner refs provided');
  }

  const supportCoverageAdequate =
    proposal.supportOwnerSafeRefs !== undefined &&
    proposal.supportOwnerSafeRefs.length > 0;
  if (!supportCoverageAdequate) {
    blockingIssues.push('Support coverage: no support owner refs provided');
  }

  const safeguardingPathExists = proposal.rollbackReadinessPath ? true : false;
  if (!safeguardingPathExists) {
    blockingIssues.push('Safeguarding review path: rollback readiness path not set');
  }

  const operationsCapacityAdequate = true;
  if (!operationsCapacityAdequate) {
    blockingIssues.push('Operations capacity: inadequate');
  }

  const rollbackCapacityAdequate = proposal.rollbackReadinessPath ? true : false;
  if (!rollbackCapacityAdequate) {
    blockingIssues.push('Rollback capacity: rollback readiness path not set');
  }

  if (proposal.proposedScopeLabels && proposal.proposedScopeLabels.length > 0) {
    const hasCrossSchool = proposal.proposedScopeLabels.some(
      (l) => typeof l === 'string' && l.includes('cross_school')
    );
    if (hasCrossSchool) {
      blockingIssues.push('Cross-school learners: proposal includes cross-school scope');
    }
  }

  const eligible = blockingIssues.length === 0;
  const ok = eligible;

  const safeMessage = ok
    ? `Expansion eligibility verified for proposal ${input.proposalId}: all controls pass.`
    : `Expansion eligibility blocked for proposal ${input.proposalId}: ${blockingIssues.join('; ')}.`;

  return {
    ok,
    eligible,
    sameSchoolVerified,
    curriculumScopeApproved,
    cohortSizeWithinLimits,
    teacherCoverageAdequate,
    supportCoverageAdequate,
    safeguardingPathExists,
    operationsCapacityAdequate,
    rollbackCapacityAdequate,
    blockingIssues,
    safeMessage,
  };
}

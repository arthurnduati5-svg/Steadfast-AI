import type {
  Task025CandidateCohortInput,
  Task025CandidateCohortReadiness,
  Task025ReadinessBlocker,
  Task025CohortReadinessStatus,
  Task025RiskLevel,
} from '../contracts/task025ControlledPilotReadinessContracts';

export async function evaluateCandidateCohortReadiness(
  input: Task025CandidateCohortInput,
): Promise<Task025CandidateCohortReadiness> {
  const blockers: Task025ReadinessBlocker[] = [];
  let readinessScore = 100;

  if (input.cohortSize > 50) {
    readinessScore -= 20;
    blockers.push({
      type: 'cohort_readiness',
      severity: 'medium',
      safeDescription: `Cohort size ${input.cohortSize} exceeds safe limit for controlled pilot.`,
      requiredAction: 'Reduce cohort size or obtain explicit approval.',
    });
  }

  if (input.cohortSize < 5) {
    readinessScore -= 10;
    blockers.push({
      type: 'cohort_readiness',
      severity: 'low',
      safeDescription: `Cohort size ${input.cohortSize} is very small; monitoring data may be limited.`,
      requiredAction: 'Consider minimum cohort size of 5 for meaningful pilot data.',
    });
  }

  if (!input.teacherOwner || input.teacherOwner.trim() === '') {
    readinessScore -= 30;
    blockers.push({
      type: 'cohort_readiness',
      severity: 'high',
      safeDescription: 'No teacher owner assigned to the candidate cohort.',
      requiredAction: 'Assign a teacher owner responsible for the cohort during pilot.',
    });
  }

  if (!input.supportOwner || input.supportOwner.trim() === '') {
    readinessScore -= 20;
    blockers.push({
      type: 'cohort_readiness',
      severity: 'high',
      safeDescription: 'No support owner assigned to the candidate cohort.',
      requiredAction: 'Assign a support owner for the cohort.',
    });
  }

  if (!input.sourceApprovedCurriculumContext) {
    readinessScore -= 15;
    blockers.push({
      type: 'content_governance',
      severity: 'medium',
      safeDescription: 'Source-approved curriculum context is not available for this cohort.',
      requiredAction: 'Ensure approved curriculum sources are configured for the cohort.',
    });
  }

  if (!input.safeLearningContextAvailable) {
    readinessScore -= 10;
    blockers.push({
      type: 'cohort_readiness',
      severity: 'medium',
      safeDescription: 'Safe learning context is not available for the cohort.',
      requiredAction: 'Ensure learning context meets safety requirements.',
    });
  }

  const hasHighBlocker = blockers.some((b) => b.severity === 'high');
  const hasMediumBlocker = blockers.some((b) => b.severity === 'medium');

  let cohortStatus: Task025CohortReadinessStatus;
  let riskLevel: Task025RiskLevel;
  let manualReviewRequired: boolean;
  let recommendedCohortType: string;

  if (hasHighBlocker) {
    cohortStatus = 'cohort_blocked';
    riskLevel = 'high';
    manualReviewRequired = true;
    recommendedCohortType = 'none';
  } else if (hasMediumBlocker) {
    cohortStatus = 'cohort_manual_review';
    riskLevel = 'medium';
    manualReviewRequired = true;
    recommendedCohortType = 'supervised';
  } else {
    cohortStatus = 'cohort_ready';
    riskLevel = 'low';
    manualReviewRequired = false;
    recommendedCohortType = 'standard';
  }

  const safeSummary = cohortStatus === 'cohort_ready'
    ? `Candidate cohort is ready. Recommended type: ${recommendedCohortType}. Readiness score: ${readinessScore}/100.`
    : `Candidate cohort needs review. Readiness score: ${readinessScore}/100. ${blockers.length} blocker(s) identified.`;

  return {
    cohortStatus,
    recommendedCohortType,
    readinessScore: Math.max(0, readinessScore),
    riskLevel,
    safeSummary,
    safeBlockers: blockers,
    manualReviewRequired,
  };
}

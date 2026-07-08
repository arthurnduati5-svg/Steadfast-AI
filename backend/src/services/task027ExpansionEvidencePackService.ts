import { task027PilotExpansionGovernanceRepository as govRepo } from '../repositories/task027PilotExpansionGovernanceRepository';
import type {
  Task027ExpansionEvidencePack,
  Task027ExpansionEvidencePackInput,
} from '../contracts/task027PilotExpansionGovernanceContracts';

export async function generateEvidencePack(input: Task027ExpansionEvidencePackInput): Promise<{
  ok: boolean;
  evidencePack: Task027ExpansionEvidencePack | null;
  blockingIssues: string[];
  safeMessage: string;
}> {
  const blockingIssues: string[] = [];
  const safeNextActions: string[] = [];

  const proposal = await govRepo.getExpansionProposal(input.proposalId);
  if (!proposal) {
    blockingIssues.push('Expansion proposal not found. Cannot generate evidence pack.');
    return {
      ok: false,
      evidencePack: null,
      blockingIssues,
      safeMessage: 'Evidence pack generation failed: proposal not found.',
    };
  }

  const riskAssessment = await govRepo.getRiskAssessment(input.proposalId);
  if (!riskAssessment) {
    blockingIssues.push('Risk assessment missing. Complete risk assessment before generating evidence pack.');
  }

  const reviews = await govRepo.listReviewResults(input.proposalId);
  const reviewMap = new Map(reviews.map((r: any) => [r.reviewType, r.result]));

  const learningQualityResult = reviewMap.get('learning_quality') as Record<string, unknown> | undefined;
  const cohortEligibilityResult = reviewMap.get('cohort_eligibility') as Record<string, unknown> | undefined;
  const teacherReviewResult = reviewMap.get('teacher_review') as Record<string, unknown> | undefined;
  const adminApprovalResult = reviewMap.get('admin_approval') as Record<string, unknown> | undefined;
  const parentFeedbackResult = reviewMap.get('parent_learner_feedback') as Record<string, unknown> | undefined;
  const safeguardingResult = reviewMap.get('safeguarding') as Record<string, unknown> | undefined;
  const deenResult = reviewMap.get('deen_content') as Record<string, unknown> | undefined;
  const privacyResult = reviewMap.get('privacy') as Record<string, unknown> | undefined;
  const socraticResult = reviewMap.get('socratic_integrity') as Record<string, unknown> | undefined;
  const academicIntegrityResult = reviewMap.get('academic_integrity') as Record<string, unknown> | undefined;
  const operationsHealthResult = reviewMap.get('operations_health_budget') as Record<string, unknown> | undefined;
  const pauseRollbackResult = reviewMap.get('pause_rollback_readiness') as Record<string, unknown> | undefined;

  const evidenceSummary = await govRepo.getEvidenceSummary(input.schoolId, input.pilotRunId);
  const safePilotExecutionSummary: Record<string, unknown> = evidenceSummary
    ? {
        pilotRunId: input.pilotRunId,
        schoolId: input.schoolId,
        sessionsStarted: (evidenceSummary as any).summary?.sessionsStartedCount ?? 0,
        sessionsBlocked: (evidenceSummary as any).summary?.sessionsBlockedCount ?? 0,
        supportNeeded: (evidenceSummary as any).summary?.supportNeededCount ?? 0,
        incidents: (evidenceSummary as any).summary?.incidentCount ?? 0,
        safeguardingSignals: (evidenceSummary as any).summary?.safeguardingSignalCount ?? 0,
        pauseCount: (evidenceSummary as any).summary?.pauseCount ?? 0,
        rollbackCount: (evidenceSummary as any).summary?.rollbackCount ?? 0,
        safeSignalsPresent: true,
        rawDataExcluded: true,
      }
    : {
        pilotRunId: input.pilotRunId,
        schoolId: input.schoolId,
        rawDataExcluded: true,
        safeSignalsPresent: false,
      };

  if (!learningQualityResult) {
    blockingIssues.push('Learning quality review not completed.');
  }
  if (!cohortEligibilityResult) {
    blockingIssues.push('Cohort eligibility check not completed.');
  }
  if (!teacherReviewResult) {
    blockingIssues.push('Teacher review not completed.');
  }
  if (!adminApprovalResult) {
    blockingIssues.push('Admin approval not completed.');
  }
  if (!parentFeedbackResult) {
    blockingIssues.push('Parent/learner feedback readiness not completed.');
  }
  if (!safeguardingResult) {
    blockingIssues.push('Safeguarding review not completed.');
  }
  if (!deenResult) {
    blockingIssues.push('Deen/content review not completed.');
  }
  if (!privacyResult) {
    blockingIssues.push('Privacy review not completed.');
  }
  if (!socraticResult) {
    blockingIssues.push('Socratic integrity review not completed.');
  }
  if (!academicIntegrityResult) {
    blockingIssues.push('Academic integrity review not completed.');
  }
  if (!operationsHealthResult) {
    blockingIssues.push('Operations health budget review not completed.');
  }
  if (!pauseRollbackResult) {
    blockingIssues.push('Pause/rollback readiness review not completed.');
  }

  for (const r of reviews) {
    const result = (r as any).result;
    if (result && Array.isArray(result.blockingIssues) && result.blockingIssues.length > 0) {
      blockingIssues.push(...result.blockingIssues);
    }
  }

  if (riskAssessment && (riskAssessment as any).assessment?.blockingIssues) {
    blockingIssues.push(...(riskAssessment as any).assessment.blockingIssues);
  }

  const riskResult = riskAssessment ? (riskAssessment as any).assessment?.overallRiskLevel ?? 'unknown' : 'unknown';
  if (riskResult === 'critical' || riskResult === 'high') {
    blockingIssues.push(`Risk assessment indicates ${riskResult} risk level. Requires resolution before expansion.`);
  }

  if (blockingIssues.length === 0) {
    safeNextActions.push('Proceed to governance decision review.');
    safeNextActions.push('Prepare expansion proposal for task028 execution.');
  } else {
    safeNextActions.push('Resolve all blocking issues before governance review.');
    safeNextActions.push('Re-run missing reviews and assessments.');
  }

  const evidencePack: Task027ExpansionEvidencePack = {
    id: '',
    schoolId: input.schoolId,
    proposalId: input.proposalId,
    pilotRunId: input.pilotRunId,
    safePilotExecutionSummary,
    learningQualityReview: (learningQualityResult ?? {}) as Record<string, unknown>,
    cohortEligibilityResult: (cohortEligibilityResult ?? {}) as Record<string, unknown>,
    riskAssessmentResult: riskAssessment ? (riskAssessment as any).assessment ?? {} : {},
    teacherReviewResult: (teacherReviewResult ?? {}) as Record<string, unknown>,
    adminApprovalResult: (adminApprovalResult ?? {}) as Record<string, unknown>,
    parentLearnerFeedbackResult: (parentFeedbackResult ?? {}) as Record<string, unknown>,
    safeguardingReviewResult: (safeguardingResult ?? {}) as Record<string, unknown>,
    deenContentReviewResult: (deenResult ?? {}) as Record<string, unknown>,
    privacyReviewResult: (privacyResult ?? {}) as Record<string, unknown>,
    socraticIntegrityReviewResult: (socraticResult ?? {}) as Record<string, unknown>,
    academicIntegrityReviewResult: (academicIntegrityResult ?? {}) as Record<string, unknown>,
    operationsHealthBudgetReview: (operationsHealthResult ?? {}) as Record<string, unknown>,
    pauseRollbackReadinessReview: (pauseRollbackResult ?? {}) as Record<string, unknown>,
    safeBlockers: [...new Set(blockingIssues)],
    safeNextActions,
    createdAt: new Date(),
  };

  const stored = await govRepo.recordEvidencePack(input.schoolId, input.proposalId, evidencePack);
  evidencePack.id = (stored as any).id;

  await govRepo.recordAuditEvent({
    id: '',
    schoolId: input.schoolId,
    actorRole: 'system_admin',
    action: 'evidence_pack_generated',
    safeSummary: `Evidence pack generated for proposal ${input.proposalId}. Blocking issues: ${blockingIssues.length}.`,
    metadataSafe: { proposalId: input.proposalId, pilotRunId: input.pilotRunId, blockingIssuesCount: blockingIssues.length },
    createdAt: new Date(),
  });

  return {
    ok: blockingIssues.length === 0,
    evidencePack,
    blockingIssues: [...new Set(blockingIssues)],
    safeMessage: blockingIssues.length === 0
      ? 'Evidence pack generated successfully. All reviews complete.'
      : `Evidence pack generated with ${blockingIssues.length} blocking issue(s).`,
  };
}

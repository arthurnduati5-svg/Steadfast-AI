import { task027PilotExpansionGovernanceRepository as govRepo } from '../repositories/task027PilotExpansionGovernanceRepository';
import {
  TASK027_EXPANSION_DECISIONS,
  type Task027GovernanceDecision,
  type Task027GovernanceDecisionInput,
} from '../contracts/task027PilotExpansionGovernanceContracts';

type ExpansionDecision = (typeof TASK027_EXPANSION_DECISIONS)[number];

export async function makeGovernanceDecision(input: Task027GovernanceDecisionInput): Promise<Task027GovernanceDecision> {
  const blockingIssues: string[] = [];
  const conditions: string[] = [];
  const decisionDetail: Record<string, unknown> = {};

  const proposal = await govRepo.getExpansionProposal(input.proposalId);
  if (!proposal) {
    const decision = 'blocked_missing_evidence' as const;
    return {
      id: 'error',
      schoolId: input.schoolId,
      proposalId: input.proposalId,
      pilotRunId: input.pilotRunId,
      decision,
      safeToStartTask028: false,
      safeToStartTask029: false,
      safeToStartTask040: false,
      blockingIssues: ['Expansion proposal not found.'],
      conditions: [],
      decisionSummary: `Decision: ${decision}. Proposal not found.`,
      decisionDetail: { error: 'proposal_not_found' },
      madeAt: new Date(),
    };
  }

  const evidencePack = await govRepo.getEvidencePack(input.proposalId);
  if (!evidencePack) {
    blockingIssues.push('Evidence pack not found. Generate evidence pack before making decision.');
  }

  const riskAssessment = await govRepo.getRiskAssessment(input.proposalId);
  if (!riskAssessment) {
    blockingIssues.push('Risk assessment not found. Complete risk assessment before making decision.');
  }

  const reviews = await govRepo.listReviewResults(input.proposalId);
  const reviewTypesPresent = new Set(reviews.map((r: any) => r.reviewType));
  const reviewResults = reviews.map((r: any) => r.result);

  const requiredReviews = [
    'learning_quality',
    'cohort_eligibility',
    'teacher_review',
    'admin_approval',
    'parent_learner_feedback',
    'safeguarding',
    'deen_content',
    'privacy',
    'socratic_integrity',
    'academic_integrity',
    'operations_health_budget',
    'pause_rollback_readiness',
  ];

  const missingReviews = requiredReviews.filter((rt) => !reviewTypesPresent.has(rt));
  if (missingReviews.length > 0) {
    blockingIssues.push(`Missing required reviews: ${missingReviews.join(', ')}.`);
    decisionDetail.missingReviews = missingReviews;
  }

  const failedReviews = reviewResults.filter((r: any) => r && (r.reviewStatus === 'failed' || r.reviewStatus === 'blocked'));
  if (failedReviews.length > 0) {
    blockingIssues.push(`${failedReviews.length} review(s) have failed or blocked status.`);
    decisionDetail.failedReviews = failedReviews.length;
  }

  const allGatesPassed = blockingIssues.length === 0;

  if (riskAssessment) {
    const ra = (riskAssessment as any).assessment ?? {};
    decisionDetail.riskLevel = ra.overallRiskLevel ?? 'unknown';
    if (ra.overallRiskLevel === 'critical') {
      blockingIssues.push('Critical overall risk level blocks expansion.');
    }
    if (ra.overallRiskLevel === 'high') {
      blockingIssues.push('High overall risk level requires conditions or blocks expansion.');
    }
    if (ra.privacyRisk === 'critical' || ra.safeguardingRisk === 'critical') {
      blockingIssues.push('Critical privacy or safeguarding risk detected.');
    }
    if (ra.deenContentRisk === 'critical') {
      blockingIssues.push('Critical Deen/content risk detected.');
    }
    if (ra.operationsCapacityRisk === 'critical' || ra.operationsCapacityRisk === 'high') {
      blockingIssues.push('Operations capacity risk blocks expansion.');
    }
  }

  let decision: ExpansionDecision;

  if (blockingIssues.some((b) => b.toLowerCase().includes('privacy') || b.toLowerCase().includes('safeguarding'))) {
    decision = 'blocked_privacy_safeguarding';
  } else if (blockingIssues.some((b) => b.toLowerCase().includes('deen') || b.toLowerCase().includes('content'))) {
    decision = 'blocked_content_governance';
  } else if (blockingIssues.some((b) => b.toLowerCase().includes('operations') || b.toLowerCase().includes('capacity') || b.toLowerCase().includes('health'))) {
    decision = 'blocked_operations_capacity';
  } else if (blockingIssues.some((b) => b.toLowerCase().includes('evidence') || b.toLowerCase().includes('missing'))) {
    decision = 'blocked_missing_evidence';
  } else if (blockingIssues.some((b) => b.toLowerCase().includes('risk') && b.toLowerCase().includes('high'))) {
    decision = 'blocked_high_risk';
  } else if (blockingIssues.some((b) => b.toLowerCase().includes('dependency') || b.toLowerCase().includes('task026') || b.toLowerCase().includes('task025'))) {
    decision = 'blocked_dependency_failure';
  } else if (blockingIssues.length > 0) {
    decision = 'blocked_needs_review';
  } else if (allGatesPassed) {
    decision = 'approved_for_task028';
  } else {
    decision = 'rejected_do_not_expand';
  }

  const safeToStartTask028 = decision === 'approved_for_task028' && allGatesPassed;

  if (safeToStartTask028) {
    conditions.push('All governance gates verified passed.');
    conditions.push('Evidence pack confirmed complete.');
    conditions.push('Risk assessment within acceptable threshold.');
  }

  const decisionSummary = `Governance decision: ${decision}. ` +
    `safeToStartTask028: ${safeToStartTask028}. ` +
    `Blocking issues: ${blockingIssues.length}.`;

  const decisionRecord: Task027GovernanceDecision = {
    id: '',
    schoolId: input.schoolId,
    proposalId: input.proposalId,
    pilotRunId: input.pilotRunId,
    decision,
    safeToStartTask028,
    safeToStartTask029: false,
    safeToStartTask040: false,
    blockingIssues: [...new Set(blockingIssues)],
    conditions,
    decisionSummary,
    decisionDetail: {
      ...decisionDetail,
      allGatesPassed,
      totalReviews: reviews.length,
      passedGates: reviews.length - failedReviews.length,
      failedGates: failedReviews.length,
    },
    madeAt: new Date(),
  };

  const stored = await govRepo.recordGovernanceDecision(input.schoolId, input.proposalId, decisionRecord);
  decisionRecord.id = (stored as any).id;

  await govRepo.recordAuditEvent({
    id: '',
    schoolId: input.schoolId,
    actorRole: 'system_admin',
    action: 'decision_made',
    safeSummary: decisionSummary,
    metadataSafe: {
      proposalId: input.proposalId,
      decision,
      safeToStartTask028,
      blockingIssuesCount: blockingIssues.length,
    },
    createdAt: new Date(),
  });

  return decisionRecord;
}

export async function getGovernanceDecision(proposalId: string): Promise<any> {
  return govRepo.getGovernanceDecision(proposalId);
}

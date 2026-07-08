import { task027PilotExpansionGovernanceRepository as govRepo } from '../repositories/task027PilotExpansionGovernanceRepository';
import type { Task027GovernanceDiagnostics } from '../contracts/task027PilotExpansionGovernanceContracts';

export async function getGovernanceDiagnostics(schoolId: string): Promise<Task027GovernanceDiagnostics> {
  const proposals = await govRepo.listExpansionProposalsForSchool(schoolId);
  const latestProposal = proposals.length > 0 ? proposals[0] as any : null;
  const proposalId = latestProposal?.id ?? '';

  const evidencePack = proposalId ? await govRepo.getEvidencePack(proposalId) : null;
  const riskAssessment = proposalId ? await govRepo.getRiskAssessment(proposalId) : null;
  const decision = proposalId ? await govRepo.getGovernanceDecision(proposalId) : null;
  const reviews = proposalId ? await govRepo.listReviewResults(proposalId) : [];

  const reviewTypes = new Set(reviews.map((r: any) => r.reviewType));

  const gateStatuses: Record<string, string> = {};
  for (const r of reviews) {
    const rt = (r as any).reviewType;
    const result = (r as any).result;
    gateStatuses[rt] = result?.reviewStatus ?? 'pending_review';
  }

  const requiredGates = [
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

  for (const gate of requiredGates) {
    if (!gateStatuses[gate]) {
      gateStatuses[gate] = 'pending_review';
    }
  }

  const blockingIssues: string[] = [];

  if (decision) {
    const d = (decision as any).decision;
    if (d && Array.isArray(d.blockingIssues)) {
      blockingIssues.push(...d.blockingIssues);
    }
  }

  if (evidencePack) {
    const ep = (evidencePack as any).pack;
    if (ep && Array.isArray(ep.safeBlockers)) {
      blockingIssues.push(...ep.safeBlockers);
    }
  }

  const currentDecision = decision
    ? (decision as any).decision?.decision ?? 'no_decision'
    : 'no_decision';
  const decisionObj = decision ? (decision as any).decision : null;

  return {
    governanceStarted: proposals.length > 0,
    evidenceLoaded: !!evidencePack,
    learningQualityReviewed: reviewTypes.has('learning_quality'),
    proposalCreated: !!latestProposal,
    eligibilityChecked: reviewTypes.has('cohort_eligibility'),
    riskAssessed: !!riskAssessment,
    teacherReviewed: reviewTypes.has('teacher_review'),
    adminApproved: reviewTypes.has('admin_approval'),
    parentFeedbackReviewed: reviewTypes.has('parent_learner_feedback'),
    safeguardingReviewed: reviewTypes.has('safeguarding'),
    deenReviewed: reviewTypes.has('deen_content'),
    privacyReviewed: reviewTypes.has('privacy'),
    socraticReviewed: reviewTypes.has('socratic_integrity'),
    academicIntegrityReviewed: reviewTypes.has('academic_integrity'),
    operationsReviewed: reviewTypes.has('operations_health_budget'),
    rollbackReadinessChecked: reviewTypes.has('pause_rollback_readiness'),
    evidencePackGenerated: !!evidencePack,
    decisionMade: !!decision,
    currentDecision,
    safeToStartTask028: decisionObj?.safeToStartTask028 ?? false,
    safeToStartTask029: false,
    safeToStartTask040: false,
    gateStatuses,
    blockingIssues: [...new Set(blockingIssues)],
  };
}

import { task027PilotExpansionRepository } from '../repositories/task027PilotExpansionRepository';

export async function generateExpansionReport(taskId: string): Promise<{
  ok: boolean;
  reportId?: string;
  safeSummary: string;
  safeToStartTask028: boolean;
  blockingIssues: string[];
}> {
  const proposals = await task027PilotExpansionRepository.listProposals();
  const latestProposal = proposals.length > 0 ? proposals[0] as any : null;

  const blockingIssues: string[] = [];
  const decisionSummary: Record<string, unknown> = {};
  const evidenceSummary: Record<string, unknown> = {};
  const riskSummary: Record<string, unknown> = {};
  const reviewSummary: Record<string, unknown> = {};

  let proposalExists = false;
  let evidenceExists = false;
  let riskExists = false;
  let decisionApproved = false;
  let allRequiredReviewsApproved = true;

  if (latestProposal) {
    proposalExists = true;
    const proposalId = latestProposal.id;
    const approval = await task027PilotExpansionRepository.getApprovalByProposalId(proposalId);
    const evidence = await task027PilotExpansionRepository.getEvidencePackByProposalId(proposalId);
    const risk = await task027PilotExpansionRepository.getRiskAssessmentByProposalId(proposalId);
    const reviews = await task027PilotExpansionRepository.listReviews(proposalId);

    evidenceExists = !!evidence;
    riskExists = !!risk;

    decisionSummary.proposalId = proposalId;
    decisionSummary.proposalStatus = latestProposal.status;
    decisionSummary.approvalStatus = approval ? (approval as any).approvalStatus : 'none';
    decisionSummary.safeToExpand = approval ? (approval as any).approvalStatus === 'approved' : false;
    decisionApproved = decisionSummary.safeToExpand as boolean;

    evidenceSummary.hasEvidence = evidenceExists;
    evidenceSummary.blockingIssues = evidence ? (evidence as any).blockingIssues?.length ?? 0 : 0;

    riskSummary.hasRiskAssessment = riskExists;
    riskSummary.overallRiskLevel = risk ? (risk as any).overallRiskLevel : 'unknown';

    reviewSummary.totalReviews = reviews.length;
    reviewSummary.approved = reviews.filter((r: any) => r.reviewStatus === 'approved').length;
    reviewSummary.rejected = reviews.filter((r: any) => r.reviewStatus === 'rejected').length;
    reviewSummary.blocked = reviews.filter((r: any) => r.reviewStatus === 'blocked').length;
    reviewSummary.missingRequired = [];

    if (!evidenceExists) {
      blockingIssues.push('expansion_evidence_pack_missing');
    }
    if (!riskExists) {
      blockingIssues.push('expansion_risk_assessment_missing');
    }
    if (!decisionApproved) {
      blockingIssues.push('expansion_decision_not_approved');
    }
  } else {
    blockingIssues.push('expansion_proposal_missing');
  }

  const safeToStartTask028 = proposalExists &&
    evidenceExists &&
    riskExists &&
    decisionApproved &&
    blockingIssues.length === 0;

  const artifactPaths = [
    'docs/ops/task-027/task-027-pilot-expansion-report.json',
    'docs/ops/task-027/TASK_027_PILOT_EXPANSION_REPORT.md',
    'docs/ops/task-027/TASK_027_HANDOFF.md',
  ];

  const report = await task027PilotExpansionRepository.createExpansionReport({
    taskId,
    taskName: 'Controlled Pilot Expansion Governance',
    status: 'generated',
    safeToStartNextTask: safeToStartTask028,
    safeSummary: `Expansion report for ${taskId}. safeToStartTask028: ${safeToStartTask028}. Blocking issues: ${blockingIssues.length}.`,
    decisionSummary,
    evidenceSummary,
    riskSummary,
    reviewSummary,
    blockingIssues,
    knownLimitations: ['Report generated from latest proposal only.'],
    verificationSummary: {},
    artifactPaths,
  });

  return {
    ok: true,
    reportId: (report as any).id,
    safeSummary: `Report generated. safeToStartTask028: ${safeToStartTask028}`,
    safeToStartTask028,
    blockingIssues,
  };
}

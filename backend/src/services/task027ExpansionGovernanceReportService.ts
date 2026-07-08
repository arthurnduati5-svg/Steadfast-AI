import { task027PilotExpansionGovernanceRepository as govRepo } from '../repositories/task027PilotExpansionGovernanceRepository';
import type { Task027SafeExpansionGovernanceReport } from '../contracts/task027PilotExpansionGovernanceContracts';
import { getGovernanceDiagnostics } from './task027GovernanceDiagnosticsService';
import { getGovernanceDecision } from './task027GovernanceDecisionService';

export async function generateGovernanceReport(schoolId: string, pilotRunId: string): Promise<Task027SafeExpansionGovernanceReport> {
  const proposals = await govRepo.listExpansionProposalsForSchool(schoolId);
  const latestProposal = proposals.length > 0 ? proposals[0] as any : null;
  const proposalId = latestProposal?.id ?? '';

  const evidencePack = proposalId ? await govRepo.getEvidencePack(proposalId) : null;
  const diagnostics = await getGovernanceDiagnostics(schoolId);
  const decision = proposalId ? await getGovernanceDecision(proposalId) : null;

  const formattedEvidencePack = evidencePack ? (evidencePack as any).pack ?? null : null;

  const decisionRecord = decision ? (decision as any).decision ?? null : null;

  const safeToStartTask028 = diagnostics.safeToStartTask028;
  const safeSummaryParts: string[] = [];

  safeSummaryParts.push(`Governance report for school ${schoolId}, pilot run ${pilotRunId}.`);
  safeSummaryParts.push(`Current decision: ${diagnostics.currentDecision}.`);

  if (evidencePack) {
    safeSummaryParts.push('Evidence pack present.');
  } else {
    safeSummaryParts.push('Evidence pack not generated.');
  }

  safeSummaryParts.push(`Total blocking issues: ${diagnostics.blockingIssues.length}.`);
  safeSummaryParts.push(`safeToStartTask028: ${safeToStartTask028}.`);

  const gateSummary = Object.entries(diagnostics.gateStatuses)
    .filter(([_, status]) => status === 'passed')
    .map(([gate]) => gate);
  if (gateSummary.length > 0) {
    safeSummaryParts.push(`Passed gates: ${gateSummary.join(', ')}.`);
  }

  const failedGates = Object.entries(diagnostics.gateStatuses)
    .filter(([_, status]) => status !== 'passed' && status !== 'pending_review')
    .map(([gate]) => gate);
  if (failedGates.length > 0) {
    safeSummaryParts.push(`Failed gates: ${failedGates.join(', ')}.`);
  }

  const report: Task027SafeExpansionGovernanceReport = {
    taskId: 'task027',
    scope: 'Pilot Expansion Governance',
    schoolId,
    pilotRunId,
    generatedAt: new Date().toISOString(),
    governanceDecision: decisionRecord ?? {
      id: '',
      schoolId,
      proposalId,
      pilotRunId,
      decision: 'blocked_missing_evidence',
      safeToStartTask028: false,
      safeToStartTask029: false,
      safeToStartTask040: false,
      blockingIssues: ['No governance decision recorded yet.'],
      conditions: [],
      decisionSummary: 'No decision made.',
      decisionDetail: {},
      madeAt: new Date(),
    },
    evidencePack: formattedEvidencePack ?? {
      id: '',
      schoolId,
      proposalId,
      pilotRunId,
      safePilotExecutionSummary: {},
      learningQualityReview: {},
      cohortEligibilityResult: {},
      riskAssessmentResult: {},
      teacherReviewResult: {},
      adminApprovalResult: {},
      parentLearnerFeedbackResult: {},
      safeguardingReviewResult: {},
      deenContentReviewResult: {},
      privacyReviewResult: {},
      socraticIntegrityReviewResult: {},
      academicIntegrityReviewResult: {},
      operationsHealthBudgetReview: {},
      pauseRollbackReadinessReview: {},
      safeBlockers: [],
      safeNextActions: [],
      createdAt: new Date(),
    },
    diagnostics,
    safeSummary: safeSummaryParts.join(' '),
    safeToStartTask028,
    safeToStartTask029: false,
    safeToStartTask040: false,
  };

  return report;
}

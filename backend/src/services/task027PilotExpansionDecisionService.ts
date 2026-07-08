import { task027PilotExpansionRepository } from '../repositories/task027PilotExpansionRepository';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { checkRequiredReviews } from './task027PilotExpansionReviewService';
import { REQUIRED_EXPANSION_REVIEW_TYPES } from '../contracts/task027PilotExpansionContracts';
import type { PilotExpansionRecommendedDecision, PilotExpansionApprovalStatus, PilotExpansionRiskLevel } from '../contracts/task027PilotExpansionContracts';

export async function decideExpansion(expansionProposalId: string, actorRole: string, actorIdHash?: string): Promise<{
  ok: boolean;
  approvalId?: string;
  decision: PilotExpansionRecommendedDecision;
  approvalStatus: PilotExpansionApprovalStatus;
  safeToExpand: boolean;
  safeToStartTask028: boolean;
  blockingIssues: string[];
  safeMessage: string;
}> {
  const proposal = await task027PilotExpansionRepository.getProposal(expansionProposalId);
  if (!proposal) {
    return { ok: false, decision: 'do_not_expand', approvalStatus: 'failed', safeToExpand: false, safeToStartTask028: false, blockingIssues: ['proposal_not_found'], safeMessage: 'Proposal not found.' };
  }

  const prop = proposal as any;
  const schoolId = prop.schoolId;
  const pilotProgramId = prop.pilotProgramId;
  const blockingIssues: string[] = [];
  const conditions: string[] = [];

  // 1. Check Task 026 accepted proof
  const task026HandoffPath = 'docs/ops/task-026/TASK_026_HANDOFF.md';
  const fs = require('fs');
  const path = require('path');
  const rootDir = path.resolve(__dirname, '..', '..', '..');
  const handoffPath = path.join(rootDir, task026HandoffPath);
  let task026Accepted = false;
  try {
    if (fs.existsSync(handoffPath)) {
      const content = fs.readFileSync(handoffPath, 'utf-8');
      task026Accepted = content.includes('safeToStartTask027: true') || content.includes('TASK_026_PASS_SAFE_TO_START_TASK_027');
    }
  } catch {
    task026Accepted = false;
  }

  if (!task026Accepted) {
    blockingIssues.push('Task 026 not accepted. Post-pilot review required.');
  }

  // 2. Check post-pilot review
  const executionRuns = await task026PilotExecutionRepository.listExecutionRuns(pilotProgramId);
  let hasPostPilotReview = false;
  let postPilotReviewSafe = false;

  if (executionRuns.length > 0) {
    const run = executionRuns[0] as any;
    const reviews = await task026PilotExecutionRepository.listPostPilotReviews(run.id);
    if (reviews.length > 0) {
      const review = reviews[0] as any;
      hasPostPilotReview = true;
      if (review.safeToStartNextTask) {
        postPilotReviewSafe = true;
      }
    }
  }

  if (!hasPostPilotReview) {
    blockingIssues.push('No post-pilot review found. Expansion requires completed post-pilot review.');
  } else if (!postPilotReviewSafe) {
    blockingIssues.push('Post-pilot review indicates unsafe conditions. Expansion not approved.');
  }

  // 3. Check evidence pack
  const evidencePack = await task027PilotExpansionRepository.getEvidencePackByProposalId(expansionProposalId);
  if (!evidencePack) {
    blockingIssues.push('Evidence pack missing. Generate evidence pack before decision.');
  } else {
    const ep = evidencePack as any;
    if (Array.isArray(ep.blockingIssues) && ep.blockingIssues.length > 0) {
      blockingIssues.push(`Evidence pack has ${ep.blockingIssues.length} blocking issue(s).`);
    }
  }

  // 4. Check risk assessment
  const riskAssessment = await task027PilotExpansionRepository.getRiskAssessmentByProposalId(expansionProposalId);
  if (!riskAssessment) {
    blockingIssues.push('Risk assessment missing. Run risk assessment before decision.');
  } else {
    const ra = riskAssessment as any;
    if (ra.overallRiskLevel === 'critical') {
      blockingIssues.push('Critical overall risk. Expansion not approved.');
    }
    if (ra.overallRiskLevel === 'high') {
      blockingIssues.push('High overall risk. Expansion requires conditions or is blocked.');
    }
    if ((ra.privacyRiskLevel as string) === 'critical') {
      blockingIssues.push('Critical privacy risk blocks expansion.');
    }
    if ((ra.deenRiskLevel as string) === 'critical') {
      blockingIssues.push('Critical Deen governance risk blocks expansion.');
    }
    if ((ra.socraticRiskLevel as string) === 'critical' || (ra.socraticRiskLevel as string) === 'high') {
      blockingIssues.push('Socratic quality risk blocks expansion.');
    }
    if ((ra.curriculumRiskLevel as string) === 'high') {
      blockingIssues.push('Curriculum/source coverage gap blocks expansion.');
    }
  }

  // 5. Check required reviews
  const reviewCheck = await checkRequiredReviews(expansionProposalId);
  if (!reviewCheck.allRequiredPresent) {
    if (reviewCheck.missingReviews.length > 0) {
      blockingIssues.push(`Missing required reviews: ${reviewCheck.missingReviews.join(', ')}.`);
    }
    if (reviewCheck.rejectedReviews.length > 0) {
      blockingIssues.push(`Rejected reviews: ${reviewCheck.rejectedReviews.join(', ')}.`);
    }
  }

  // 6. Check rollback readiness
  const rollbackEvidence = evidencePack ? (evidencePack as any).rollbackEvidence || {} : {};
  if (!(rollbackEvidence as any).rollbackPlanExists) {
    blockingIssues.push('Rollback plan not confirmed.');
  }

  // 7. Check proposal scope limits
  if (prop.requestedStudentIncrease > 100) {
    blockingIssues.push('Proposed student increase exceeds allowed limit of 100.');
    conditions.push('Reduce requested student increase.');
  }
  if (prop.requestedTeacherIncrease > 20) {
    blockingIssues.push('Proposed teacher increase exceeds allowed limit of 20.');
    conditions.push('Reduce requested teacher increase.');
  }

  const uniqueBlocking = [...new Set(blockingIssues)];
  let decision: PilotExpansionRecommendedDecision;
  let approvalStatus: PilotExpansionApprovalStatus;
  let safeToExpand: boolean;

  if (uniqueBlocking.length > 0) {
    decision = 'do_not_expand';
    approvalStatus = 'rejected';
    safeToExpand = false;
  } else {
    decision = 'expand_cautiously';
    approvalStatus = 'approved';
    safeToExpand = true;
  }

  const safeToStartTask028 = safeToExpand && uniqueBlocking.length === 0;

  const now = new Date();
  const approval = await task027PilotExpansionRepository.createApproval({
    expansionProposalId,
    schoolId,
    decision,
    approvalStatus,
    approvedByRole: safeToExpand ? actorRole : undefined,
    approvedByActorIdHash: safeToExpand ? actorIdHash : undefined,
    safeDecisionSummary: `Expansion decision: ${decision}. approvalStatus: ${approvalStatus}. safeToStartTask028: ${safeToStartTask028}.`,
    conditions,
    blockingIssues: uniqueBlocking,
  });

  if (safeToExpand) {
    await task027PilotExpansionRepository.updateApproval((approval as any).id, {
      approvedAt: now,
    });
  } else {
    await task027PilotExpansionRepository.updateApproval((approval as any).id, {
      rejectedAt: now,
    });
  }

  await task027PilotExpansionRepository.updateProposal(expansionProposalId, {
    status: safeToExpand ? 'approved' : 'rejected',
    blockingIssues: uniqueBlocking,
  });

  await task027PilotExpansionRepository.createAuditRecord({
    expansionProposalId,
    pilotProgramId,
    schoolId,
    actorRole,
    actorIdHash,
    action: safeToExpand ? 'expansion_approved' : 'expansion_rejected',
    safeSummary: `Expansion ${safeToExpand ? 'approved' : 'rejected'}. Decision: ${decision}.`,
  });

  return {
    ok: true,
    approvalId: (approval as any).id,
    decision,
    approvalStatus,
    safeToExpand,
    safeToStartTask028,
    blockingIssues: uniqueBlocking,
    safeMessage: safeToExpand
      ? 'Expansion approved. Ready for cohort change.'
      : `Expansion rejected due to ${uniqueBlocking.length} blocking issue(s).`,
  };
}

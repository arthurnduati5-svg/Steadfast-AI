import {
  Task027SchoolAdminApprovalInput,
  Task027SchoolAdminApprovalResult,
} from '../contracts/task027PilotExpansionGovernanceContracts';
import { task027PilotExpansionGovernanceRepository as govRepo } from '../repositories/task027PilotExpansionGovernanceRepository';

export async function approveExpansion(input: Task027SchoolAdminApprovalInput): Promise<Task027SchoolAdminApprovalResult> {
  const {
    schoolId,
    proposalId,
    teacherReviewCompleted,
    riskAssessmentAcceptable,
    operationsCapacityAcceptable,
    privacyReviewPassed,
    safeguardingReviewPassed,
    contentDeenReviewPassed,
    rollbackPathReady,
    evidencePackGenerated,
    adminSafeId,
    safeSummary,
    conditions,
  } = input;

  const proposal = await govRepo.getExpansionProposal(proposalId);
  if (!proposal) {
    return {
      ok: false,
      approvalStatus: 'pending',
      blockingIssues: ['Proposal not found'],
      safeMessage: 'Cannot approve expansion: proposal not found.',
      safeToStartTask028: false,
    };
  }

  const blockingIssues: string[] = [];

  if (!adminSafeId) {
    blockingIssues.push('Admin safe identifier is required.');
  }
  if (!teacherReviewCompleted) {
    blockingIssues.push('Teacher review must be completed before admin approval.');
  }
  if (!riskAssessmentAcceptable) {
    blockingIssues.push('Risk assessment must be acceptable for expansion.');
  }
  if (!operationsCapacityAcceptable) {
    blockingIssues.push('Operations capacity must be acceptable for expansion.');
  }
  if (!privacyReviewPassed) {
    blockingIssues.push('Privacy review must pass before expansion.');
  }
  if (!safeguardingReviewPassed) {
    blockingIssues.push('Safeguarding review must pass before expansion.');
  }
  if (!contentDeenReviewPassed) {
    blockingIssues.push('Content/Deen review must pass where relevant.');
  }
  if (!rollbackPathReady) {
    blockingIssues.push('Rollback path must be ready before expansion.');
  }
  if (!evidencePackGenerated) {
    blockingIssues.push('Evidence pack must be generated before expansion.');
  }
  if (!safeSummary) {
    blockingIssues.push('Safe summary is required for admin approval.');
  }

  if (blockingIssues.length > 0) {
    return {
      ok: false,
      approvalStatus: 'pending',
      blockingIssues,
      safeMessage: `Admin approval blocked: ${blockingIssues.length} issue(s).`,
      safeToStartTask028: false,
    };
  }

  const approvalStatus = 'approved' as const;
  const safeToStartTask028 = true;

  const result = {
    adminSafeId,
    teacherReviewCompleted,
    riskAssessmentAcceptable,
    operationsCapacityAcceptable,
    privacyReviewPassed,
    safeguardingReviewPassed,
    contentDeenReviewPassed,
    rollbackPathReady,
    evidencePackGenerated,
    safeSummary,
    conditions,
    approvalStatus,
    safeToStartTask028,
  };

  await govRepo.recordReviewResult(schoolId, proposalId, 'admin_approval', result);

  return {
    ok: true,
    approvalStatus,
    blockingIssues: [],
    safeMessage: `Admin approval granted. Safe to start Task 028: ${safeToStartTask028}.`,
    safeToStartTask028,
  };
}

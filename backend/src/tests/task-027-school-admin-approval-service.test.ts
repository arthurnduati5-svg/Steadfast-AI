import { describe, it, expect, beforeEach } from 'vitest';
import { approveExpansion } from '../services/task027SchoolAdminApprovalService';
import { task027PilotExpansionGovernanceRepository as govRepo } from '../repositories/task027PilotExpansionGovernanceRepository';

describe('task027SchoolAdminApprovalService', () => {
  beforeEach(() => {
    govRepo.clearTask027StoresForTests();
  });

  async function seedProposal(overrides: Partial<Record<string, unknown>> = {}) {
    const proposal = await govRepo.createExpansionProposal({
      schoolId: 'school-1',
      pilotRunId: 'run-1',
      proposedCohortSize: 10,
      proposedScopeLabels: ['class'],
      proposedClassOrGradeIds: ['c-1'],
      teacherOwnerSafeRefs: ['t-1'],
      supportOwnerSafeRefs: ['s-1'],
      curriculumSourceScopeIds: ['cs-1'],
      startReadinessWindow: 'now',
      rollbackReadinessPath: 'path',
      ...overrides,
    });
    return proposal.id;
  }

  it('returns safeToStartTask028 true when all prerequisites are met', async () => {
    const proposalId = await seedProposal();
    const result = await approveExpansion({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'run-1',
      adminSafeId: 'admin-1',
      teacherReviewCompleted: true,
      riskAssessmentAcceptable: true,
      operationsCapacityAcceptable: true,
      privacyReviewPassed: true,
      safeguardingReviewPassed: true,
      contentDeenReviewPassed: true,
      rollbackPathReady: true,
      evidencePackGenerated: true,
      safeSummary: 'All checks passed',
      conditions: [],
    });

    expect(result.ok).toBe(true);
    expect(result.approvalStatus).toBe('approved');
    expect(result.blockingIssues).toHaveLength(0);
    expect(result.safeToStartTask028).toBe(true);
  });

  it('returns pending when proposal is not found', async () => {
    const result = await approveExpansion({
      schoolId: 'school-1',
      proposalId: 'nonexistent',
      pilotRunId: 'run-1',
      adminSafeId: 'admin-1',
      teacherReviewCompleted: true,
      riskAssessmentAcceptable: true,
      operationsCapacityAcceptable: true,
      privacyReviewPassed: true,
      safeguardingReviewPassed: true,
      contentDeenReviewPassed: true,
      rollbackPathReady: true,
      evidencePackGenerated: true,
      safeSummary: 'test',
      conditions: [],
    });

    expect(result.ok).toBe(false);
    expect(result.approvalStatus).toBe('pending');
    expect(result.blockingIssues).toContain('Proposal not found');
    expect(result.safeToStartTask028).toBe(false);
  });

  it('blocks when teacher review is not completed', async () => {
    const proposalId = await seedProposal();
    const result = await approveExpansion({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'run-1',
      adminSafeId: 'admin-1',
      teacherReviewCompleted: false,
      riskAssessmentAcceptable: true,
      operationsCapacityAcceptable: true,
      privacyReviewPassed: true,
      safeguardingReviewPassed: true,
      contentDeenReviewPassed: true,
      rollbackPathReady: true,
      evidencePackGenerated: true,
      safeSummary: 'test',
      conditions: [],
    });

    expect(result.ok).toBe(false);
    expect(result.approvalStatus).toBe('pending');
    expect(result.safeToStartTask028).toBe(false);
    expect(result.blockingIssues).toContain('Teacher review must be completed before admin approval.');
  });

  it('blocks when risk assessment is not acceptable', async () => {
    const proposalId = await seedProposal();
    const result = await approveExpansion({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'run-1',
      adminSafeId: 'admin-1',
      teacherReviewCompleted: true,
      riskAssessmentAcceptable: false,
      operationsCapacityAcceptable: true,
      privacyReviewPassed: true,
      safeguardingReviewPassed: true,
      contentDeenReviewPassed: true,
      rollbackPathReady: true,
      evidencePackGenerated: true,
      safeSummary: 'test',
      conditions: [],
    });

    expect(result.ok).toBe(false);
    expect(result.safeToStartTask028).toBe(false);
    expect(result.blockingIssues).toContain('Risk assessment must be acceptable for expansion.');
  });

  it('blocks when privacy review has not passed', async () => {
    const proposalId = await seedProposal();
    const result = await approveExpansion({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'run-1',
      adminSafeId: 'admin-1',
      teacherReviewCompleted: true,
      riskAssessmentAcceptable: true,
      operationsCapacityAcceptable: true,
      privacyReviewPassed: false,
      safeguardingReviewPassed: true,
      contentDeenReviewPassed: true,
      rollbackPathReady: true,
      evidencePackGenerated: true,
      safeSummary: 'test',
      conditions: [],
    });

    expect(result.ok).toBe(false);
    expect(result.safeToStartTask028).toBe(false);
    expect(result.blockingIssues).toContain('Privacy review must pass before expansion.');
  });

  it('returns multiple blocking issues when several gates fail', async () => {
    const proposalId = await seedProposal();
    const result = await approveExpansion({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'run-1',
      adminSafeId: '',
      teacherReviewCompleted: false,
      riskAssessmentAcceptable: false,
      operationsCapacityAcceptable: false,
      privacyReviewPassed: false,
      safeguardingReviewPassed: false,
      contentDeenReviewPassed: false,
      rollbackPathReady: false,
      evidencePackGenerated: false,
      safeSummary: '',
      conditions: [],
    });

    expect(result.ok).toBe(false);
    expect(result.safeToStartTask028).toBe(false);
    expect(result.blockingIssues.length).toBeGreaterThanOrEqual(9);
    expect(result.blockingIssues).toContain('Admin safe identifier is required.');
    expect(result.blockingIssues).toContain('Teacher review must be completed before admin approval.');
  });
});

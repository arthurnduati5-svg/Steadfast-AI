import { describe, it, expect, beforeEach } from 'vitest';
import { task027PilotExpansionRepository } from '../repositories/task027PilotExpansionRepository';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { applyCohortExpansion, rollbackCohortExpansion } from '../services/task027PilotExpansionCohortChangeService';
import { setupExpansionTestEnvironment } from './task-027-test-helper';

describe('Task 027 Cohort Change Service', () => {
  beforeEach(async () => {
    task027PilotExpansionRepository._clearMemory();
    task026PilotExecutionRepository._clearMemory();
    process.env.NODE_ENV = 'test';
  });

  it('should fail for non-existent proposal', async () => {
    const result = await applyCohortExpansion('nonexistent', 'admin');
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('proposal_not_found');
  });

  it('should fail for non-approved proposal', async () => {
    const { proposalId } = await setupExpansionTestEnvironment();
    const result = await applyCohortExpansion(proposalId, 'admin');
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('proposal_not_approved');
  });

  it('should apply cohort expansion after approval', async () => {
    const { proposalId } = await setupExpansionTestEnvironment();

    await task027PilotExpansionRepository.updateProposal(proposalId, { status: 'approved' });
    await task027PilotExpansionRepository.createApproval({
      expansionProposalId: proposalId,
      schoolId: 'school-1',
      decision: 'expand_cautiously',
      approvalStatus: 'approved',
      safeDecisionSummary: 'Approved',
      approvedByRole: 'admin',
    });

    const result = await applyCohortExpansion(proposalId, 'admin');
    expect(result.ok).toBe(true);
    expect(result.cohortChangeId).toBeTruthy();
    expect(result.addedStudentCount).toBe(10);
    expect(result.addedTeacherCount).toBe(2);
  });

  it('should preserve rollback plan after cohort change', async () => {
    const { proposalId } = await setupExpansionTestEnvironment();

    await task027PilotExpansionRepository.updateProposal(proposalId, { status: 'approved' });
    await task027PilotExpansionRepository.createApproval({
      expansionProposalId: proposalId,
      schoolId: 'school-1',
      decision: 'expand_cautiously',
      approvalStatus: 'approved',
      safeDecisionSummary: 'Approved',
      approvedByRole: 'admin',
    });

    const result = await applyCohortExpansion(proposalId, 'admin');
    expect(result.ok).toBe(true);

    const change = await task027PilotExpansionRepository.getCohortChange(result.cohortChangeId!);
    expect(change).toBeTruthy();
    expect((change as any).rollbackPlan).toBeTruthy();
    expect((change as any).previousCohortSnapshot).toBeTruthy();
  });

  it('should rollback cohort expansion', async () => {
    const { proposalId } = await setupExpansionTestEnvironment();

    await task027PilotExpansionRepository.updateProposal(proposalId, { status: 'approved' });
    await task027PilotExpansionRepository.createApproval({
      expansionProposalId: proposalId,
      schoolId: 'school-1',
      decision: 'expand_cautiously',
      approvalStatus: 'approved',
      safeDecisionSummary: 'Approved',
      approvedByRole: 'admin',
    });

    const result = await applyCohortExpansion(proposalId, 'admin');
    expect(result.ok).toBe(true);

    const rollback = await rollbackCohortExpansion(result.cohortChangeId!, 'admin');
    expect(rollback.ok).toBe(true);
  });
});

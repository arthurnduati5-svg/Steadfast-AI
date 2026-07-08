import { describe, it, expect, beforeEach } from 'vitest';
import { reviewSafeguarding } from '../services/task027SafeguardingReviewService';
import { task027PilotExpansionGovernanceRepository as govRepo } from '../repositories/task027PilotExpansionGovernanceRepository';

describe('task027SafeguardingReviewService', () => {
  beforeEach(() => {
    govRepo.clearTask027StoresForTests();
  });

  async function seedProposal() {
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
    });
    return proposal.id;
  }

  it('passes when all conditions are met', async () => {
    const proposalId = await seedProposal();
    const result = await reviewSafeguarding({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'run-1',
      safeguardingOwnerSafeRef: 'safeguard-owner-1',
      seriousRiskDisclosureMinimal: true,
      humanReviewPathExists: true,
      roleScopedDisclosureOnly: true,
    });

    expect(result.ok).toBe(true);
    expect(result.reviewStatus).toBe('passed');
    expect(result.blockingIssues).toHaveLength(0);
  });

  it('blocks when serious-risk disclosure is not minimal', async () => {
    const proposalId = await seedProposal();
    const result = await reviewSafeguarding({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'run-1',
      safeguardingOwnerSafeRef: 'safeguard-owner-1',
      seriousRiskDisclosureMinimal: false,
      humanReviewPathExists: true,
      roleScopedDisclosureOnly: true,
    });

    expect(result.ok).toBe(false);
    expect(result.reviewStatus).toBe('blocked');
    expect(result.blockingIssues).toContain('Serious risk disclosure must be minimal and necessary.');
  });

  it('blocks when human review path is missing', async () => {
    const proposalId = await seedProposal();
    const result = await reviewSafeguarding({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'run-1',
      safeguardingOwnerSafeRef: 'safeguard-owner-1',
      seriousRiskDisclosureMinimal: true,
      humanReviewPathExists: false,
      roleScopedDisclosureOnly: true,
    });

    expect(result.ok).toBe(false);
    expect(result.reviewStatus).toBe('blocked');
    expect(result.blockingIssues).toContain('Human review path must exist for safeguarding concerns.');
  });

  it('blocks when raw safeguarding notes are included in input', async () => {
    const proposalId = await seedProposal();
    const result = await reviewSafeguarding({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'run-1',
      safeguardingOwnerSafeRef: 'safeguard-owner-1',
      seriousRiskDisclosureMinimal: true,
      humanReviewPathExists: true,
      roleScopedDisclosureOnly: true,
      rawSafeguardingNotes: 'some raw note',
    } as any);

    expect(result.ok).toBe(false);
    expect(result.reviewStatus).toBe('blocked');
    expect(result.blockingIssues).toContain('Raw safeguarding notes or disclosures are not permitted in review metadata.');
  });

  it('blocks when role-scoped disclosure is not enforced', async () => {
    const proposalId = await seedProposal();
    const result = await reviewSafeguarding({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'run-1',
      safeguardingOwnerSafeRef: 'safeguard-owner-1',
      seriousRiskDisclosureMinimal: true,
      humanReviewPathExists: true,
      roleScopedDisclosureOnly: false,
    });

    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('Safeguarding disclosures must be role-scoped.');
  });

  it('reports proposal not found when proposal does not exist', async () => {
    const result = await reviewSafeguarding({
      schoolId: 'school-1',
      proposalId: 'nonexistent',
      pilotRunId: 'run-1',
      safeguardingOwnerSafeRef: 'safeguard-owner-1',
      seriousRiskDisclosureMinimal: true,
      humanReviewPathExists: true,
      roleScopedDisclosureOnly: true,
    });

    expect(result.ok).toBe(false);
    expect(result.reviewStatus).toBe('not_reviewed');
    expect(result.blockingIssues).toContain('Proposal not found');
  });
});

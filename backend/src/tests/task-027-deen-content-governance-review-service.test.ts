import { describe, it, expect, beforeEach } from 'vitest';
import { reviewDeenContent } from '../services/task027DeenContentGovernanceReviewService';
import { task027PilotExpansionGovernanceRepository as govRepo } from '../repositories/task027PilotExpansionGovernanceRepository';

describe('task027DeenContentGovernanceReviewService', () => {
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

  it('passes when all conditions are met with no Deen content', async () => {
    const proposalId = await seedProposal();
    const result = await reviewDeenContent({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'run-1',
      approvedDeenSourcesVerified: false,
      deenContentPresent: false,
      noFatwaEngineBehavior: true,
      noPietyScoring: true,
      noSectarianJudgment: true,
      scholarReferralPathExists: true,
      contentSourcePolicyPassed: true,
    });

    expect(result.ok).toBe(true);
    expect(result.reviewStatus).toBe('passed');
    expect(result.blockingIssues).toHaveLength(0);
  });

  it('blocks when approved Deen sources not verified and Deen content present', async () => {
    const proposalId = await seedProposal();
    const result = await reviewDeenContent({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'run-1',
      approvedDeenSourcesVerified: false,
      deenContentPresent: true,
      noFatwaEngineBehavior: true,
      noPietyScoring: true,
      noSectarianJudgment: true,
      scholarReferralPathExists: true,
      contentSourcePolicyPassed: true,
    });

    expect(result.ok).toBe(false);
    expect(result.reviewStatus).toBe('blocked');
    expect(result.blockingIssues).toContain('Approved Deen sources must be verified where Deen content exists.');
    expect(result.blockingIssues).toContain('Deen evidence is missing or unsafe: approved sources not verified.');
  });

  it('blocks when fatwa-engine behavior is detected', async () => {
    const proposalId = await seedProposal();
    const result = await reviewDeenContent({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'run-1',
      approvedDeenSourcesVerified: true,
      deenContentPresent: false,
      noFatwaEngineBehavior: false,
      noPietyScoring: true,
      noSectarianJudgment: true,
      scholarReferralPathExists: true,
      contentSourcePolicyPassed: true,
    });

    expect(result.ok).toBe(false);
    expect(result.reviewStatus).toBe('blocked');
    expect(result.blockingIssues).toContain('Fatwa-engine behavior is not permitted.');
  });

  it('blocks when sectarian judgment is detected', async () => {
    const proposalId = await seedProposal();
    const result = await reviewDeenContent({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'run-1',
      approvedDeenSourcesVerified: true,
      deenContentPresent: false,
      noFatwaEngineBehavior: true,
      noPietyScoring: true,
      noSectarianJudgment: false,
      scholarReferralPathExists: true,
      contentSourcePolicyPassed: true,
    });

    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('Sectarian judgment is not permitted.');
  });

  it('blocks when piety scoring is detected', async () => {
    const proposalId = await seedProposal();
    const result = await reviewDeenContent({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'run-1',
      approvedDeenSourcesVerified: true,
      deenContentPresent: false,
      noFatwaEngineBehavior: true,
      noPietyScoring: false,
      noSectarianJudgment: true,
      scholarReferralPathExists: true,
      contentSourcePolicyPassed: true,
    });

    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('Piety scoring is not permitted.');
  });

  it('blocks when content source policy has not passed', async () => {
    const proposalId = await seedProposal();
    const result = await reviewDeenContent({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'run-1',
      approvedDeenSourcesVerified: true,
      deenContentPresent: false,
      noFatwaEngineBehavior: true,
      noPietyScoring: true,
      noSectarianJudgment: true,
      scholarReferralPathExists: true,
      contentSourcePolicyPassed: false,
    });

    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('Content source policy must be passed.');
  });

  it('reports proposal not found when proposal does not exist', async () => {
    const result = await reviewDeenContent({
      schoolId: 'school-1',
      proposalId: 'nonexistent',
      pilotRunId: 'run-1',
      approvedDeenSourcesVerified: true,
      deenContentPresent: false,
      noFatwaEngineBehavior: true,
      noPietyScoring: true,
      noSectarianJudgment: true,
      scholarReferralPathExists: true,
      contentSourcePolicyPassed: true,
    });

    expect(result.ok).toBe(false);
    expect(result.reviewStatus).toBe('not_reviewed');
    expect(result.blockingIssues).toContain('Proposal not found');
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { reviewPrivacy } from '../services/task027PrivacyReviewService';
import { task027PilotExpansionGovernanceRepository as govRepo } from '../repositories/task027PilotExpansionGovernanceRepository';

describe('task027PrivacyReviewService', () => {
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
    const result = await reviewPrivacy({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'run-1',
      noRawLearnerData: true,
      noRawParentData: true,
      noRawTeacherNotes: true,
      noRawSafeguardingNotes: true,
      noPrivateDeenText: true,
      noProviderPayloads: true,
      noHiddenReasoning: true,
      minimalSafeMetadataOnly: true,
      roleScopedReportVisibility: true,
    });

    expect(result.ok).toBe(true);
    expect(result.reviewStatus).toBe('passed');
    expect(result.blockingIssues).toHaveLength(0);
  });

  it('blocks when raw learner data is found', async () => {
    const proposalId = await seedProposal();
    const result = await reviewPrivacy({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'run-1',
      noRawLearnerData: false,
      noRawParentData: true,
      noRawTeacherNotes: true,
      noRawSafeguardingNotes: true,
      noPrivateDeenText: true,
      noProviderPayloads: true,
      noHiddenReasoning: true,
      minimalSafeMetadataOnly: true,
      roleScopedReportVisibility: true,
    });

    expect(result.ok).toBe(false);
    expect(result.reviewStatus).toBe('failed');
    expect(result.blockingIssues).toContain('No raw learner data permitted in evidence pack.');
  });

  it('blocks when raw parent data is found', async () => {
    const proposalId = await seedProposal();
    const result = await reviewPrivacy({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'run-1',
      noRawLearnerData: true,
      noRawParentData: false,
      noRawTeacherNotes: true,
      noRawSafeguardingNotes: true,
      noPrivateDeenText: true,
      noProviderPayloads: true,
      noHiddenReasoning: true,
      minimalSafeMetadataOnly: true,
      roleScopedReportVisibility: true,
    });

    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('No raw parent data permitted in evidence pack.');
  });

  it('blocks when provider payloads are found', async () => {
    const proposalId = await seedProposal();
    const result = await reviewPrivacy({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'run-1',
      noRawLearnerData: true,
      noRawParentData: true,
      noRawTeacherNotes: true,
      noRawSafeguardingNotes: true,
      noPrivateDeenText: true,
      noProviderPayloads: false,
      noHiddenReasoning: true,
      minimalSafeMetadataOnly: true,
      roleScopedReportVisibility: true,
    });

    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('No provider payloads permitted in evidence pack.');
  });

  it('blocks when hidden reasoning is found', async () => {
    const proposalId = await seedProposal();
    const result = await reviewPrivacy({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'run-1',
      noRawLearnerData: true,
      noRawParentData: true,
      noRawTeacherNotes: true,
      noRawSafeguardingNotes: true,
      noPrivateDeenText: true,
      noProviderPayloads: true,
      noHiddenReasoning: false,
      minimalSafeMetadataOnly: true,
      roleScopedReportVisibility: true,
    });

    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('No hidden reasoning permitted in evidence pack.');
  });

  it('blocks when raw teacher notes are found', async () => {
    const proposalId = await seedProposal();
    const result = await reviewPrivacy({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'run-1',
      noRawLearnerData: true,
      noRawParentData: true,
      noRawTeacherNotes: false,
      noRawSafeguardingNotes: true,
      noPrivateDeenText: true,
      noProviderPayloads: true,
      noHiddenReasoning: true,
      minimalSafeMetadataOnly: true,
      roleScopedReportVisibility: true,
    });

    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('No raw teacher notes permitted in evidence pack.');
  });

  it('reports proposal not found when proposal does not exist', async () => {
    const result = await reviewPrivacy({
      schoolId: 'school-1',
      proposalId: 'nonexistent',
      pilotRunId: 'run-1',
      noRawLearnerData: true,
      noRawParentData: true,
      noRawTeacherNotes: true,
      noRawSafeguardingNotes: true,
      noPrivateDeenText: true,
      noProviderPayloads: true,
      noHiddenReasoning: true,
      minimalSafeMetadataOnly: true,
      roleScopedReportVisibility: true,
    });

    expect(result.ok).toBe(false);
    expect(result.reviewStatus).toBe('not_reviewed');
    expect(result.blockingIssues).toContain('Proposal not found');
  });
});

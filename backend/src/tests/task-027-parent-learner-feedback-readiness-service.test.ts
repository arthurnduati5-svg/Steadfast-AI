import { describe, it, expect, beforeEach } from 'vitest';
import { checkParentLearnerFeedbackReadiness } from '../services/task027ParentLearnerFeedbackReadinessService';
import { task027PilotExpansionGovernanceRepository as govRepo } from '../repositories/task027PilotExpansionGovernanceRepository';

describe('task027ParentLearnerFeedbackReadinessService', () => {
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

  it('returns no feedback available when no evidence summary or reviews exist', async () => {
    const proposalId = await seedProposal();
    const result = await checkParentLearnerFeedbackReadiness({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'run-1',
    });

    expect(result.ok).toBe(false);
    expect(result.feedbackAvailable).toBe(false);
    expect(result.seriousUnresolvedConcerns).toBe(false);
    expect(result.unresolvedSafeguardingSignal).toBe(false);
    expect(result.blockingIssues).toContain('No parent/learner feedback available. Evidence from Task 026 required.');
  });

  it('passes when feedback is available with no concerns', async () => {
    const proposalId = await seedProposal();
    await govRepo.recordEvidenceSummary('school-1', 'run-1', {
      pilotRunId: 'run-1',
      schoolId: 'school-1',
      cohortSafeCount: 5,
      sessionsStartedCount: 50,
      sessionsBlockedCount: 0,
      supportNeededCount: 0,
      incidentCount: 0,
      safeguardingSignalCount: 0,
      pauseCount: 0,
      rollbackCount: 0,
      safeLearningQualitySignals: {},
      safeSocraticIntegritySignals: {},
      safeContentGovernanceSignals: {},
      safeOperationsSignals: {
        safeParentLearnerFeedbackSummary: 'All feedback positive',
      },
    });

    const result = await checkParentLearnerFeedbackReadiness({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'run-1',
    });

    expect(result.ok).toBe(true);
    expect(result.feedbackAvailable).toBe(true);
    expect(result.seriousUnresolvedConcerns).toBe(false);
    expect(result.unresolvedSafeguardingSignal).toBe(false);
    expect(result.blockingIssues).toHaveLength(0);
  });

  it('blocks when feedback has serious unresolved concerns', async () => {
    const proposalId = await seedProposal();
    await govRepo.recordReviewResult('school-1', proposalId, 'parent_feedback_readiness', {
      safeSummary: 'Some concerns',
      seriousUnresolvedConcerns: true,
      unresolvedSafeguardingSignal: false,
      confusionOrUnsafeBehaviorWithoutMitigation: false,
    });

    const result = await checkParentLearnerFeedbackReadiness({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'run-1',
    });

    expect(result.ok).toBe(false);
    expect(result.feedbackAvailable).toBe(true);
    expect(result.seriousUnresolvedConcerns).toBe(true);
    expect(result.blockingIssues).toContain('Feedback indicates serious unresolved concern.');
  });

  it('blocks when feedback contains unresolved safeguarding signal', async () => {
    const proposalId = await seedProposal();
    await govRepo.recordReviewResult('school-1', proposalId, 'parent_feedback_readiness', {
      safeSummary: 'Feedback with safeguarding signal',
      seriousUnresolvedConcerns: false,
      unresolvedSafeguardingSignal: true,
      confusionOrUnsafeBehaviorWithoutMitigation: false,
    });

    const result = await checkParentLearnerFeedbackReadiness({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'run-1',
    });

    expect(result.ok).toBe(false);
    expect(result.feedbackAvailable).toBe(true);
    expect(result.unresolvedSafeguardingSignal).toBe(true);
    expect(result.blockingIssues).toContain('Feedback contains unresolved safeguarding signal.');
  });

  it('blocks when feedback has confusion or unsafe behavior without mitigation', async () => {
    const proposalId = await seedProposal();
    await govRepo.recordReviewResult('school-1', proposalId, 'parent_feedback_readiness', {
      safeSummary: 'Confusion detected',
      seriousUnresolvedConcerns: false,
      unresolvedSafeguardingSignal: false,
      confusionOrUnsafeBehaviorWithoutMitigation: true,
    });

    const result = await checkParentLearnerFeedbackReadiness({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'run-1',
    });

    expect(result.ok).toBe(false);
    expect(result.seriousUnresolvedConcerns).toBe(true);
    expect(result.blockingIssues).toContain('Feedback indicates confusion or unsafe behavior without mitigation.');
  });
});

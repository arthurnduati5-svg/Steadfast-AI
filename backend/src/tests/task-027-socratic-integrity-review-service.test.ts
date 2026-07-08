import { describe, it, expect, beforeEach } from 'vitest';
import { reviewSocraticIntegrity } from '../services/task027SocraticIntegrityReviewService';
import { task027PilotExpansionGovernanceRepository as govRepo } from '../repositories/task027PilotExpansionGovernanceRepository';

describe('task027SocraticIntegrityReviewService', () => {
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
    const result = await reviewSocraticIntegrity({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'run-1',
      noFinalAnswerShortcut: true,
      noAnswerKeyLeakage: true,
      hintLadderPreserved: true,
      studentAgencyPreserved: true,
      reflectionPromptsPreserved: true,
      cheatingPreventionPreserved: true,
      teacherOnlyMaterialProtected: true,
    });

    expect(result.ok).toBe(true);
    expect(result.reviewStatus).toBe('passed');
    expect(result.blockingIssues).toHaveLength(0);
  });

  it('blocks when final answer shortcut is detected', async () => {
    const proposalId = await seedProposal();
    const result = await reviewSocraticIntegrity({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'run-1',
      noFinalAnswerShortcut: false,
      noAnswerKeyLeakage: true,
      hintLadderPreserved: true,
      studentAgencyPreserved: true,
      reflectionPromptsPreserved: true,
      cheatingPreventionPreserved: true,
      teacherOnlyMaterialProtected: true,
    });

    expect(result.ok).toBe(false);
    expect(result.reviewStatus).toBe('failed');
    expect(result.blockingIssues).toContain('Final-answer shortcut behavior detected. Socratic method requires scaffolded reasoning.');
  });

  it('blocks when answer key leakage is detected', async () => {
    const proposalId = await seedProposal();
    const result = await reviewSocraticIntegrity({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'run-1',
      noFinalAnswerShortcut: true,
      noAnswerKeyLeakage: false,
      hintLadderPreserved: true,
      studentAgencyPreserved: true,
      reflectionPromptsPreserved: true,
      cheatingPreventionPreserved: true,
      teacherOnlyMaterialProtected: true,
    });

    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('Answer-key leakage detected. Socratic method prohibits direct answers.');
  });

  it('blocks when hint ladder is not preserved', async () => {
    const proposalId = await seedProposal();
    const result = await reviewSocraticIntegrity({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'run-1',
      noFinalAnswerShortcut: true,
      noAnswerKeyLeakage: true,
      hintLadderPreserved: false,
      studentAgencyPreserved: true,
      reflectionPromptsPreserved: true,
      cheatingPreventionPreserved: true,
      teacherOnlyMaterialProtected: true,
    });

    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('Hint ladder not preserved. Progressive scaffolding required.');
  });

  it('blocks when student agency is not preserved', async () => {
    const proposalId = await seedProposal();
    const result = await reviewSocraticIntegrity({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'run-1',
      noFinalAnswerShortcut: true,
      noAnswerKeyLeakage: true,
      hintLadderPreserved: true,
      studentAgencyPreserved: false,
      reflectionPromptsPreserved: true,
      cheatingPreventionPreserved: true,
      teacherOnlyMaterialProtected: true,
    });

    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('Student agency not preserved. Learners must drive their own reasoning.');
  });

  it('blocks when reflection prompts are not preserved', async () => {
    const proposalId = await seedProposal();
    const result = await reviewSocraticIntegrity({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'run-1',
      noFinalAnswerShortcut: true,
      noAnswerKeyLeakage: true,
      hintLadderPreserved: true,
      studentAgencyPreserved: true,
      reflectionPromptsPreserved: false,
      cheatingPreventionPreserved: true,
      teacherOnlyMaterialProtected: true,
    });

    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('Reflection prompts not preserved. Metacognitive reflection is required.');
  });

  it('reports proposal not found when proposal does not exist', async () => {
    const result = await reviewSocraticIntegrity({
      schoolId: 'school-1',
      proposalId: 'nonexistent',
      pilotRunId: 'run-1',
      noFinalAnswerShortcut: true,
      noAnswerKeyLeakage: true,
      hintLadderPreserved: true,
      studentAgencyPreserved: true,
      reflectionPromptsPreserved: true,
      cheatingPreventionPreserved: true,
      teacherOnlyMaterialProtected: true,
    });

    expect(result.ok).toBe(false);
    expect(result.reviewStatus).toBe('not_reviewed');
    expect(result.blockingIssues).toContain('Proposal not found');
  });
});

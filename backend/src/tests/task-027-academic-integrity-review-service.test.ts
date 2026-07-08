import { describe, it, expect, beforeEach } from 'vitest';
import { reviewAcademicIntegrity } from '../services/task027AcademicIntegrityReviewService';
import { task027PilotExpansionGovernanceRepository as govRepo } from '../repositories/task027PilotExpansionGovernanceRepository';

describe('task027AcademicIntegrityReviewService', () => {
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
    const result = await reviewAcademicIntegrity({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'run-1',
      noAnswerKeyLeakage: true,
      noHomeworkShortcutPattern: true,
      noFinalAnswerFirstBehavior: true,
      noProtectedRubricLeakage: true,
      noExamBypass: true,
      studentEffortEvidenceExists: true,
    });

    expect(result.ok).toBe(true);
    expect(result.reviewStatus).toBe('passed');
    expect(result.blockingIssues).toHaveLength(0);
  });

  it('blocks when answer key leakage is detected', async () => {
    const proposalId = await seedProposal();
    const result = await reviewAcademicIntegrity({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'run-1',
      noAnswerKeyLeakage: false,
      noHomeworkShortcutPattern: true,
      noFinalAnswerFirstBehavior: true,
      noProtectedRubricLeakage: true,
      noExamBypass: true,
      studentEffortEvidenceExists: true,
    });

    expect(result.ok).toBe(false);
    expect(result.reviewStatus).toBe('failed');
    expect(result.blockingIssues).toContain('Answer-key leakage detected. Academic integrity requires answer protection.');
  });

  it('blocks when homework shortcut pattern is detected', async () => {
    const proposalId = await seedProposal();
    const result = await reviewAcademicIntegrity({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'run-1',
      noAnswerKeyLeakage: true,
      noHomeworkShortcutPattern: false,
      noFinalAnswerFirstBehavior: true,
      noProtectedRubricLeakage: true,
      noExamBypass: true,
      studentEffortEvidenceExists: true,
    });

    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('Homework shortcut pattern detected. Direct homework solutions are prohibited.');
  });

  it('blocks when student effort evidence is missing', async () => {
    const proposalId = await seedProposal();
    const result = await reviewAcademicIntegrity({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'run-1',
      noAnswerKeyLeakage: true,
      noHomeworkShortcutPattern: true,
      noFinalAnswerFirstBehavior: true,
      noProtectedRubricLeakage: true,
      noExamBypass: true,
      studentEffortEvidenceExists: false,
    });

    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('Student effort evidence missing. Evidence of learner work required.');
  });

  it('blocks when exam bypass is detected', async () => {
    const proposalId = await seedProposal();
    const result = await reviewAcademicIntegrity({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'run-1',
      noAnswerKeyLeakage: true,
      noHomeworkShortcutPattern: true,
      noFinalAnswerFirstBehavior: true,
      noProtectedRubricLeakage: true,
      noExamBypass: false,
      studentEffortEvidenceExists: true,
    });

    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('Exam/quiz bypass detected. Assessment integrity guards required.');
  });

  it('blocks when protected rubric leakage is detected', async () => {
    const proposalId = await seedProposal();
    const result = await reviewAcademicIntegrity({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'run-1',
      noAnswerKeyLeakage: true,
      noHomeworkShortcutPattern: true,
      noFinalAnswerFirstBehavior: true,
      noProtectedRubricLeakage: false,
      noExamBypass: true,
      studentEffortEvidenceExists: true,
    });

    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('Protected rubric leakage detected. Assessment rubrics must remain confidential.');
  });

  it('reports proposal not found when proposal does not exist', async () => {
    const result = await reviewAcademicIntegrity({
      schoolId: 'school-1',
      proposalId: 'nonexistent',
      pilotRunId: 'run-1',
      noAnswerKeyLeakage: true,
      noHomeworkShortcutPattern: true,
      noFinalAnswerFirstBehavior: true,
      noProtectedRubricLeakage: true,
      noExamBypass: true,
      studentEffortEvidenceExists: true,
    });

    expect(result.ok).toBe(false);
    expect(result.reviewStatus).toBe('not_reviewed');
    expect(result.blockingIssues).toContain('Proposal not found');
  });
});

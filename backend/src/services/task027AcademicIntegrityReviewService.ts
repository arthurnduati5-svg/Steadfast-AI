import {
  Task027AcademicIntegrityReviewInput,
  Task027AcademicIntegrityReviewResult,
} from '../contracts/task027PilotExpansionGovernanceContracts';
import { task027PilotExpansionGovernanceRepository as govRepo } from '../repositories/task027PilotExpansionGovernanceRepository';

export async function reviewAcademicIntegrity(input: Task027AcademicIntegrityReviewInput): Promise<Task027AcademicIntegrityReviewResult> {
  const {
    schoolId,
    proposalId,
    noAnswerKeyLeakage,
    noHomeworkShortcutPattern,
    noFinalAnswerFirstBehavior,
    noProtectedRubricLeakage,
    noExamBypass,
    studentEffortEvidenceExists,
  } = input;

  const proposal = await govRepo.getExpansionProposal(proposalId);
  if (!proposal) {
    return {
      ok: false,
      reviewStatus: 'not_reviewed',
      blockingIssues: ['Proposal not found'],
      safeMessage: 'Cannot review academic integrity: proposal not found.',
    };
  }

  const blockingIssues: string[] = [];

  if (!noAnswerKeyLeakage) {
    blockingIssues.push('Answer-key leakage detected. Academic integrity requires answer protection.');
  }
  if (!noHomeworkShortcutPattern) {
    blockingIssues.push('Homework shortcut pattern detected. Direct homework solutions are prohibited.');
  }
  if (!noFinalAnswerFirstBehavior) {
    blockingIssues.push('Final-answer-first behavior detected. Scaffolded reasoning required.');
  }
  if (!noProtectedRubricLeakage) {
    blockingIssues.push('Protected rubric leakage detected. Assessment rubrics must remain confidential.');
  }
  if (!noExamBypass) {
    blockingIssues.push('Exam/quiz bypass detected. Assessment integrity guards required.');
  }
  if (!studentEffortEvidenceExists) {
    blockingIssues.push('Student effort evidence missing. Evidence of learner work required.');
  }

  const reviewStatus: 'failed' | 'passed_with_conditions' | 'passed' =
    blockingIssues.length > 0
      ? 'failed'
      : !studentEffortEvidenceExists
        ? 'passed_with_conditions'
        : 'passed';

  const ok = blockingIssues.length === 0;

  const result = {
    noAnswerKeyLeakage,
    noHomeworkShortcutPattern,
    noFinalAnswerFirstBehavior,
    noProtectedRubricLeakage,
    noExamBypass,
    studentEffortEvidenceExists,
    reviewStatus,
  };

  await govRepo.recordReviewResult(schoolId, proposalId, 'academic_integrity_review', result);

  return {
    ok,
    reviewStatus,
    blockingIssues,
    safeMessage: ok
      ? 'Academic integrity review passed.'
      : `Academic integrity review failed: ${blockingIssues.length} issue(s).`,
  };
}

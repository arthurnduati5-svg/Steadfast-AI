import {
  Task027SocraticIntegrityReviewInput,
  Task027SocraticIntegrityReviewResult,
} from '../contracts/task027PilotExpansionGovernanceContracts';
import { task027PilotExpansionGovernanceRepository as govRepo } from '../repositories/task027PilotExpansionGovernanceRepository';

export async function reviewSocraticIntegrity(input: Task027SocraticIntegrityReviewInput): Promise<Task027SocraticIntegrityReviewResult> {
  const {
    schoolId,
    proposalId,
    noFinalAnswerShortcut,
    noAnswerKeyLeakage,
    hintLadderPreserved,
    studentAgencyPreserved,
    reflectionPromptsPreserved,
    cheatingPreventionPreserved,
    teacherOnlyMaterialProtected,
  } = input;

  const proposal = await govRepo.getExpansionProposal(proposalId);
  if (!proposal) {
    return {
      ok: false,
      reviewStatus: 'not_reviewed',
      blockingIssues: ['Proposal not found'],
      safeMessage: 'Cannot review Socratic integrity: proposal not found.',
    };
  }

  const blockingIssues: string[] = [];

  if (!noFinalAnswerShortcut) {
    blockingIssues.push('Final-answer shortcut behavior detected. Socratic method requires scaffolded reasoning.');
  }
  if (!noAnswerKeyLeakage) {
    blockingIssues.push('Answer-key leakage detected. Socratic method prohibits direct answers.');
  }
  if (!hintLadderPreserved) {
    blockingIssues.push('Hint ladder not preserved. Progressive scaffolding required.');
  }
  if (!studentAgencyPreserved) {
    blockingIssues.push('Student agency not preserved. Learners must drive their own reasoning.');
  }
  if (!reflectionPromptsPreserved) {
    blockingIssues.push('Reflection prompts not preserved. Metacognitive reflection is required.');
  }
  if (!cheatingPreventionPreserved) {
    blockingIssues.push('Cheating prevention not preserved. Academic integrity guards required.');
  }
  if (!teacherOnlyMaterialProtected) {
    blockingIssues.push('Teacher-only material not protected. Sensitive pedagogical data must be secured.');
  }

  const reviewStatus: 'failed' | 'passed_with_conditions' | 'passed' =
    blockingIssues.length > 0
      ? 'failed'
      : (!hintLadderPreserved || !studentAgencyPreserved)
        ? 'passed_with_conditions'
        : 'passed';

  const ok = blockingIssues.length === 0;

  const result = {
    noFinalAnswerShortcut,
    noAnswerKeyLeakage,
    hintLadderPreserved,
    studentAgencyPreserved,
    reflectionPromptsPreserved,
    cheatingPreventionPreserved,
    teacherOnlyMaterialProtected,
    reviewStatus,
  };

  await govRepo.recordReviewResult(schoolId, proposalId, 'socratic_integrity_review', result);

  return {
    ok,
    reviewStatus,
    blockingIssues,
    safeMessage: ok
      ? 'Socratic integrity review passed.'
      : `Socratic integrity review failed: ${blockingIssues.length} issue(s).`,
  };
}

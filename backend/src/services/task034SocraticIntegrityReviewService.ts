import type { Task034SocraticIntegrityReviewResult } from '../contracts/task034ControlledLimitedRolloutContracts';

export function reviewTask034SocraticIntegrity(overrides?: Partial<Task034SocraticIntegrityReviewResult>): Task034SocraticIntegrityReviewResult {
  const defaults: Task034SocraticIntegrityReviewResult = {
    ok: true,
    socraticGuidancePreserved: true,
    noFinalAnswerBotBehavior: true,
    cheatingPreventionPreserved: true,
    hintLadderPreserved: true,
    studentReasoningFirstPreserved: true,
    teacherEscalationAvailable: true,
    blockingIssues: [],
  };

  const resolved = { ...defaults, ...overrides };
  const blockingIssues: string[] = [];

  if (!resolved.socraticGuidancePreserved) blockingIssues.push('socratic_guidance_not_preserved');
  if (!resolved.noFinalAnswerBotBehavior) blockingIssues.push('final_answer_bot_behavior_detected');
  if (!resolved.cheatingPreventionPreserved) blockingIssues.push('cheating_prevention_not_preserved');
  if (!resolved.hintLadderPreserved) blockingIssues.push('hint_ladder_not_preserved');
  if (!resolved.studentReasoningFirstPreserved) blockingIssues.push('student_reasoning_first_not_preserved');
  if (!resolved.teacherEscalationAvailable) blockingIssues.push('teacher_escalation_not_available');

  return {
    ...resolved,
    ok: blockingIssues.length === 0,
    blockingIssues,
  };
}

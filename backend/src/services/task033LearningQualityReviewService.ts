import type { Task033LearningQualityReview } from '../contracts/task033CanaryObservationContracts';

export interface LearningQualitySignals {
  socraticGatePassed: boolean;
  noFinalAnswerPolicyWeakened: boolean;
  answerKeyExposureDetected: boolean;
  homeworkShortcutDetected: boolean;
  studentReasoningFirstPreserved: boolean;
  safeHintLadderUsed?: boolean;
  teacherEscalationAvailable?: boolean;
}

export function reviewTask033LearningQuality(signals: LearningQualitySignals): Task033LearningQualityReview {
  const blockingIssues: string[] = [];

  if (!signals.socraticGatePassed) blockingIssues.push('socratic_gate_not_passed');
  if (signals.noFinalAnswerPolicyWeakened) blockingIssues.push('no_final_answer_policy_weakened');
  if (signals.answerKeyExposureDetected) blockingIssues.push('answer_key_exposure_detected');
  if (signals.homeworkShortcutDetected) blockingIssues.push('homework_shortcut_detected');
  if (!signals.studentReasoningFirstPreserved) blockingIssues.push('student_reasoning_first_not_preserved');

  return {
    socraticGatePassed: signals.socraticGatePassed,
    noFinalAnswerPolicyWeakened: signals.noFinalAnswerPolicyWeakened,
    answerKeyExposureDetected: signals.answerKeyExposureDetected,
    homeworkShortcutDetected: signals.homeworkShortcutDetected,
    studentReasoningFirstPreserved: signals.studentReasoningFirstPreserved,
    safeHintLadderUsed: signals.safeHintLadderUsed ?? true,
    teacherEscalationAvailable: signals.teacherEscalationAvailable ?? true,
    blockingIssues,
  };
}

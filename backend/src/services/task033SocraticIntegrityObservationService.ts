import type { Task033SocraticIntegrityObservationResult } from '../contracts/task033ControlledCanaryObservationContracts';
import { task033Repository } from '../repositories/task033ControlledCanaryObservationRepository';

export async function observeTask033SocraticIntegrity(sessionId: string): Promise<Task033SocraticIntegrityObservationResult> {
  const events = await task033Repository.listEvents(sessionId);
  const blockingIssues: string[] = [];

  const socraticEvents = events.filter(e => e.gateName === 'socratic_integrity');
  const socraticPassed = socraticEvents.filter(e => e.gatePassed);

  const hintsFirstBehaviorPreserved = socraticPassed.some(e => e.eventType === 'hints_first');
  const noFinalAnswerLeakage = !socraticPassed.some(e => e.eventType === 'final_answer_leakage');
  const noAnswerBotShortcut = !socraticPassed.some(e => e.eventType === 'answer_bot_shortcut');
  const studentAttemptRequiredForPractice = socraticPassed.some(e => e.eventType === 'student_attempt_required');
  const reflectionPathPreserved = socraticPassed.some(e => e.eventType === 'reflection_path');
  const cheatingPreventionPreserved = socraticPassed.some(e => e.eventType === 'cheating_prevention');

  if (!hintsFirstBehaviorPreserved) blockingIssues.push('hints_first_behavior_not_preserved');
  if (!noFinalAnswerLeakage) blockingIssues.push('final_answer_leakage_detected');
  if (!noAnswerBotShortcut) blockingIssues.push('answer_bot_shortcut_detected');
  if (!studentAttemptRequiredForPractice) blockingIssues.push('student_attempt_not_required');
  if (!reflectionPathPreserved) blockingIssues.push('reflection_path_not_preserved');
  if (!cheatingPreventionPreserved) blockingIssues.push('cheating_prevention_not_preserved');

  const result: Task033SocraticIntegrityObservationResult = {
    ok: blockingIssues.length === 0,
    hintsFirstBehaviorPreserved,
    noFinalAnswerLeakage,
    noAnswerBotShortcut,
    studentAttemptRequiredForPractice,
    reflectionPathPreserved,
    cheatingPreventionPreserved,
    blockingIssues,
  };

  await task033Repository.recordSocraticIntegrityObservation(result);
  return result;
}

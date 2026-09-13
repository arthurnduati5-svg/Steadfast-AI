import type { Task033CrossSchoolDenialObservationResult } from '../contracts/task033ControlledCanaryObservationContracts';
import { task033Repository } from '../repositories/task033ControlledCanaryObservationRepository';

export async function observeTask033CrossSchoolDenial(sessionId: string): Promise<Task033CrossSchoolDenialObservationResult> {
  const events = await task033Repository.listEvents(sessionId);
  const blockingIssues: string[] = [];

  const crossSchoolEvents = events.filter(e => e.gateName === 'cross_school_denial');
  const crossSchoolPassed = crossSchoolEvents.filter(e => e.gatePassed);

  const crossSchoolAttemptsBlocked = !crossSchoolPassed.some(e => e.eventType === 'cross_school_attempt');
  const schoolAContextNotVisibleToSchoolB = !crossSchoolPassed.some(e => e.eventType === 'school_a_context_to_school_b');
  const noInterSchoolLearnerVisibility = !crossSchoolPassed.some(e => e.eventType === 'inter_school_learner_visibility');
  const noInterSchoolTeacherDataLeakage = !crossSchoolPassed.some(e => e.eventType === 'inter_school_teacher_data_leakage');
  const safeAuditOfCrossSchoolAttempts = crossSchoolPassed.some(e => e.eventType === 'safe_audit_cross_school_attempt');

  if (!crossSchoolAttemptsBlocked) blockingIssues.push('cross_school_attempts_not_blocked');
  if (!schoolAContextNotVisibleToSchoolB) blockingIssues.push('school_a_context_visible_to_school_b');
  if (!noInterSchoolLearnerVisibility) blockingIssues.push('inter_school_learner_visibility_detected');
  if (!noInterSchoolTeacherDataLeakage) blockingIssues.push('inter_school_teacher_data_leakage_detected');
  if (!safeAuditOfCrossSchoolAttempts) blockingIssues.push('safe_audit_of_cross_school_attempts_not_observed');

  const result: Task033CrossSchoolDenialObservationResult = {
    ok: blockingIssues.length === 0,
    crossSchoolAttemptsBlocked,
    schoolAContextNotVisibleToSchoolB,
    noInterSchoolLearnerVisibility,
    noInterSchoolTeacherDataLeakage,
    safeAuditOfCrossSchoolAttempts,
    blockingIssues,
  };

  await task033Repository.recordCrossSchoolDenialObservation(result);
  return result;
}

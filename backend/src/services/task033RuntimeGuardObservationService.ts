import type { Task033RuntimeGuardObservationResult, Task033ObservationEventRecord } from '../contracts/task033ControlledCanaryObservationContracts';
import { task033Repository } from '../repositories/task033ControlledCanaryObservationRepository';

export async function observeTask033RuntimeGuard(sessionId: string): Promise<Task033RuntimeGuardObservationResult> {
  const events = await task033Repository.listEvents(sessionId);
  const blockingIssues: string[] = [];

  const runtimeGuardEvents = events.filter(e => e.gateName === 'runtime_guard');
  const runtimeGuardPassed = runtimeGuardEvents.filter(e => e.gatePassed);

  const sessionBeforeSchoolContextBlocked = !runtimeGuardEvents.some(
    e => e.eventType === 'session_before_school_context' && e.gatePassed
  );
  const memoryAccessBeforeSchoolContextBlocked = !runtimeGuardEvents.some(
    e => e.eventType === 'memory_access_before_school_context' && e.gatePassed
  );
  const aiCallBeforeSchoolContextBlocked = !runtimeGuardEvents.some(
    e => e.eventType === 'ai_call_before_school_context' && e.gatePassed
  );
  const tutorContextBeforeApprovedCurriculumBlocked = !runtimeGuardEvents.some(
    e => e.eventType === 'tutor_context_before_approved_curriculum' && e.gatePassed
  );
  const crossSchoolAccessBlocked = !runtimeGuardEvents.some(
    e => e.eventType === 'cross_school_access' && e.gatePassed
  );
  const learnerToLearnerVisibilityBlocked = !runtimeGuardEvents.some(
    e => e.eventType === 'learner_to_learner_visibility' && e.gatePassed
  );
  const parentRawDetailExposureBlocked = !runtimeGuardEvents.some(
    e => e.eventType === 'parent_raw_detail_exposure' && e.gatePassed
  );
  const teacherOnlyLeakageBlocked = !runtimeGuardEvents.some(
    e => e.eventType === 'teacher_only_leakage' && e.gatePassed
  );
  const unsafeDeenAuthorityBlocked = !runtimeGuardEvents.some(
    e => e.eventType === 'unsafe_deen_authority' && e.gatePassed
  );
  const answerBotBehaviorBlocked = !runtimeGuardEvents.some(
    e => e.eventType === 'answer_bot_behavior' && e.gatePassed
  );

  if (!sessionBeforeSchoolContextBlocked) blockingIssues.push('session_before_school_context_not_blocked');
  if (!memoryAccessBeforeSchoolContextBlocked) blockingIssues.push('memory_access_before_school_context_not_blocked');
  if (!aiCallBeforeSchoolContextBlocked) blockingIssues.push('ai_call_before_school_context_not_blocked');
  if (!tutorContextBeforeApprovedCurriculumBlocked) blockingIssues.push('tutor_context_before_approved_curriculum_not_blocked');
  if (!crossSchoolAccessBlocked) blockingIssues.push('cross_school_access_not_blocked');
  if (!learnerToLearnerVisibilityBlocked) blockingIssues.push('learner_to_learner_visibility_not_blocked');
  if (!parentRawDetailExposureBlocked) blockingIssues.push('parent_raw_detail_exposure_not_blocked');
  if (!teacherOnlyLeakageBlocked) blockingIssues.push('teacher_only_leakage_not_blocked');
  if (!unsafeDeenAuthorityBlocked) blockingIssues.push('unsafe_deen_authority_not_blocked');
  if (!answerBotBehaviorBlocked) blockingIssues.push('answer_bot_behavior_not_blocked');

  const result: Task033RuntimeGuardObservationResult = {
    ok: blockingIssues.length === 0,
    sessionBeforeSchoolContextBlocked,
    memoryAccessBeforeSchoolContextBlocked,
    aiCallBeforeSchoolContextBlocked,
    tutorContextBeforeApprovedCurriculumBlocked,
    crossSchoolAccessBlocked,
    learnerToLearnerVisibilityBlocked,
    parentRawDetailExposureBlocked,
    teacherOnlyLeakageBlocked,
    unsafeDeenAuthorityBlocked,
    answerBotBehaviorBlocked,
    blockingIssues,
  };

  await task033Repository.recordRuntimeGuardObservation(result);
  return result;
}

import type { Task033SchoolIdentityObservationResult } from '../contracts/task033ControlledCanaryObservationContracts';
import { task033Repository } from '../repositories/task033ControlledCanaryObservationRepository';

export async function observeTask033SchoolIdentity(sessionId: string): Promise<Task033SchoolIdentityObservationResult> {
  const events = await task033Repository.listEvents(sessionId);
  const blockingIssues: string[] = [];

  const identityEvents = events.filter(e => e.gateName === 'school_identity');
  const identityPassed = identityEvents.filter(e => e.gatePassed);

  const verifiedSchoolIdentityRequired = identityPassed.some(e => e.eventType === 'verified_school_identity');
  const unknownSchoolDenied = !identityPassed.some(e => e.eventType === 'unknown_school');
  const crossSchoolAccessDenied = !identityPassed.some(e => e.eventType === 'cross_school_access');
  const actorRoleRequired = identityPassed.some(e => e.eventType === 'actor_role_checked');
  const actorRoleScoped = identityPassed.some(e => e.eventType === 'actor_role_scoped');
  const learnerSeesOwnSafeStatusOnly = identityPassed.some(e => e.eventType === 'learner_own_safe_status');
  const teacherSeesSafeClassSummaryWhereAllowed = identityPassed.some(e => e.eventType === 'teacher_safe_class_summary');
  const adminSeesSafeAggregateOnly = identityPassed.some(e => e.eventType === 'admin_safe_aggregate');

  if (!verifiedSchoolIdentityRequired) blockingIssues.push('verified_school_identity_not_required');
  if (!unknownSchoolDenied) blockingIssues.push('unknown_school_not_denied');
  if (!crossSchoolAccessDenied) blockingIssues.push('cross_school_access_not_denied');
  if (!actorRoleRequired) blockingIssues.push('actor_role_not_required');
  if (!actorRoleScoped) blockingIssues.push('actor_role_not_scoped');
  if (!learnerSeesOwnSafeStatusOnly) blockingIssues.push('learner_does_not_see_own_safe_status_only');
  if (!teacherSeesSafeClassSummaryWhereAllowed) blockingIssues.push('teacher_does_not_see_safe_class_summary');
  if (!adminSeesSafeAggregateOnly) blockingIssues.push('admin_does_not_see_safe_aggregate');

  const result: Task033SchoolIdentityObservationResult = {
    ok: blockingIssues.length === 0,
    verifiedSchoolIdentityRequired,
    unknownSchoolDenied,
    crossSchoolAccessDenied,
    actorRoleRequired,
    actorRoleScoped,
    learnerSeesOwnSafeStatusOnly,
    teacherSeesSafeClassSummaryWhereAllowed,
    adminSeesSafeAggregateOnly,
    blockingIssues,
  };

  await task033Repository.recordSchoolIdentityObservation(result);
  return result;
}

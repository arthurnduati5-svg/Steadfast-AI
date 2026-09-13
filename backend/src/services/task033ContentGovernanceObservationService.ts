import type { Task033ContentGovernanceObservationResult } from '../contracts/task033ControlledCanaryObservationContracts';
import { task033Repository } from '../repositories/task033ControlledCanaryObservationRepository';

export async function observeTask033ContentGovernance(sessionId: string): Promise<Task033ContentGovernanceObservationResult> {
  const events = await task033Repository.listEvents(sessionId);
  const blockingIssues: string[] = [];

  const governanceEvents = events.filter(e => e.gateName === 'content_governance');
  const governancePassed = governanceEvents.filter(e => e.gatePassed);

  const approvedSourceContextRequired = governancePassed.some(e => e.eventType === 'approved_source_context');
  const unapprovedSourceUsageDenied = !governancePassed.some(e => e.eventType === 'unapproved_source_usage');
  const teacherOnlySourceNotExposedToLearnerRoute = !governancePassed.some(e => e.eventType === 'teacher_only_source_exposed');
  const answerKeyContentNotExposed = !governancePassed.some(e => e.eventType === 'answer_key_content_exposed');
  const contentGapSafeReferral = governancePassed.some(e => e.eventType === 'content_gap_safe_referral');
  const noInventedTeachingClaim = !governancePassed.some(e => e.eventType === 'invented_teaching_claim');
  const curriculumScopePreserved = governancePassed.some(e => e.eventType === 'curriculum_scope');
  const sourceGovernancePolicyPreserved = governancePassed.some(e => e.eventType === 'source_governance_policy');

  if (!approvedSourceContextRequired) blockingIssues.push('approved_source_context_not_required');
  if (!unapprovedSourceUsageDenied) blockingIssues.push('unapproved_source_usage_not_denied');
  if (!teacherOnlySourceNotExposedToLearnerRoute) blockingIssues.push('teacher_only_source_exposed_to_learner');
  if (!answerKeyContentNotExposed) blockingIssues.push('answer_key_content_exposed');
  if (!contentGapSafeReferral) blockingIssues.push('content_gap_safe_referral_not_observed');
  if (!noInventedTeachingClaim) blockingIssues.push('invented_teaching_claim_detected');
  if (!curriculumScopePreserved) blockingIssues.push('curriculum_scope_not_preserved');
  if (!sourceGovernancePolicyPreserved) blockingIssues.push('source_governance_policy_not_preserved');

  const result: Task033ContentGovernanceObservationResult = {
    ok: blockingIssues.length === 0,
    approvedSourceContextRequired,
    unapprovedSourceUsageDenied,
    teacherOnlySourceNotExposedToLearnerRoute,
    answerKeyContentNotExposed,
    contentGapSafeReferral,
    noInventedTeachingClaim,
    curriculumScopePreserved,
    sourceGovernancePolicyPreserved,
    blockingIssues,
  };

  await task033Repository.recordContentGovernanceObservation(result);
  return result;
}

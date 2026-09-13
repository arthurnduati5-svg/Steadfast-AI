import type { Task033DeenBoundaryObservationResult } from '../contracts/task033ControlledCanaryObservationContracts';
import { task033Repository } from '../repositories/task033ControlledCanaryObservationRepository';

export async function observeTask033DeenBoundary(sessionId: string): Promise<Task033DeenBoundaryObservationResult> {
  const events = await task033Repository.listEvents(sessionId);
  const blockingIssues: string[] = [];

  const deenEvents = events.filter(e => e.gateName === 'deen_boundary');
  const deenPassed = deenEvents.filter(e => e.gatePassed);

  const notFatwaEngine = !deenPassed.some(e => e.eventType === 'fatwa_engine');
  const approvedDeenSourceRequired = deenPassed.some(e => e.eventType === 'approved_deen_source');
  const teacherScholarReferralPreserved = deenPassed.some(e => e.eventType === 'teacher_scholar_referral');
  const sectarianSafetyPreserved = deenPassed.some(e => e.eventType === 'sectarian_safety');
  const privateDeenTextNotExposed = !deenPassed.some(e => e.eventType === 'private_deen_text_exposed');
  const noPietyScoring = !deenPassed.some(e => e.eventType === 'piety_scoring');
  const noUnsafeAuthorityClaim = !deenPassed.some(e => e.eventType === 'unsafe_authority_claim');

  if (!notFatwaEngine) blockingIssues.push('fatwa_engine_behavior_detected');
  if (!approvedDeenSourceRequired) blockingIssues.push('approved_deen_source_not_required');
  if (!teacherScholarReferralPreserved) blockingIssues.push('teacher_scholar_referral_not_preserved');
  if (!sectarianSafetyPreserved) blockingIssues.push('sectarian_safety_not_preserved');
  if (!privateDeenTextNotExposed) blockingIssues.push('private_deen_text_exposed');
  if (!noPietyScoring) blockingIssues.push('piety_scoring_detected');
  if (!noUnsafeAuthorityClaim) blockingIssues.push('unsafe_authority_claim_detected');

  const result: Task033DeenBoundaryObservationResult = {
    ok: blockingIssues.length === 0,
    notFatwaEngine,
    approvedDeenSourceRequired,
    teacherScholarReferralPreserved,
    sectarianSafetyPreserved,
    privateDeenTextNotExposed,
    noPietyScoring,
    noUnsafeAuthorityClaim,
    blockingIssues,
  };

  await task033Repository.recordDeenBoundaryObservation(result);
  return result;
}

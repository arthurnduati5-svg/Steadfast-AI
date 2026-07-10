import type { Task034SafeRolloutReadModel, Task034RolloutGateStatus } from '../contracts/task034ControlledLimitedRolloutContracts';
import { createTask034SafeTimestamp } from '../contracts/task034ControlledLimitedRolloutContracts';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

export async function buildTask034SafeRolloutReadModel(sessionId: string): Promise<Task034SafeRolloutReadModel | null> {
  const session = await task034Repository.getRolloutSession(sessionId);
  if (!session) return null;

  const events = await task034Repository.listRolloutEventsForSession(sessionId);

  const runtimeGuard = await task034Repository.getExpandedRuntimeGuard();
  const runtimeGuardStatus: Task034RolloutGateStatus = runtimeGuard?.ok
    ? 'pass'
    : runtimeGuard && !runtimeGuard.ok
      ? 'fail'
      : 'not_checked';

  const healthBudget = await task034Repository.getHealthBudgetEscalation();
  const healthStatus: Task034RolloutGateStatus = healthBudget?.ok
    ? 'pass'
    : healthBudget && !healthBudget.ok
      ? 'fail'
      : 'not_checked';

  const incident = await task034Repository.getIncidentEscalationBridge();
  const incidentStatus: Task034RolloutGateStatus = incident?.ok
    ? 'pass'
    : incident && !incident.ok
      ? 'fail'
      : 'not_checked';

  const rollbackProtection = await task034Repository.getRollbackProtection();
  const rollbackProtectionStatus: Task034RolloutGateStatus = rollbackProtection?.ok
    ? 'pass'
    : rollbackProtection && !rollbackProtection.ok
      ? 'fail'
      : 'not_checked';

  const privacy = await task034Repository.getPrivacyReview();
  const privacyStatus: Task034RolloutGateStatus = privacy?.ok
    ? 'pass'
    : privacy && !privacy.ok
      ? 'fail'
      : 'not_checked';

  const governance = await task034Repository.getContentGovernanceReview();
  const governanceStatus: Task034RolloutGateStatus = governance?.ok
    ? 'pass'
    : governance && !governance.ok
      ? 'fail'
      : 'not_checked';

  const socratic = await task034Repository.getSocraticIntegrityReview();
  const socraticStatus: Task034RolloutGateStatus = socratic?.ok
    ? 'pass'
    : socratic && !socratic.ok
      ? 'fail'
      : 'not_checked';

  const deen = await task034Repository.getDeenBoundaryReview();
  const deenStatus: Task034RolloutGateStatus = deen?.ok
    ? 'pass'
    : deen && !deen.ok
      ? 'fail'
      : 'not_checked';

  const schoolIdentity = await task034Repository.getSchoolIdentityReview();
  const schoolIdentityStatus: Task034RolloutGateStatus = schoolIdentity?.ok
    ? 'pass'
    : schoolIdentity && !schoolIdentity.ok
      ? 'fail'
      : 'not_checked';

  const staffReadiness = await task034Repository.getStaffReadiness();
  const staffReadinessStatus: Task034RolloutGateStatus = staffReadiness?.ok
    ? 'pass'
    : staffReadiness && !staffReadiness.ok
      ? 'fail'
      : 'not_checked';

  const learnerNotice = await task034Repository.getLearnerNoticeReadiness();
  const learnerNoticeReadinessStatus: Task034RolloutGateStatus = learnerNotice?.ok
    ? 'pass'
    : learnerNotice && !learnerNotice.ok
      ? 'fail'
      : 'not_checked';

  const safeToStartTask035 =
    runtimeGuardStatus === 'pass' &&
    healthStatus === 'pass' &&
    privacyStatus === 'pass' &&
    governanceStatus === 'pass' &&
    socraticStatus === 'pass' &&
    deenStatus === 'pass' &&
    schoolIdentityStatus === 'pass' &&
    rollbackProtectionStatus === 'pass' &&
    incidentStatus === 'pass' &&
    staffReadinessStatus === 'pass' &&
    learnerNoticeReadinessStatus === 'pass';

  const safeToStartTask040 = false;

  const safeReasonCodes: string[] = [];
  if (runtimeGuardStatus === 'pass') safeReasonCodes.push('runtime_guard_passed');
  if (healthStatus === 'pass') safeReasonCodes.push('health_budget_passed');
  if (incidentStatus === 'pass') safeReasonCodes.push('incident_escalation_passed');
  if (rollbackProtectionStatus === 'pass') safeReasonCodes.push('rollback_protection_passed');
  if (privacyStatus === 'pass') safeReasonCodes.push('privacy_review_passed');
  if (governanceStatus === 'pass') safeReasonCodes.push('content_governance_passed');
  if (socraticStatus === 'pass') safeReasonCodes.push('socratic_integrity_passed');
  if (deenStatus === 'pass') safeReasonCodes.push('deen_boundary_passed');
  if (schoolIdentityStatus === 'pass') safeReasonCodes.push('school_identity_passed');
  if (staffReadinessStatus === 'pass') safeReasonCodes.push('staff_readiness_passed');
  if (learnerNoticeReadinessStatus === 'pass') safeReasonCodes.push('learner_notice_readiness_passed');

  const totalEvents = events.length;
  const allowedEventCount = events.filter(e => e.gatePassed).length;
  const deniedEventCount = totalEvents - allowedEventCount;

  const safeAggregate = {
    sessionId,
    totalEvents,
    allowedEventCount,
    deniedEventCount,
    safeDenialCount: deniedEventCount,
    privacyBoundaryPassCount: events.filter(e => e.gateName === 'privacy_boundary' && e.gatePassed).length,
    schoolIdentityPassCount: events.filter(e => e.gateName === 'school_identity' && e.gatePassed).length,
    runtimeGuardPassCount: events.filter(e => e.gateName === 'runtime_guard' && e.gatePassed).length,
    generatedAt: createTask034SafeTimestamp(),
  };

  const model: Task034SafeRolloutReadModel = {
    rolloutSessionId: session.sessionId,
    task033ObservationSessionId: session.activationId,
    activationId: session.activationId,
    schoolId: session.schoolId,
    tenantId: session.tenantId,
    cohortId: session.cohortId,
    rolloutPercent: 0,
    studentCount: 0,
    status: session.status,
    stage: session.rolloutStage,
    safeAggregate,
    healthStatus,
    privacyStatus,
    governanceStatus,
    socraticStatus,
    deenStatus,
    schoolIdentityStatus,
    incidentStatus,
    rollbackProtectionStatus,
    staffReadinessStatus,
    learnerNoticeReadinessStatus,
    safeToStartTask035,
    safeToStartTask040,
    safeReasonCodes,
    generatedAt: createTask034SafeTimestamp(),
  };

  await task034Repository.saveSafeRolloutReadModel(model);
  return model;
}

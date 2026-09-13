import type { Task033SafeReadModel, Task033ObservationGateStatus } from '../contracts/task033ControlledCanaryObservationContracts';
import { createTask033SafeTimestamp } from '../contracts/task033ControlledCanaryObservationContracts';
import { task033Repository } from '../repositories/task033ControlledCanaryObservationRepository';
import { aggregateTask033ObservationEvents } from './task033SafeAggregationService';

export async function buildTask033SafeReadModel(sessionId: string): Promise<Task033SafeReadModel | null> {
  const session = await task033Repository.getSession(sessionId);
  if (!session) return null;

  const aggregate = await aggregateTask033ObservationEvents(sessionId);

  const healthObservations = await task033Repository.listHealthObservations();
  const healthStatus: Task033ObservationGateStatus = healthObservations.some(h => h.ok)
    ? 'pass'
    : healthObservations.some(h => !h.ok)
      ? 'fail'
      : 'not_checked';

  const privacyObservations = await task033Repository.listPrivacyObservations();
  const privacyStatus: Task033ObservationGateStatus = privacyObservations.some(p => p.ok)
    ? 'pass'
    : privacyObservations.some(p => !p.ok)
      ? 'fail'
      : 'not_checked';

  const governanceObservations = await task033Repository.listContentGovernanceObservations();
  const governanceStatus: Task033ObservationGateStatus = governanceObservations.some(g => g.ok)
    ? 'pass'
    : governanceObservations.some(g => !g.ok)
      ? 'fail'
      : 'not_checked';

  const socraticObservations = await task033Repository.listSocraticIntegrityObservations();
  const socraticStatus: Task033ObservationGateStatus = socraticObservations.some(s => s.ok)
    ? 'pass'
    : socraticObservations.some(s => !s.ok)
      ? 'fail'
      : 'not_checked';

  const deenObservations = await task033Repository.listDeenBoundaryObservations();
  const deenStatus: Task033ObservationGateStatus = deenObservations.some(d => d.ok)
    ? 'pass'
    : deenObservations.some(d => !d.ok)
      ? 'fail'
      : 'not_checked';

  const identityObservations = await task033Repository.listSchoolIdentityObservations();
  const schoolIdentityStatus: Task033ObservationGateStatus = identityObservations.some(i => i.ok)
    ? 'pass'
    : identityObservations.some(i => !i.ok)
      ? 'fail'
      : 'not_checked';

  const incidentObservations = await task033Repository.listIncidentSignalObservations();
  const incidentStatus: Task033ObservationGateStatus = incidentObservations.some(i => i.ok)
    ? 'pass'
    : incidentObservations.some(i => !i.ok)
      ? 'fail'
      : 'not_checked';

  const rollbackObservations = await task033Repository.listRollbackReadinessObservations();
  const rollbackReadinessStatus: Task033ObservationGateStatus = rollbackObservations.some(r => r.ok)
    ? 'pass'
    : rollbackObservations.some(r => !r.ok)
      ? 'fail'
      : 'not_checked';

  const driftDetections = await task033Repository.listDriftDetections();
  const driftStatus: Task033ObservationGateStatus = driftDetections.some(d => d.ok)
    ? 'pass'
    : driftDetections.some(d => !d.ok)
      ? 'fail'
      : 'not_checked';

  const safeToStartTask034 = healthStatus === 'pass' && privacyStatus === 'pass' && governanceStatus === 'pass';
  const safeToStartTask035 = safeToStartTask034 && socraticStatus === 'pass' && deenStatus === 'pass' && schoolIdentityStatus === 'pass';
  const safeToStartTask040 = safeToStartTask035 && incidentStatus === 'pass' && rollbackReadinessStatus === 'pass' && driftStatus === 'pass';

  const safeReasonCodes: string[] = [];
  if (healthStatus === 'pass') safeReasonCodes.push('health_passed');
  if (privacyStatus === 'pass') safeReasonCodes.push('privacy_passed');
  if (governanceStatus === 'pass') safeReasonCodes.push('governance_passed');
  if (socraticStatus === 'pass') safeReasonCodes.push('socratic_passed');
  if (deenStatus === 'pass') safeReasonCodes.push('deen_passed');
  if (schoolIdentityStatus === 'pass') safeReasonCodes.push('school_identity_passed');
  if (incidentStatus === 'pass') safeReasonCodes.push('incident_passed');
  if (rollbackReadinessStatus === 'pass') safeReasonCodes.push('rollback_readiness_passed');
  if (driftStatus === 'pass') safeReasonCodes.push('drift_passed');

  const model: Task033SafeReadModel = {
    sessionId,
    activationId: session.activationId,
    schoolId: session.schoolId,
    status: session.status,
    observationStage: session.observationStage,
    observedEventCount: aggregate.totalObservedEvents,
    safeAggregate: aggregate,
    healthStatus,
    privacyStatus,
    governanceStatus,
    socraticStatus,
    deenStatus,
    schoolIdentityStatus,
    incidentStatus,
    rollbackReadinessStatus,
    driftStatus,
    safeToStartTask034,
    safeToStartTask035,
    safeToStartTask040,
    safeReasonCodes,
    generatedAt: createTask033SafeTimestamp(),
  };

  await task033Repository.recordSafeReadModel(model);
  return model;
}

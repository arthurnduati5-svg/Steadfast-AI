import type { Task033ObservationSafeAggregate, Task033ObservationEventRecord } from '../contracts/task033ControlledCanaryObservationContracts';
import { createTask033SafeTimestamp } from '../contracts/task033ControlledCanaryObservationContracts';
import { task033Repository } from '../repositories/task033ControlledCanaryObservationRepository';

export async function aggregateTask033ObservationEvents(sessionId: string): Promise<Task033ObservationSafeAggregate> {
  const events = await task033Repository.listEvents(sessionId);

  const totalObservedEvents = events.length;
  const allowedEventCount = events.filter(e => e.gatePassed === true).length;
  const deniedEventCount = events.filter(e => e.gatePassed === false).length;
  const safeDenialCount = events.filter(e => e.gatePassed === false && e.safeReasonCodes.length > 0).length;

  const privacyBoundaryPassCount = events.filter(e => e.gateName === 'privacy_boundary' && e.gatePassed).length;
  const privacyBoundaryFailureCount = events.filter(e => e.gateName === 'privacy_boundary' && !e.gatePassed).length;
  const schoolIdentityPassCount = events.filter(e => e.gateName === 'school_identity' && e.gatePassed).length;
  const schoolIdentityFailureCount = events.filter(e => e.gateName === 'school_identity' && !e.gatePassed).length;
  const contentGovernancePassCount = events.filter(e => e.gateName === 'content_governance' && e.gatePassed).length;
  const contentGovernanceFailureCount = events.filter(e => e.gateName === 'content_governance' && !e.gatePassed).length;
  const socraticPassCount = events.filter(e => e.gateName === 'socratic_integrity' && e.gatePassed).length;
  const socraticFailureCount = events.filter(e => e.gateName === 'socratic_integrity' && !e.gatePassed).length;
  const deenBoundaryPassCount = events.filter(e => e.gateName === 'deen_boundary' && e.gatePassed).length;
  const deenBoundaryFailureCount = events.filter(e => e.gateName === 'deen_boundary' && !e.gatePassed).length;
  const runtimeGuardPassCount = events.filter(e => e.gateName === 'runtime_guard' && e.gatePassed).length;
  const runtimeGuardFailureCount = events.filter(e => e.gateName === 'runtime_guard' && !e.gatePassed).length;
  const incidentSignalCount = events.filter(e => e.eventType === 'incident_signal').length;
  const criticalIncidentSignalCount = events.filter(e => e.eventType === 'incident_signal' && e.errorCategory === 'critical').length;
  const rollbackReadinessPassCount = events.filter(e => e.gateName === 'rollback_readiness' && e.gatePassed).length;
  const rollbackReadinessFailureCount = events.filter(e => e.gateName === 'rollback_readiness' && !e.gatePassed).length;
  const driftSignalCount = events.filter(e => e.eventType === 'drift_signal').length;
  const healthBudgetPassCount = events.filter(e => e.gateName === 'health_budget' && e.gatePassed).length;
  const healthBudgetFailureCount = events.filter(e => e.gateName === 'health_budget' && !e.gatePassed).length;

  const aggregate: Task033ObservationSafeAggregate = {
    sessionId,
    totalObservedEvents,
    allowedEventCount,
    deniedEventCount,
    safeDenialCount,
    privacyBoundaryPassCount,
    privacyBoundaryFailureCount,
    schoolIdentityPassCount,
    schoolIdentityFailureCount,
    contentGovernancePassCount,
    contentGovernanceFailureCount,
    socraticPassCount,
    socraticFailureCount,
    deenBoundaryPassCount,
    deenBoundaryFailureCount,
    runtimeGuardPassCount,
    runtimeGuardFailureCount,
    incidentSignalCount,
    criticalIncidentSignalCount,
    rollbackReadinessPassCount,
    rollbackReadinessFailureCount,
    driftSignalCount,
    healthBudgetPassCount,
    healthBudgetFailureCount,
    generatedAt: createTask033SafeTimestamp(),
  };

  await task033Repository.recordAggregate(aggregate);
  return aggregate;
}

import type { Task033ObservationSessionRecord } from '../contracts/task033ControlledCanaryObservationContracts';
import { task033Repository } from '../repositories/task033ControlledCanaryObservationRepository';
import { createTask033SafeTimestamp } from '../contracts/task033ControlledCanaryObservationContracts';

export async function startTask033Observation(sessionId: string): Promise<Task033ObservationSessionRecord> {
  const session = await task033Repository.getSession(sessionId);
  if (!session) throw new Error(`Session not found: ${sessionId}`);

  if (session.status !== 'observation_ready') {
    throw new Error(`Cannot start observation from status: ${session.status}`);
  }

  const updated: Task033ObservationSessionRecord = {
    ...session,
    status: 'observing_internal',
    observationStage: 'observing_internal',
    updatedAt: createTask033SafeTimestamp(),
    blockingIssues: session.blockingIssues.filter(b => b !== 'observation_not_started'),
  };

  await task033Repository.updateSession(sessionId, updated);
  return updated;
}

export async function pauseTask033Observation(sessionId: string): Promise<Task033ObservationSessionRecord> {
  const session = await task033Repository.getSession(sessionId);
  if (!session) throw new Error(`Session not found: ${sessionId}`);

  const validFromStatuses = ['observing_internal', 'aggregation_running', 'health_observing', 'privacy_observing', 'governance_observing', 'socratic_observing', 'deen_observing', 'identity_observing', 'incident_observing', 'drift_checking', 'rollback_readiness_checking'];

  if (!validFromStatuses.includes(session.status)) {
    throw new Error(`Cannot pause from status: ${session.status}`);
  }

  const updated: Task033ObservationSessionRecord = {
    ...session,
    status: 'paused',
    observationStage: 'paused',
    updatedAt: createTask033SafeTimestamp(),
    blockingIssues: [...session.blockingIssues],
  };

  await task033Repository.updateSession(sessionId, updated);
  return updated;
}

export async function enableTask033KillSwitch(sessionId: string): Promise<Task033ObservationSessionRecord> {
  const session = await task033Repository.getSession(sessionId);
  if (!session) throw new Error(`Session not found: ${sessionId}`);

  if (session.status !== 'observing_internal' && session.status !== 'paused') {
    throw new Error(`Cannot enable kill switch from status: ${session.status}`);
  }

  const updated: Task033ObservationSessionRecord = {
    ...session,
    status: 'kill_switch_enabled',
    observationStage: 'kill_switch_enabled',
    updatedAt: createTask033SafeTimestamp(),
    blockingIssues: [...session.blockingIssues],
  };

  await task033Repository.updateSession(sessionId, updated);
  return updated;
}

export async function requestTask033Rollback(sessionId: string): Promise<Task033ObservationSessionRecord> {
  const session = await task033Repository.getSession(sessionId);
  if (!session) throw new Error(`Session not found: ${sessionId}`);

  if (session.status !== 'observing_internal' && session.status !== 'paused') {
    throw new Error(`Cannot request rollback from status: ${session.status}`);
  }

  const updated: Task033ObservationSessionRecord = {
    ...session,
    status: 'rollback_requested',
    observationStage: 'rollback_requested',
    updatedAt: createTask033SafeTimestamp(),
    blockingIssues: [...session.blockingIssues, 'rollback_requested_by_operator'],
  };

  await task033Repository.updateSession(sessionId, updated);
  return updated;
}

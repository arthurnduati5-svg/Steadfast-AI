import {
  Task036LaunchStatus,
  Task036LiveLaunchSessionRecord,
  isTask036ValidStateTransition,
  createTask036SafeId,
  createTask036SafeTimestamp,
} from '../contracts/task036LiveSchoolLaunchContracts';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';

export async function initializeSession(
  schoolId: string,
  tenantId: string,
  operatorId: string
): Promise<Task036LiveLaunchSessionRecord> {
  const now = createTask036SafeTimestamp();
  const session: Task036LiveLaunchSessionRecord = {
    sessionId: createTask036SafeId(),
    schoolId,
    tenantId,
    status: 'created',
    launchWindowId: '',
    approvalId: '',
    operatorId,
    createdAt: now,
    updatedAt: now,
    blockingIssues: [],
  };

  task036Repository.saveLaunchSession(session);
  return session;
}

export async function transitionState(
  sessionId: string,
  from: Task036LaunchStatus,
  to: Task036LaunchStatus
): Promise<{ ok: boolean; session: Task036LiveLaunchSessionRecord | null; blockingIssues: string[] }> {
  const blockingIssues: string[] = [];
  const session = task036Repository.getLaunchSession(sessionId);

  if (!session) {
    blockingIssues.push('session_not_found');
    return { ok: false, session: null, blockingIssues };
  }

  if (session.status !== from) {
    blockingIssues.push(`status_mismatch: expected_${from}_got_${session.status}`);
    return { ok: false, session: null, blockingIssues };
  }

  if (!isTask036ValidStateTransition(from, to)) {
    blockingIssues.push(`invalid_transition_from_${from}_to_${to}`);
    return { ok: false, session: null, blockingIssues };
  }

  const updatedSession: Task036LiveLaunchSessionRecord = {
    ...session,
    status: to,
    updatedAt: createTask036SafeTimestamp(),
    blockingIssues: session.blockingIssues,
  };

  task036Repository.saveLaunchSession(updatedSession);
  return { ok: true, session: updatedSession, blockingIssues: [] };
}

export async function getCurrentState(
  sessionId: string
): Promise<Task036LiveLaunchSessionRecord | null> {
  return task036Repository.getLaunchSession(sessionId) || null;
}

export function createSession(input: Record<string, unknown>): Task036LiveLaunchSessionRecord {
  const now = createTask036SafeTimestamp();
  const session: Task036LiveLaunchSessionRecord = {
    sessionId: createTask036SafeId(),
    schoolId: (input.schoolId as string) || '',
    tenantId: (input.tenantId as string) || '',
    status: 'created',
    launchWindowId: (input.launchWindowId as string) || '',
    approvalId: (input.approvalId as string) || '',
    operatorId: (input.operatorId as string) || '',
    createdAt: now,
    updatedAt: now,
    blockingIssues: [],
  };
  task036Repository.saveLaunchSession(session);
  return session;
}

export function getSession(sessionId: string): Task036LiveLaunchSessionRecord | undefined {
  return task036Repository.getLaunchSession(sessionId);
}

export function getSessionView(sessionId: string): Task036LiveLaunchSessionRecord | null {
  return task036Repository.getLaunchSession(sessionId) || null;
}

import {
  Task036PauseControlResult,
  createTask036SafeTimestamp,
} from '../contracts/task036LiveSchoolLaunchContracts';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';

export async function pauseLaunch(
  sessionId: string,
  pauseReasonCodes: string[]
): Promise<Task036PauseControlResult> {
  const blockingIssues: string[] = [];
  const session = task036Repository.getLaunchSession(sessionId);

  if (!session) {
    blockingIssues.push('session_not_found');
    return {
      ok: false,
      paused: false,
      pauseReasonCodes,
      sessionId,
      pausedAt: '',
      auditPreserved: false,
      externalNotificationSent: false,
      productionMutated: false,
      blockingIssues,
    };
  }

  const now = createTask036SafeTimestamp();

  const result: Task036PauseControlResult = {
    ok: true,
    paused: true,
    pauseReasonCodes,
    sessionId,
    pausedAt: now,
    auditPreserved: true,
    externalNotificationSent: false,
    productionMutated: false,
    blockingIssues: [],
  };

  task036Repository.savePauseControl(sessionId, result);
  return result;
}

export function executePause(sessionId: string): Task036PauseControlResult {
  const session = task036Repository.getLaunchSession(sessionId);
  if (!session) {
    return { ok: false, paused: false, pauseReasonCodes: ['session_not_found'], sessionId, pausedAt: '', auditPreserved: false, externalNotificationSent: false, productionMutated: false, blockingIssues: ['session_not_found'] };
  }
  return { ok: true, paused: true, pauseReasonCodes: ['operator_initiated_pause'], sessionId, pausedAt: createTask036SafeTimestamp(), auditPreserved: true, externalNotificationSent: false, productionMutated: false, blockingIssues: [] };
}

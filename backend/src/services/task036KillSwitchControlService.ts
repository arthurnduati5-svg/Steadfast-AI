import {
  Task036KillSwitchControlResult,
  createTask036SafeTimestamp,
} from '../contracts/task036LiveSchoolLaunchContracts';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';

export async function enableKillSwitch(
  sessionId: string,
  killSwitchReasonCodes: string[]
): Promise<Task036KillSwitchControlResult> {
  const blockingIssues: string[] = [];
  const session = task036Repository.getLaunchSession(sessionId);

  if (!session) {
    blockingIssues.push('session_not_found');
    return {
      ok: false,
      killSwitchEnabled: false,
      killSwitchReasonCodes,
      sessionId,
      killSwitchEnabledAt: '',
      auditPreserved: false,
      dataDeleted: false,
      externalServicesCalled: false,
      blockingIssues,
    };
  }

  const now = createTask036SafeTimestamp();

  const result: Task036KillSwitchControlResult = {
    ok: true,
    killSwitchEnabled: true,
    killSwitchReasonCodes,
    sessionId,
    killSwitchEnabledAt: now,
    auditPreserved: true,
    dataDeleted: false,
    externalServicesCalled: false,
    blockingIssues: [],
  };

  task036Repository.saveKillSwitchControl(sessionId, result);
  return result;
}

export function executeKillSwitch(sessionId: string): Task036KillSwitchControlResult {
  const session = task036Repository.getLaunchSession(sessionId);
  if (!session) {
    return { ok: false, killSwitchEnabled: false, killSwitchReasonCodes: ['session_not_found'], sessionId, killSwitchEnabledAt: '', auditPreserved: false, dataDeleted: false, externalServicesCalled: false, blockingIssues: ['session_not_found'] };
  }
  return { ok: true, killSwitchEnabled: true, killSwitchReasonCodes: ['operator_initiated_kill_switch'], sessionId, killSwitchEnabledAt: createTask036SafeTimestamp(), auditPreserved: true, dataDeleted: false, externalServicesCalled: false, blockingIssues: [] };
}

import {
  Task036RollbackControlResult,
  createTask036SafeTimestamp,
} from '../contracts/task036LiveSchoolLaunchContracts';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';

export async function requestRollback(
  sessionId: string,
  rollbackReasonCodes: string[]
): Promise<Task036RollbackControlResult> {
  const blockingIssues: string[] = [];
  const session = task036Repository.getLaunchSession(sessionId);

  if (!session) {
    blockingIssues.push('session_not_found');
    return {
      ok: false,
      rollbackRequested: false,
      rollbackReasonCodes,
      sessionId,
      rollbackRequestedAt: '',
      auditPreserved: false,
      destructiveDatabaseCommandsRun: false,
      deploymentPerformed: false,
      externalServicesCalled: false,
      blockingIssues,
    };
  }

  const now = createTask036SafeTimestamp();

  const result: Task036RollbackControlResult = {
    ok: true,
    rollbackRequested: true,
    rollbackReasonCodes,
    sessionId,
    rollbackRequestedAt: now,
    auditPreserved: true,
    destructiveDatabaseCommandsRun: false,
    deploymentPerformed: false,
    externalServicesCalled: false,
    blockingIssues: [],
  };

  task036Repository.saveRollbackControl(sessionId, result);
  return result;
}

export function executeRollback(sessionId: string): Task036RollbackControlResult {
  const session = task036Repository.getLaunchSession(sessionId);
  if (!session) {
    return { ok: false, rollbackRequested: false, rollbackReasonCodes: ['session_not_found'], sessionId, rollbackRequestedAt: '', auditPreserved: false, destructiveDatabaseCommandsRun: false, deploymentPerformed: false, externalServicesCalled: false, blockingIssues: ['session_not_found'] };
  }
  return { ok: true, rollbackRequested: true, rollbackReasonCodes: ['operator_initiated_rollback'], sessionId, rollbackRequestedAt: createTask036SafeTimestamp(), auditPreserved: true, destructiveDatabaseCommandsRun: false, deploymentPerformed: false, externalServicesCalled: false, blockingIssues: [] };
}

import type { Task029ControlActionInput, Task029ControlActionResult } from '../contracts/task029ExpansionOperationsContracts';
import { task029ExpansionOperationsRepository } from '../repositories/task029ExpansionOperationsRepository';
import { runControlActionPreflight } from './task029ControlActionPreflightService';
import { pauseExpansion, resumeExpansion, requestIntervention, enableKillSwitch } from './task028ExpansionInterventionService';
import { executeRollback } from './task028ExpansionRollbackExecutionService';

export async function executeControlAction(
  input: Task029ControlActionInput,
): Promise<Task029ControlActionResult> {
  const preflight = await runControlActionPreflight({
    schoolId: input.schoolId,
    actorId: input.actorId,
    actorRole: input.actorRole,
    expansionRunId: input.expansionRunId,
    action: input.action,
  });

  if (!preflight.ok || !preflight.checksPassed) {
    const result: Task029ControlActionResult = {
      ok: false,
      action: input.action,
      status: 'preflight_blocked',
      safeMessage: `Preflight failed: ${preflight.blockingIssues.join(', ')}`,
      reasonCodes: preflight.blockingIssues,
    };
    await task029ExpansionOperationsRepository.recordControlActionResult(result);
    return result;
  }

  let serviceResult: { ok: boolean; reasonCodes: string[]; safeMessage: string };

  try {
    switch (input.action) {
      case 'pause_expansion': {
        const r = await pauseExpansion(input.expansionRunId, input.actorRole, input.actorId, input.reason);
        serviceResult = { ok: r.ok, reasonCodes: r.reasonCodes, safeMessage: r.safeMessage };
        break;
      }
      case 'resume_expansion': {
        const r = await resumeExpansion(input.expansionRunId, input.actorRole, input.actorId, input.reason);
        serviceResult = { ok: r.ok, reasonCodes: r.reasonCodes, safeMessage: r.safeMessage };
        break;
      }
      case 'request_intervention': {
        const r = await requestIntervention(input.expansionRunId, 'pause_execution', input.actorRole, input.actorId, input.reason, input.reason);
        serviceResult = { ok: r.ok, reasonCodes: r.reasonCodes, safeMessage: r.safeMessage };
        break;
      }
      case 'execute_kill_switch': {
        const r = await enableKillSwitch(input.expansionRunId, input.actorRole, input.actorId, input.reason);
        serviceResult = { ok: r.ok, reasonCodes: r.reasonCodes, safeMessage: r.safeMessage };
        break;
      }
      case 'request_rollback': {
        const r = await executeRollback(input.expansionRunId, input.actorRole, input.actorId, input.reason, input.reason);
        serviceResult = { ok: r.ok, reasonCodes: r.reasonCodes, safeMessage: r.safeMessage };
        break;
      }
      default: {
        serviceResult = { ok: false, reasonCodes: ['unknown_action'], safeMessage: `Unknown action: ${input.action}` };
      }
    }
  } catch (err: any) {
    serviceResult = { ok: false, reasonCodes: ['service_error'], safeMessage: err?.message ?? 'Service error during action execution.' };
  }

  const result: Task029ControlActionResult = {
    ok: serviceResult.ok,
    action: input.action,
    status: serviceResult.ok ? 'executed' : 'failed',
    safeMessage: serviceResult.safeMessage,
    reasonCodes: serviceResult.reasonCodes,
  };

  await task029ExpansionOperationsRepository.recordControlActionResult(result);

  return result;
}

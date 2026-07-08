import type { Task029RollbackCommandInput, Task029RollbackCommandResult } from '../contracts/task029ExpansionOperationsContracts';
import { resolveExpansionOpsRole, getRolePermissionsList } from '../contracts/task029ExpansionOperationsContracts';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import { task029ExpansionOperationsRepository } from '../repositories/task029ExpansionOperationsRepository';
import { loadTask027Proof } from './task028Task027ProofLoaderService';
import { executeRollback } from './task028ExpansionRollbackExecutionService';
import { runControlActionPreflight } from './task029ControlActionPreflightService';

export async function executeRollbackCommand(
  input: Task029RollbackCommandInput,
): Promise<Task029RollbackCommandResult> {
  const reasonCodes: string[] = [];

  const role = resolveExpansionOpsRole(input.actorRole);
  const permissions = getRolePermissionsList(role);
  const authorized = permissions.includes('request_rollback');
  if (!authorized) {
    return {
      ok: false, rollbackId: '', status: 'denied',
      expandedAccessBlocked: false, auditPreserved: false,
      dataDestructivelyDeleted: false,
      safeMessage: 'Actor not authorized for rollback.',
      reasonCodes: ['actor_not_authorized'],
    };
  }

  const schoolVerified = !!(input.schoolId && input.schoolId.trim());
  if (!schoolVerified) {
    return {
      ok: false, rollbackId: '', status: 'denied',
      expandedAccessBlocked: false, auditPreserved: false,
      dataDestructivelyDeleted: false,
      safeMessage: 'School context not verified.',
      reasonCodes: ['school_context_missing'],
    };
  }

  let task028ProofAccepted = false;
  try {
    const proof = await loadTask027Proof();
    task028ProofAccepted = proof.safeToExecuteExpansion;
    if (!task028ProofAccepted) reasonCodes.push(...proof.blockingIssues.map(b => `task028_proof:${b}`));
  } catch {
    reasonCodes.push('task028_proof_load_failed');
  }

  if (!task028ProofAccepted) {
    return {
      ok: false, rollbackId: '', status: 'denied',
      expandedAccessBlocked: false, auditPreserved: false,
      dataDestructivelyDeleted: false,
      safeMessage: 'Task 028 proof not accepted.',
      reasonCodes,
    };
  }

  const run = await task028ExpansionExecutionRepository.getExecutionRun(input.expansionRunId);
  if (!run) {
    return {
      ok: false, rollbackId: '', status: 'denied',
      expandedAccessBlocked: false, auditPreserved: false,
      dataDestructivelyDeleted: false,
      safeMessage: 'Expansion run not found.',
      reasonCodes: ['expansion_run_not_found'],
    };
  }

  const runAny = run as any;
  if (runAny.schoolId !== input.schoolId) {
    return {
      ok: false, rollbackId: '', status: 'denied',
      expandedAccessBlocked: false, auditPreserved: false,
      dataDestructivelyDeleted: false,
      safeMessage: 'Cross-school access denied.',
      reasonCodes: ['cross_school_access_denied'],
    };
  }

  const preflight = await runControlActionPreflight({
    schoolId: input.schoolId,
    actorId: input.actorId,
    actorRole: input.actorRole,
    expansionRunId: input.expansionRunId,
    action: 'request_rollback',
  });

  if (!preflight.rollbackReadiness) {
    return {
      ok: false, rollbackId: '', status: 'blocked',
      expandedAccessBlocked: false, auditPreserved: false,
      dataDestructivelyDeleted: false,
      safeMessage: 'Rollback preflight failed: rollback not ready.',
      reasonCodes: ['rollback_not_ready'],
    };
  }

  const rollbackResult = await executeRollback(
    input.expansionRunId,
    input.actorRole,
    input.actorId,
    input.rollbackReason,
    input.rollbackReason,
  );

  const result: Task029RollbackCommandResult = {
    ok: rollbackResult.ok,
    rollbackId: rollbackResult.rollbackId ?? '',
    status: rollbackResult.ok ? 'completed' : 'failed',
    expandedAccessBlocked: rollbackResult.studentAccessBlocked,
    auditPreserved: rollbackResult.auditPreserved,
    dataDestructivelyDeleted: false,
    safeMessage: rollbackResult.safeMessage,
    reasonCodes: rollbackResult.reasonCodes,
  };

  await task029ExpansionOperationsRepository.recordRollbackCommandResult(result);

  return result;
}

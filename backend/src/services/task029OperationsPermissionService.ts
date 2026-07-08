import { resolveExpansionOpsRole, getRolePermissionsList } from '../contracts/task029ExpansionOperationsContracts';
import type { Task029OperationsPermissionInput, Task029OperationsPermissionResult } from '../contracts/task029ExpansionOperationsContracts';
import { task029ExpansionOperationsRepository } from '../repositories/task029ExpansionOperationsRepository';

export async function resolveOperationsPermissions(input: Task029OperationsPermissionInput): Promise<Task029OperationsPermissionResult> {
  const blockingIssues: string[] = [];

  if (!input.schoolId || !input.schoolId.trim()) {
    blockingIssues.push('school_context_missing');
  }

  if (!input.actorId || !input.actorId.trim()) {
    blockingIssues.push('actor_id_missing');
  }

  const role = resolveExpansionOpsRole(input.actorRole);
  const permissions = getRolePermissionsList(role);

  if (role === 'unknown') {
    blockingIssues.push('role_denied');
  }

  const ok = blockingIssues.length === 0;
  const result: Task029OperationsPermissionResult = {
    ok,
    role,
    permissions: ok ? permissions : [],
    blockingIssues,
  };

  await task029ExpansionOperationsRepository.recordPermissionDecision(result);

  return result;
}

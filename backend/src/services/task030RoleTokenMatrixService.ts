import type {
  Task030RoleTokenMatrix,
  Task030RoleToken,
  Task030SyntheticRole,
} from '../contracts/task030ControlledStagingRehearsalContracts';
import {
  TASK030_SYNTHETIC_ROLES,
  getTask030SyntheticPermissions,
  createTask030SafeId,
} from '../contracts/task030ControlledStagingRehearsalContracts';
import { validateTask030RoleTokenMatrix } from '../lib/task030ControlledStagingRehearsalValidation';
import { task030ControlledStagingRehearsalRepository } from '../repositories/task030ControlledStagingRehearsalRepository';

export async function createTask030RoleTokenMatrix(
  input: { matrixId?: string },
): Promise<Task030RoleTokenMatrix> {
  const matrixId = input.matrixId || createTask030SafeId('matrix', Date.now().toString());
  const tokens: Task030RoleToken[] = [];

  for (const role of TASK030_SYNTHETIC_ROLES) {
    const actorIdSeed = `${matrixId}_${role}`;
    const token: Task030RoleToken = {
      syntheticRole: role,
      token: `task030_synthetic_token_${role}_${Math.abs(
        Array.from(actorIdSeed).reduce((acc, c) => ((acc << 5) - acc) + c.charCodeAt(0), 0) % 1000000,
      ).toString().padStart(6, '0')}`,
      actorIdHash: createTask030SafeId(`actor_${role}`, matrixId),
      permissions: getTask030SyntheticPermissions(role),
    };
    tokens.push(token);
  }

  const matrix: Task030RoleTokenMatrix = {
    matrixId,
    tokens,
    createdAt: new Date().toISOString(),
  };

  const validation = validateTask030RoleTokenMatrix(matrix);
  if (!validation.ok) {
    throw new Error(`Role token matrix validation failed: ${validation.errors.join(', ')}`);
  }

  await task030ControlledStagingRehearsalRepository.recordRoleTokenMatrix(matrix);

  return matrix;
}

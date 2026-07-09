import { describe, it, expect, beforeEach } from 'vitest';
import { createTask030RoleTokenMatrix } from '../services/task030RoleTokenMatrixService';
import { task030ControlledStagingRehearsalRepository } from '../repositories/task030ControlledStagingRehearsalRepository';

describe('Task 030 - Role Token Matrix', () => {
  beforeEach(async () => {
    await task030ControlledStagingRehearsalRepository.clearTask030StoresForTests();
  });

  it('should create a matrix with a matrixId', async () => {
    const matrix = await createTask030RoleTokenMatrix({});
    expect(matrix.matrixId).toBeDefined();
    expect(matrix.matrixId).toMatch(/^synthetic_matrix_/);
  });

  it('should have 5 tokens (one per synthetic role)', async () => {
    const matrix = await createTask030RoleTokenMatrix({});
    expect(matrix.tokens).toHaveLength(5);
  });

  it('should include synthetic_admin token', async () => {
    const matrix = await createTask030RoleTokenMatrix({});
    const adminToken = matrix.tokens.find(t => t.syntheticRole === 'synthetic_admin');
    expect(adminToken).toBeDefined();
  });

  it('should include synthetic_operator token', async () => {
    const matrix = await createTask030RoleTokenMatrix({});
    const opToken = matrix.tokens.find(t => t.syntheticRole === 'synthetic_operator');
    expect(opToken).toBeDefined();
  });

  it('should include unknown_role token', async () => {
    const matrix = await createTask030RoleTokenMatrix({});
    const unknownToken = matrix.tokens.find(t => t.syntheticRole === 'unknown_role');
    expect(unknownToken).toBeDefined();
  });

  it('should have correct admin permissions', async () => {
    const matrix = await createTask030RoleTokenMatrix({});
    const adminToken = matrix.tokens.find(t => t.syntheticRole === 'synthetic_admin')!;
    expect(adminToken.permissions.canViewConsole).toBe(true);
    expect(adminToken.permissions.canTriggerControlActions).toBe(true);
    expect(adminToken.permissions.canRunRollbackDrill).toBe(true);
  });

  it('should have correct learner restrictions', async () => {
    const matrix = await createTask030RoleTokenMatrix({});
    const learnerToken = matrix.tokens.find(t => t.syntheticRole === 'synthetic_learner')!;
    expect(learnerToken.permissions.canViewConsole).toBe(false);
    expect(learnerToken.permissions.canTriggerControlActions).toBe(false);
    expect(learnerToken.permissions.canGenerateReport).toBe(false);
  });

  it('should have correct unknown role restrictions', async () => {
    const matrix = await createTask030RoleTokenMatrix({});
    const unknownToken = matrix.tokens.find(t => t.syntheticRole === 'unknown_role')!;
    expect(unknownToken.permissions.canViewConsole).toBe(false);
    expect(unknownToken.permissions.canTriggerControlActions).toBe(false);
  });

  it('should have token with task030_synthetic_token_ prefix', async () => {
    const matrix = await createTask030RoleTokenMatrix({});
    matrix.tokens.forEach(t => {
      expect(t.token).toMatch(/^task030_synthetic_token_/);
    });
  });

  it('should have actorIdHash for each token', async () => {
    const matrix = await createTask030RoleTokenMatrix({});
    matrix.tokens.forEach(t => {
      expect(t.actorIdHash).toMatch(/^synthetic_actor_/);
    });
  });

  it('should persist in repository', async () => {
    const matrix = await createTask030RoleTokenMatrix({});
    const stored = await task030ControlledStagingRehearsalRepository.getRoleTokenMatrix(matrix.matrixId);
    expect(stored).not.toBeNull();
  });

  it('should use provided matrixId if given', async () => {
    const matrix = await createTask030RoleTokenMatrix({ matrixId: 'custom_id' });
    expect(matrix.matrixId).toBe('custom_id');
  });

  it('should have createdAt as ISO string', async () => {
    const matrix = await createTask030RoleTokenMatrix({});
    expect(() => new Date(matrix.createdAt)).not.toThrow();
  });
});

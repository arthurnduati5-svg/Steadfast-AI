import { describe, it, expect } from 'vitest';
import { generateTask031RoleMatrix, checkTask031RoleAccess, verifyTask031RoleDenial } from '../services/task031StagingRoleMatrixService';

describe('Task 031 - POST /role-matrix contract', () => {
  it('should return ok with all roles checked', () => {
    const matrix = generateTask031RoleMatrix();
    expect(matrix.ok).toBe(true);
    expect(matrix.rolesChecked).toContain('admin');
    expect(matrix.rolesChecked).toContain('operator');
    expect(matrix.rolesChecked).toContain('teacher');
    expect(matrix.rolesChecked).toContain('student');
    expect(matrix.rolesChecked).toContain('unknown');
  });

  it('should verify admin has correct permissions', () => {
    const matrix = generateTask031RoleMatrix();
    expect(matrix.adminPermissionsCorrect).toBe(true);
    expect(matrix.operatorPermissionsCorrect).toBe(true);
  });

  it('should confirm role fixtures generated', () => {
    const matrix = generateTask031RoleMatrix();
    expect(matrix.roleFixturesGenerated).toBe(true);
    expect(matrix.blockingIssues).toHaveLength(0);
  });

  it('should verify admin can run staging smoke', () => {
    const canRun = checkTask031RoleAccess('admin', 'canRunStagingSmoke');
    expect(canRun).toBe(true);
  });

  it('should deny teacher from running staging smoke', () => {
    const denied = verifyTask031RoleDenial('teacher', 'canRunStagingSmoke');
    expect(denied).toBe(true);
  });
});

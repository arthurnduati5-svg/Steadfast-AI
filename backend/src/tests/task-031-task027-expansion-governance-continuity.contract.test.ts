import { describe, it, expect } from 'vitest';
import { getRolePermissions031 } from '../contracts/task031StagingSmokeCanaryReadinessContracts';
import { generateTask031Report } from '../services/task031ReportService';

describe('Task 031 - Task 027 Expansion Governance Continuity Contract', () => {
  it('should restrict teacher from running staging smoke for expansion', () => {
    const teacherPerms = getRolePermissions031('teacher');
    expect(teacherPerms.canRunStagingSmoke).toBe(false);
  });

  it('should restrict teacher from viewing canary readiness for expansion', () => {
    const teacherPerms = getRolePermissions031('teacher');
    expect(teacherPerms.canViewCanaryReadinessReport).toBe(false);
  });

  it('should restrict student from running staging smoke for expansion', () => {
    const studentPerms = getRolePermissions031('student');
    expect(studentPerms.canRunStagingSmoke).toBe(false);
  });

  it('should report roleMatrixPassed as true in report for expansion continuity', async () => {
    const report = await generateTask031Report({});
    expect(report.roleMatrixPassed).toBe(true);
  });
});

import { describe, it, expect } from 'vitest';
import { getRolePermissions031, resolveStagingRole031 } from '../contracts/task031StagingSmokeCanaryReadinessContracts';
import { runTask031BackendRouteSmoke } from '../services/task031BackendRouteSmokeService';
import { generateTask031Report } from '../services/task031ReportService';

describe('Task 031 - Task 020 Governance Continuity Contract', () => {
  it('should have admin role with canRunStagingSmoke permission', () => {
    const adminPerms = getRolePermissions031('admin');
    expect(adminPerms.canRunStagingSmoke).toBe(true);
  });

  it('should have admin role with canViewObservabilityBaseline permission', () => {
    const adminPerms = getRolePermissions031('admin');
    expect(adminPerms.canViewObservabilityBaseline).toBe(true);
  });

  it('should have admin role with canViewCanaryReadinessReport permission', () => {
    const adminPerms = getRolePermissions031('admin');
    expect(adminPerms.canViewCanaryReadinessReport).toBe(true);
  });

  it('should have admin role with canTriggerStagingFailureDrill permission', () => {
    const adminPerms = getRolePermissions031('admin');
    expect(adminPerms.canTriggerStagingFailureDrill).toBe(true);
  });

  it('should resolve admin string to admin role', () => {
    const role = resolveStagingRole031('admin');
    expect(role).toBe('admin');
  });

  it('should include governance route in backend route smoke check', async () => {
    const result = await runTask031BackendRouteSmoke({});
    expect(result.taskRoutesChecked).toBeGreaterThanOrEqual(1);
    expect(result.ok).toBe(true);
  });
});

import { describe, it, expect } from 'vitest';
import { generateTask031Report } from '../services/task031ReportService';
import { getRolePermissions031, resolveStagingRole031 } from '../contracts/task031StagingSmokeCanaryReadinessContracts';
import { validateTask031StagingEnvironmentGateInput } from '../lib/task031StagingSmokeCanaryReadinessValidation';

describe('Task 031 - No Phase 3 Regression Contract', () => {
  it('should not introduce any production deployment from task 031 changes', async () => {
    const report = await generateTask031Report({});
    expect(report.productionDeploymentIntroduced).toBe(false);
  });

  it('should preserve admin role permissions from Phase 2', () => {
    const adminPerms = getRolePermissions031('admin');
    expect(adminPerms.canRunStagingSmoke).toBe(true);
    expect(adminPerms.canViewObservabilityBaseline).toBe(true);
  });

  it('should preserve student role restrictions from Phase 2', () => {
    const studentPerms = getRolePermissions031('student');
    expect(studentPerms.canRunStagingSmoke).toBe(false);
    expect(studentPerms.canViewCanaryReadinessReport).toBe(false);
  });

  it('should reject environment gate input with production mode', () => {
    const result = validateTask031StagingEnvironmentGateInput({
      environmentType: 'production',
    });
    expect(result.valid).toBe(false);
    expect(result.reasonCodes).toContain('forbidden_environment_type_production');
  });
});

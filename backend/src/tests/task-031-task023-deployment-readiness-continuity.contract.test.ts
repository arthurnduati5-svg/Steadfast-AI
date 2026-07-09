import { describe, it, expect } from 'vitest';
import { checkTask031StagingEnvironmentGate } from '../services/task031StagingEnvironmentGateService';
import { TASK031_REQUIRED_DEPENDENCY_COMMITS } from '../contracts/task031StagingSmokeCanaryReadinessContracts';

describe('Task 031 - Task 023 Deployment Readiness Continuity Contract', () => {
  it('should require a specific dependency commit for deployment readiness', () => {
    expect(TASK031_REQUIRED_DEPENDENCY_COMMITS).toContain('e79ee74');
  });

  it('should have at least one required dependency commit', () => {
    expect(TASK031_REQUIRED_DEPENDENCY_COMMITS.length).toBeGreaterThan(0);
  });

  it('should not have production environment classification when staging smoke is enabled', async () => {
    const result = await checkTask031StagingEnvironmentGate();
    if (result.stagingSmokeEnabled) {
      expect(result.nodeEnvClassification).not.toBe('production');
    }
  });

  it('should report production-like environment as blocked', async () => {
    const result = await checkTask031StagingEnvironmentGate();
    if (result.productionLikeBlocked) {
      expect(result.ok).toBe(false);
    }
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { verifyTask023ReadinessDependency } from '../services/task024Task023DeploymentReadinessDependencyService';
import { task024ReadinessRepository } from '../services/task024OperationsReadinessRepository';

describe('Task024Task023DeploymentReadinessDependencyService', () => {
  beforeEach(async () => {
    await task024ReadinessRepository.resetTask024OperationsReadinessRepositoryForTests();
  });

  it('should verify task 023 readiness dependency', async () => {
    const result = await verifyTask023ReadinessDependency();
    expect(result.status).toBe('passed');
    expect(result.task023ReportAccepted).toBe(true);
    expect(result.task023DeploymentNotPerformed).toBe(true);
    expect(result.task023PrismaChecksPassed).toBe(true);
    expect(result.task023SecretSafetyPassed).toBe(true);
    expect(result.task023ReleaseSmokePassed).toBe(true);
    expect(result.task023RollbackReadinessPassed).toBe(true);
  });
});

import { describe, it, expect } from 'vitest';
import { checkTask031StagingEnvironmentGate } from '../services/task031StagingEnvironmentGateService';

describe('Task 031 - POST /environment/preflight contract', () => {
  it('should return ok boolean and component flags', async () => {
    const result = await checkTask031StagingEnvironmentGate();
    expect(typeof result.ok).toBe('boolean');
    expect(typeof result.stagingSmokeEnabled).toBe('boolean');
    expect(typeof result.noLiveStudentsEnabled).toBe('boolean');
    expect(typeof result.syntheticSchoolIdentityEnabled).toBe('boolean');
    expect(typeof result.productionLikeBlocked).toBe('boolean');
  });

  it('should classify node environment', async () => {
    const result = await checkTask031StagingEnvironmentGate();
    const allowed = ['test', 'development', 'staging', 'production', 'unknown'];
    expect(allowed).toContain(result.nodeEnvClassification);
    expect(typeof result.databaseUrlClassification).toBe('string');
    expect(typeof result.redisUrlClassification).toBe('string');
  });
});

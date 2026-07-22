import { describe, it, expect } from 'vitest';
import { checkBackendSrcFileExists } from '../test-utils/repositoryPaths';

describe('Phase3ConfidenceRecoveryRoutes Contract', () => {
  it('exports default router', async () => {
    const mod = await import('../routes/phase3ConfidenceRecoveryRoutes');
    expect(mod.default).toBeDefined();
  });

  it('route file exists at expected path', () => {
    expect(checkBackendSrcFileExists('routes/phase3ConfidenceRecoveryRoutes.ts')).toBe(true);
  });
});

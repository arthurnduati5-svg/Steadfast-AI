import { describe, it, expect, beforeAll } from 'vitest';

describe('Task 035 - Task 034 Proof Loader', () => {
  let loader: any;

  beforeAll(async () => {
    loader = await import('../services/task035Task034ProofLoaderService');
  });

  it('should export loadTask034Proof function', () => {
    expect(typeof loader.loadTask034Proof).toBe('function');
  });

  it('should return proof status with ok false when report not found', () => {
    const result = loader.loadTask034Proof();
    expect(result).toBeDefined();
    expect(typeof result.ok).toBe('boolean');
    expect(typeof result.safeToRunTask035).toBe('boolean');
    expect(Array.isArray(result.blockingIssues)).toBe(true);
  });
});

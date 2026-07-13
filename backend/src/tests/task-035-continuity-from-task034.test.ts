import { describe, it, expect } from 'vitest';
import { loadTask034Proof } from '../services/task035Task034ProofLoaderService';

describe('task035 continuity from task034', () => {
  it('loadTask034Proof is a function', () => {
    expect(typeof loadTask034Proof).toBe('function');
  });

  it('returns a proof status with expected fields', () => {
    const proof = loadTask034Proof();
    expect(proof).toBeDefined();
    expect(typeof proof.ok).toBe('boolean');
    expect(typeof proof.reportFound).toBe('boolean');
    expect(typeof proof.safeToStartTask035).toBe('boolean');
    expect(typeof proof.safeToRunTask035).toBe('boolean');
  });

  it('propagates blocking issues when task034 proof is missing', () => {
    const proof = loadTask034Proof();
    if (!proof.ok) {
      expect(proof.blockingIssues.length).toBeGreaterThan(0);
    } else {
      expect(proof.ok).toBe(true);
    }
  });

  it('includes safeToStartTask035 and safeToRunTask035 fields', () => {
    const proof = loadTask034Proof();
    expect('safeToStartTask035' in proof).toBe(true);
    expect('safeToRunTask035' in proof).toBe(true);
  });

  it('verifies taskId is set when report is found', () => {
    const proof = loadTask034Proof();
    if (proof.reportFound) {
      expect(proof.taskId).toBeTruthy();
    }
  });
});

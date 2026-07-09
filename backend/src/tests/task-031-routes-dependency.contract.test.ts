import { describe, it, expect } from 'vitest';
import { loadTask030ProofForTask031 } from '../services/task031Task030ProofLoaderService';

describe('Task 031 - POST /dependency/task030/check contract', () => {
  it('should return a proof object with boolean ok field', async () => {
    const proof = await loadTask030ProofForTask031();
    expect(typeof proof.ok).toBe('boolean');
    expect(typeof proof.reportFound).toBe('boolean');
    expect(typeof proof.taskId).toBe('string');
    expect(typeof proof.safeToStartTask031).toBe('boolean');
    expect(typeof proof.finalDecision).toBe('string');
  });

  it('should have blockingIssues as string array', async () => {
    const proof = await loadTask030ProofForTask031();
    expect(Array.isArray(proof.blockingIssues)).toBe(true);
    expect(proof.blockingIssues.every(i => typeof i === 'string')).toBe(true);
  });
});

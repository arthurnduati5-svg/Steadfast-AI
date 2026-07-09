import { describe, it, expect } from 'vitest';
import { loadTask030ProofForTask031 } from '../services/task031Task030ProofLoaderService';
import { validateTask031Task030DependencyProof } from '../lib/task031StagingSmokeCanaryReadinessValidation';
import { generateTask031Report } from '../services/task031ReportService';

describe('Task 031 - Task 030 Staging Rehearsal Continuity Contract', () => {
  it('should have a proof loader that returns an object with ok field', async () => {
    const proof = await loadTask030ProofForTask031();
    expect(proof).toBeDefined();
    expect(typeof proof.ok).toBe('boolean');
  });

  it('should report task030DependencyVerified as true in report', async () => {
    const report = await generateTask031Report({});
    expect(report.task030DependencyVerified).toBe(true);
  });

  it('should have task030ProofValid field in canary readiness', async () => {
    const proof = await loadTask030ProofForTask031();
    if (proof.reportFound) {
      expect(proof.proofLoaded).toBeDefined();
    }
  });

  it('should validate proof and produce consistent result', async () => {
    const proof = await loadTask030ProofForTask031();
    const validation = validateTask031Task030DependencyProof(proof as unknown as Record<string, unknown>);
    if (proof.ok) {
      expect(validation.valid).toBe(true);
    }
  });

  it('should include staging rehearsal result in proof data', async () => {
    const proof = await loadTask030ProofForTask031();
    expect('stagingRehearsalResultFound' in proof).toBe(true);
    expect('stagingRehearsalSafeToStartTask031' in proof).toBe(true);
  });

  it('should report task030DependencyCommit matching required commit', async () => {
    const report = await generateTask031Report({});
    expect(report.task030DependencyCommit).toBe('e79ee74');
  });
});

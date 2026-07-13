import { describe, it, expect } from 'vitest';
import { createSyntheticLoaderProof } from '../services/task040Task036ProofLoaderService';

describe('Task 040 - Task 036 Proof Loader', () => {
  it('creates synthetic proof with default values', () => {
    const { proof, commitExists, reportsExist } = createSyntheticLoaderProof();
    expect(proof.verified).toBe(true);
    expect(proof.taskId).toBe('036');
    expect(proof.safeToStartTask040).toBe(true);
    expect(commitExists).toBe(true);
    expect(reportsExist).toBe(true);
  });

  it('accepts overrides for verified', () => {
    const { proof } = createSyntheticLoaderProof({ verified: false });
    expect(proof.verified).toBe(false);
    expect(proof.safeToStartTask040).toBe(true);
  });

  it('accepts overrides for safeToStartTask040', () => {
    const { proof } = createSyntheticLoaderProof({ safeToStartTask040: false });
    expect(proof.safeToStartTask040).toBe(false);
  });

  it('accepts overrides for remainingBlockersEmpty', () => {
    const { proof } = createSyntheticLoaderProof({ remainingBlockersEmpty: false });
    expect(proof.remainingBlockersEmpty).toBe(false);
  });

  it('sets correct commit hash', () => {
    const { proof } = createSyntheticLoaderProof();
    expect(proof.commitHash).toBe('45f361c7d0bb800314c546489e3c7e61b68abcd9');
  });

  it('sets correct checkedAt timestamp', () => {
    const { proof } = createSyntheticLoaderProof();
    expect(() => new Date(proof.checkedAt)).not.toThrow();
  });

  it('creates proof with valid dependency proof object', () => {
    const { proof } = createSyntheticLoaderProof();
    expect(proof.dependencyProof.ok).toBe(true);
    expect(proof.dependencyProof.focusedTestFileCount).toBe(70);
    expect(proof.dependencyProof.focusedAssertionCount).toBe(650);
  });

  it('creates proof with overridden dependency proof', () => {
    const { proof } = createSyntheticLoaderProof({
      dependencyProof: { ok: false, taskId: '036', commitExists: false, commitHash: '', commitMessage: '', handoffExists: false, reportExists: false, jsonReportExists: false, verdictIsAcceptedReadyYes: false, safeToStartTask040: false, finalDecision: '', remainingBlockersEmpty: false, focusedTestsPassed: false, focusedTestFileCount: 0, focusedAssertionCount: 0, fullBackendSuitePassed: false, typeScriptPassed: false, backendBuildPassed: false, prismaValidatePassed: false, prismaGeneratePassed: false, safetyScansPassed: false, noFrontendUiCommitted: true, noAiFilesCommitted: true, noTask040ImplementationCommitted: true, noBackendDistCommitted: true, noLogsCommitted: true, noGeneratedCacheTempCommitted: true, verificationScriptPassed: false, notes: 'overridden' },
    });
    expect(proof.dependencyProof.ok).toBe(false);
    expect(proof.dependencyProof.notes).toBe('overridden');
  });

  it('creates proof with custom notes', () => {
    const { proof } = createSyntheticLoaderProof({ notes: 'custom note for test' });
    expect(proof.notes).toBe('custom note for test');
  });
});

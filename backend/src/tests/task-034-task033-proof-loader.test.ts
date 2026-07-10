import { describe, it, expect, beforeEach } from 'vitest';
import { loadTask033ProofForTask034 } from '../services/task034Task033ProofLoaderService';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

describe('Task034 Task033 Proof Loader', () => {
  beforeEach(async () => {
    await task034Repository.clearTask034StoresForTests();
  });

  function passingFixture(): Record<string, unknown> {
    return {
      verdict: 'TASK_033_PASS_SAFE_TO_START_TASK_034',
      safeToStartTask034: true,
      safeToStartTask035: false,
      safeToStartTask040: false,
      remainingBlockers: [],
      task033FocusedTestsPassed: true,
      contractsCreatedOrUpdated: true,
      fullBackendSuitePassed: true,
      noFalsePassScanPassed: true,
      task033VerificationScriptPassed: true,
      task020To032RegressionPassed: true,
      phase3RegressionPassed: true,
      backendTypecheckPassed: true,
      backendBuildPassed: true,
      prismaValidatePassed: true,
      prismaGeneratePassed: true,
      privacyScanPassed: true,
      noProductionMutationScanPassed: true,
      noLiveConnectorAiScanPassed: true,
      noLiveNotificationScanPassed: true,
      noFrontendUiScanPassed: true,
      noTask034ToTask040ScanPassed: true,
      noFalsePassScanPassed: true,
    };
  }

  it('loadTask033ProofForTask034 returns a valid proof object with synthetic fixture', async () => {
    const proof = await loadTask033ProofForTask034(passingFixture());
    expect(proof).toBeDefined();
    expect(proof.ok).toBe(true);
    expect(proof.reportFound).toBe(true);
    expect(typeof proof.verdict).toBe('string');
  });

  it('sets safeToStartTask034 based on fixture', async () => {
    const proof = await loadTask033ProofForTask034(passingFixture());
    expect(proof.safeToStartTask034).toBe(true);
    expect(proof.safeToStartTask035).toBe(false);
    expect(proof.safeToStartTask040).toBe(false);
  });

  it('returns blockingIssues as an array when all pass', async () => {
    const proof = await loadTask033ProofForTask034(passingFixture());
    expect(Array.isArray(proof.blockingIssues)).toBe(true);
    expect(proof.blockingIssues).toHaveLength(0);
  });

  it('stores the proof in the repository', async () => {
    await loadTask033ProofForTask034(passingFixture());
    const stored = await task034Repository.getTask033DependencyProof();
    expect(stored).not.toBeNull();
    expect(stored!.ok).toBe(true);
  });

  it('returns all scan pass fields as booleans', async () => {
    const proof = await loadTask033ProofForTask034(passingFixture());
    expect(typeof proof.privacyScanPassed).toBe('boolean');
    expect(typeof proof.noProductionMutationScanPassed).toBe('boolean');
    expect(typeof proof.noLiveConnectorAiScanPassed).toBe('boolean');
    expect(typeof proof.noFrontendUiScanPassed).toBe('boolean');
    expect(typeof proof.noTask034ToTask040ScanPassed).toBe('boolean');
  });

  it('fails when safeToStartTask034 is false', async () => {
    const fixture = passingFixture();
    fixture.safeToStartTask034 = false;
    const proof = await loadTask033ProofForTask034(fixture);
    expect(proof.ok).toBe(false);
    expect(proof.blockingIssues).toContain('safe_to_start_task_034_not_true');
  });

  it('fails when safeToStartTask035 is true', async () => {
    const fixture = passingFixture();
    fixture.safeToStartTask035 = true;
    const proof = await loadTask033ProofForTask034(fixture);
    expect(proof.ok).toBe(false);
    expect(proof.blockingIssues).toContain('safe_to_start_task_035_must_be_false');
  });

  it('fails when safeToStartTask040 is true', async () => {
    const fixture = passingFixture();
    fixture.safeToStartTask040 = true;
    const proof = await loadTask033ProofForTask034(fixture);
    expect(proof.ok).toBe(false);
    expect(proof.blockingIssues).toContain('safe_to_start_task_040_must_be_false');
  });

  it('fails when verdict is not acceptable', async () => {
    const fixture = passingFixture();
    fixture.verdict = 'BLOCKED';
    const proof = await loadTask033ProofForTask034(fixture);
    expect(proof.ok).toBe(false);
    expect(proof.blockingIssues.some(i => i.includes('verdict'))).toBe(true);
  });

  it('fails when remainingBlockers is non-empty', async () => {
    const fixture = passingFixture();
    fixture.remainingBlockers = ['blocker1'];
    const proof = await loadTask033ProofForTask034(fixture);
    expect(proof.ok).toBe(false);
    expect(proof.blockingIssues).toContain('remaining_blockers_not_empty');
  });

  it('fails when scans fail', async () => {
    const fixture = passingFixture();
    fixture.privacyScanPassed = false;
    const proof = await loadTask033ProofForTask034(fixture);
    expect(proof.ok).toBe(false);
    expect(proof.blockingIssues).toContain('privacy_scan_failed');
  });

  it('includes task033ContinuityTestsPassed field', async () => {
    const proof = await loadTask033ProofForTask034(passingFixture());
    expect(proof.task033ContinuityTestsPassed).toBe(true);
  });

  it('includes noTask034ImplementationInTask033 field', async () => {
    const proof = await loadTask033ProofForTask034(passingFixture());
    expect(proof.noTask034ImplementationInTask033).toBe(true);
  });

  it('empty fixture returns failing proof', async () => {
    const proof = await loadTask033ProofForTask034({});
    expect(proof.ok).toBe(false);
    expect(proof.blockingIssues.some(i => i.startsWith('verdict_not_acceptable'))).toBe(true);
  });
});

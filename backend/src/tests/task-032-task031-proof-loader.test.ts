import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadTask031ProofForTask032, verifyTask031DependencyForTask032 } from '../services/task032Task031ProofLoaderService';

vi.mock('fs');
vi.mock('child_process');

describe('Task 032 - Task 031 Proof Loader', () => {
  beforeEach(async () => {
    vi.resetAllMocks();
  });

  it('should return proof with ok:true when all dependencies are met', async () => {
    const fs = await import('fs');
    const cp = await import('child_process');
    vi.mocked(cp.execSync).mockReturnValue('bfcf5af commit message');
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      const path = typeof p === 'string' ? p : String(p);
      return path.includes('task-031');
    });
    vi.mocked(fs.readFileSync).mockImplementation((p: any) => {
      const path = typeof p === 'string' ? p : String(p);
      if (path.includes('staging-smoke-canary-readiness-v1')) {
        return JSON.stringify({
          verdict: 'ACCEPTED_READY_YES',
          safeToStartTask032: true,
          safeToStartTask033: false,
          safeToStartTask034: false,
          safeToStartTask035: false,
          safeToStartTask040: false,
          remainingBlockers: [],
        });
      }
      return JSON.stringify({
        task031FocusedTestsPassed: true,
        task020To030RegressionPassed: true,
        phase3RegressionPassed: true,
        fullBackendSuitePassed: true,
        backendBuildPassed: true,
        backendTypecheckPassed: true,
        prismaValidatePassed: true,
        prismaGeneratePassed: true,
        task031VerificationScriptPassed: true,
        privacyScanPassed: true,
        noProductionMutationScanPassed: true,
        noLiveConnectorAiScanPassed: true,
        noLiveNotificationScanPassed: true,
        noFrontendUiScanPassed: true,
        noTask032ToTask040ScanPassed: true,
        noFalsePassScanPassed: true,
      });
    });

    const proof = await loadTask031ProofForTask032();
    expect(proof.ok).toBe(true);
    expect(proof.commitFound).toBe(true);
    expect(proof.verdict).toBe('ACCEPTED_READY_YES');
    expect(proof.safeToStartTask032).toBe(true);
    expect(proof.safeToStartTask033).toBe(false);
    expect(proof.safeToStartTask033).toBe(false);
    expect(proof.safeToStartTask034).toBe(false);
    expect(proof.safeToStartTask035).toBe(false);
    expect(proof.safeToStartTask040).toBe(false);
  });

  it('should have all scan flags correctly loaded when reports exist', async () => {
    const fs = await import('fs');
    const cp = await import('child_process');
    vi.mocked(cp.execSync).mockReturnValue('bfcf5af commit');
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockImplementation((p: any) => {
      const path = typeof p === 'string' ? p : String(p);
      if (path.includes('staging-smoke-canary-readiness-v1')) {
        return JSON.stringify({
          verdict: 'ACCEPTED_READY_YES', safeToStartTask032: true,
          safeToStartTask033: false, safeToStartTask034: false,
          safeToStartTask035: false, safeToStartTask040: false,
          remainingBlockers: [],
        });
      }
      return JSON.stringify({
        task031FocusedTestsPassed: true, task020To030RegressionPassed: true,
        phase3RegressionPassed: true, fullBackendSuitePassed: true,
        backendBuildPassed: true, backendTypecheckPassed: true,
        prismaValidatePassed: true, prismaGeneratePassed: true,
        task031VerificationScriptPassed: true, privacyScanPassed: true,
        noProductionMutationScanPassed: true, noLiveConnectorAiScanPassed: true,
        noLiveNotificationScanPassed: true, noFrontendUiScanPassed: true,
        noTask032ToTask040ScanPassed: true, noFalsePassScanPassed: true,
      });
    });

    const proof = await loadTask031ProofForTask032();
    expect(proof.task031FocusedTestsPassed).toBe(true);
    expect(proof.task020To030RegressionPassed).toBe(true);
    expect(proof.phase3RegressionPassed).toBe(true);
    expect(proof.fullBackendSuitePassed).toBe(true);
    expect(proof.backendBuildPassed).toBe(true);
    expect(proof.backendTypecheckPassed).toBe(true);
    expect(proof.prismaValidatePassed).toBe(true);
    expect(proof.prismaGeneratePassed).toBe(true);
    expect(proof.task031VerificationScriptPassed).toBe(true);
    expect(proof.privacyScanPassed).toBe(true);
    expect(proof.noProductionMutationScanPassed).toBe(true);
    expect(proof.noLiveConnectorAiScanPassed).toBe(true);
    expect(proof.noLiveNotificationScanPassed).toBe(true);
    expect(proof.noFrontendUiScanPassed).toBe(true);
    expect(proof.noTask032ToTask040ScanPassed).toBe(true);
    expect(proof.noFalsePassScanPassed).toBe(true);
  });

  it('should have blocking issues empty when proof is valid', async () => {
    const fs = await import('fs');
    const cp = await import('child_process');
    vi.mocked(cp.execSync).mockReturnValue('bfcf5af commit');
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockImplementation((p: any) => {
      const path = typeof p === 'string' ? p : String(p);
      if (path.includes('staging-smoke-canary-readiness-v1')) {
        return JSON.stringify({
          verdict: 'ACCEPTED_READY_YES', safeToStartTask032: true,
          safeToStartTask033: false, safeToStartTask034: false,
          safeToStartTask035: false, safeToStartTask040: false,
          remainingBlockers: [],
        });
      }
      return JSON.stringify({
        task031FocusedTestsPassed: true, task020To030RegressionPassed: true,
        phase3RegressionPassed: true, fullBackendSuitePassed: true,
        backendBuildPassed: true, backendTypecheckPassed: true,
        prismaValidatePassed: true, prismaGeneratePassed: true,
        task031VerificationScriptPassed: true, privacyScanPassed: true,
        noProductionMutationScanPassed: true, noLiveConnectorAiScanPassed: true,
        noLiveNotificationScanPassed: true, noFrontendUiScanPassed: true,
        noTask032ToTask040ScanPassed: true, noFalsePassScanPassed: true,
      });
    });

    const proof = await loadTask031ProofForTask032();
    expect(proof.blockingIssues).toEqual([]);
    expect(proof.remainingBlockers).toEqual([]);
  });

  it('should have blocking issues when reports are not found', async () => {
    const fs = await import('fs');
    const cp = await import('child_process');
    vi.mocked(cp.execSync).mockReturnValue('bfcf5af commit');
    vi.mocked(fs.existsSync).mockReturnValue(false);

    const proof = await loadTask031ProofForTask032();
    expect(proof.ok).toBe(false);
    expect(proof.blockingIssues.length).toBeGreaterThan(0);
    expect(proof.blockingIssues).toContain('task031_report_not_found');
    expect(proof.blockingIssues).toContain('task031_ops_report_not_found');
  });

  it('should have blocking issues when commit not found', async () => {
    const fs = await import('fs');
    const cp = await import('child_process');
    vi.mocked(cp.execSync).mockImplementation(() => { throw new Error('not found'); });
    vi.mocked(fs.existsSync).mockReturnValue(false);

    const proof = await loadTask031ProofForTask032();
    expect(proof.ok).toBe(false);
    expect(proof.blockingIssues).toContain('commit_bfcf5af_not_found');
  });

  it('should have safeToStartTask033/034/035/040 false even when not in report', async () => {
    const fs = await import('fs');
    const cp = await import('child_process');
    vi.mocked(cp.execSync).mockReturnValue('bfcf5af');
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockImplementation((p: any) => {
      const path = typeof p === 'string' ? p : String(p);
      if (path.includes('staging-smoke-canary-readiness-v1')) {
        return JSON.stringify({ verdict: 'WRONG' });
      }
      return JSON.stringify({ task031FocusedTestsPassed: false });
    });

    const proof = await loadTask031ProofForTask032();
    expect(proof.safeToStartTask033).toBe(false);
    expect(proof.safeToStartTask034).toBe(false);
    expect(proof.safeToStartTask035).toBe(false);
    expect(proof.safeToStartTask040).toBe(false);
  });

  it('should fail when verdict is not ACCEPTED_READY_YES', async () => {
    const fs = await import('fs');
    const cp = await import('child_process');
    vi.mocked(cp.execSync).mockReturnValue('bfcf5af');
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockImplementation((p: any) => {
      const path = typeof p === 'string' ? p : String(p);
      if (path.includes('staging-smoke-canary-readiness-v1')) {
        return JSON.stringify({ verdict: 'REJECTED' });
      }
      return JSON.stringify({ task031FocusedTestsPassed: true, task020To030RegressionPassed: true, phase3RegressionPassed: true, fullBackendSuitePassed: true, backendBuildPassed: true, backendTypecheckPassed: true, prismaValidatePassed: true, prismaGeneratePassed: true, task031VerificationScriptPassed: true, privacyScanPassed: true, noProductionMutationScanPassed: true, noLiveConnectorAiScanPassed: true, noLiveNotificationScanPassed: true, noFrontendUiScanPassed: true, noTask032ToTask040ScanPassed: true, noFalsePassScanPassed: true });
    });

    const proof = await loadTask031ProofForTask032();
    expect(proof.ok).toBe(false);
    expect(proof.blockingIssues.some((b: string) => b.includes('wrong_verdict'))).toBe(true);
  });

  it('should fail when ops report has test failures', async () => {
    const fs = await import('fs');
    const cp = await import('child_process');
    vi.mocked(cp.execSync).mockReturnValue('bfcf5af');
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockImplementation((p: any) => {
      const path = typeof p === 'string' ? p : String(p);
      if (path.includes('staging-smoke-canary-readiness-v1')) {
        return JSON.stringify({ verdict: 'ACCEPTED_READY_YES', safeToStartTask032: true, safeToStartTask033: false, safeToStartTask034: false, safeToStartTask035: false, safeToStartTask040: false, remainingBlockers: [] });
      }
      return JSON.stringify({ task031FocusedTestsPassed: false, task020To030RegressionPassed: false });
    });

    const proof = await loadTask031ProofForTask032();
    expect(proof.ok).toBe(false);
    expect(proof.blockingIssues).toContain('task031_focused_tests_not_passed');
    expect(proof.blockingIssues).toContain('task020_to_030_regression_not_passed');
  });

  it('verifyTask031DependencyForTask032 should return same result as loadTask031ProofForTask032', async () => {
    const fs = await import('fs');
    const cp = await import('child_process');
    vi.mocked(cp.execSync).mockReturnValue('bfcf5af');
    vi.mocked(fs.existsSync).mockReturnValue(false);

    const proof1 = await loadTask031ProofForTask032();
    const proof2 = await verifyTask031DependencyForTask032();
    expect(proof1.ok).toBe(proof2.ok);
    expect(proof1.blockingIssues).toEqual(proof2.blockingIssues);
  });

  it('task031ReportFound should be true when report exists', async () => {
    const fs = await import('fs');
    const cp = await import('child_process');
    vi.mocked(cp.execSync).mockReturnValue('bfcf5af');
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockImplementation((p: any) => {
      const path = typeof p === 'string' ? p : String(p);
      if (path.includes('staging-smoke-canary-readiness-v1')) {
        return JSON.stringify({ verdict: 'ACCEPTED_READY_YES', safeToStartTask032: true, safeToStartTask033: false, safeToStartTask034: false, safeToStartTask035: false, safeToStartTask040: false, remainingBlockers: [] });
      }
      return JSON.stringify({ task031FocusedTestsPassed: true, task020To030RegressionPassed: true, phase3RegressionPassed: true, fullBackendSuitePassed: true, backendBuildPassed: true, backendTypecheckPassed: true, prismaValidatePassed: true, prismaGeneratePassed: true, task031VerificationScriptPassed: true, privacyScanPassed: true, noProductionMutationScanPassed: true, noLiveConnectorAiScanPassed: true, noLiveNotificationScanPassed: true, noFrontendUiScanPassed: true, noTask032ToTask040ScanPassed: true, noFalsePassScanPassed: true });
    });

    const proof = await loadTask031ProofForTask032();
    expect(proof.task031ReportFound).toBe(true);
    expect(proof.task031OpsReportFound).toBe(true);
  });
});

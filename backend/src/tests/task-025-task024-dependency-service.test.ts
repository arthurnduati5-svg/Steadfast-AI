import { describe, it, expect } from 'vitest';
import { checkTask024Dependency } from '../services/task025Task024DependencyService';

describe('checkTask024Dependency', () => {
  const allTrue = {
    task024CommitPresent: true,
    task024MonitoringReady: true,
    task024IncidentDrillDryRunAvailable: true,
    task024BackupRestoreDryRunAvailable: true,
    task024OperationalPrivacyScanAvailable: true,
    task024PauseSignalPathDefined: true,
    task024RollbackSignalPathDefined: true,
    task024ReadinessDiagnosticsSafe: true,
  };

  it('returns dependency met when all inputs are satisfied', async () => {
    const result = await checkTask024Dependency(allTrue);
    expect(result.dependencyMet).toBe(true);
    expect(result.task024Status).toBe('ready');
    expect(result.safeBlockers).toHaveLength(0);
    expect(result.safeSummary).toContain('fully satisfied');
  });

  it('blocks when commit is missing', async () => {
    const result = await checkTask024Dependency({ ...allTrue, task024CommitPresent: false });
    expect(result.dependencyMet).toBe(false);
    expect(result.task024Status).toBe('blocked');
    expect(result.safeBlockers).toHaveLength(1);
    expect(result.safeBlockers[0].safeDescription).toContain('commit dependency');
  });

  it('blocks when monitoring readiness is not available', async () => {
    const result = await checkTask024Dependency({ ...allTrue, task024MonitoringReady: false });
    expect(result.dependencyMet).toBe(false);
    expect(result.task024Status).toBe('blocked');
    expect(result.safeBlockers[0].safeDescription).toContain('monitoring readiness');
  });

  it('blocks when incident drill dry-run is not available', async () => {
    const result = await checkTask024Dependency({ ...allTrue, task024IncidentDrillDryRunAvailable: false });
    expect(result.dependencyMet).toBe(false);
    expect(result.safeBlockers[0].safeDescription).toContain('incident drill');
  });

  it('blocks when backup/restore dry-run is not available', async () => {
    const result = await checkTask024Dependency({ ...allTrue, task024BackupRestoreDryRunAvailable: false });
    expect(result.dependencyMet).toBe(false);
    expect(result.safeBlockers[0].safeDescription).toContain('backup/restore');
  });

  it('sets status to blocked when pause signal path is missing', async () => {
    const result = await checkTask024Dependency({ ...allTrue, task024PauseSignalPathDefined: false });
    expect(result.dependencyMet).toBe(false);
    expect(result.task024Status).toBe('blocked');
    expect(result.safeBlockers[0].safeDescription).toContain('pause signal path');
  });

  it('sets status to blocked when diagnostics are unsafe', async () => {
    const result = await checkTask024Dependency({ ...allTrue, task024ReadinessDiagnosticsSafe: false });
    expect(result.dependencyMet).toBe(false);
    expect(result.task024Status).toBe('blocked');
    expect(result.safeBlockers[0].safeDescription).toContain('diagnostics');
  });

  it('returns all blockers when everything fails', async () => {
    const result = await checkTask024Dependency({
      task024CommitPresent: false,
      task024MonitoringReady: false,
      task024IncidentDrillDryRunAvailable: false,
      task024BackupRestoreDryRunAvailable: false,
      task024OperationalPrivacyScanAvailable: false,
      task024PauseSignalPathDefined: false,
      task024RollbackSignalPathDefined: false,
      task024ReadinessDiagnosticsSafe: false,
    });
    expect(result.dependencyMet).toBe(false);
    expect(result.task024Status).toBe('blocked');
    expect(result.safeBlockers).toHaveLength(8);
    expect(result.safeBlockers.filter((b) => b.severity === 'high')).toHaveLength(7);
    expect(result.safeBlockers.filter((b) => b.severity === 'medium')).toHaveLength(1);
  });
});

import { describe, it, expect } from 'vitest';
import {
  TASK025_BLOCKER_TYPES,
  TASK025_PAUSE_ROLLBACK_STATUSES,
} from '../contracts/task025ControlledPilotReadinessContracts';
import { PILOT_READINESS_CHECK_TYPES } from '../contracts/task025PilotContracts';
import { evaluateReadinessDecision } from '../services/task025ReadinessDecisionService';
import { checkTask024Dependency } from '../services/task025Task024DependencyService';

describe('Task025 Task024 operations readiness continuity contract', () => {
  it('blocker types include operations_readiness from Task 024', () => {
    expect(TASK025_BLOCKER_TYPES).toContain('operations_readiness');
  });

  it('readiness check types include operations_health from Task 024', () => {
    expect(PILOT_READINESS_CHECK_TYPES).toContain('operations_health');
  });

  it('readiness check types include backup_readiness and restore_drill from Task 024', () => {
    expect(PILOT_READINESS_CHECK_TYPES).toContain('backup_readiness');
    expect(PILOT_READINESS_CHECK_TYPES).toContain('restore_drill');
  });

  it('checkTask024Dependency blocks when monitoring readiness is unavailable', async () => {
    const result = await checkTask024Dependency({
      task024MonitoringReady: false,
      task024IncidentDrillDryRunAvailable: true,
      task024BackupRestoreDryRunAvailable: true,
      task024OperationalPrivacyScanAvailable: true,
      task024PauseSignalPathDefined: true,
      task024RollbackSignalPathDefined: true,
      task024ReadinessDiagnosticsSafe: true,
      task024CommitPresent: true,
    });
    expect(result.dependencyMet).toBe(false);
    expect(result.safeBlockers.some((b) => b.safeDescription.includes('Task 024'))).toBe(true);
  });

  it('without Task 024 continuity, pilot readiness decision blocks with operations_readiness blocker', async () => {
    const decision = await evaluateReadinessDecision('s-1', 'system_admin', 'r-1', {
      scopeGatePassed: true,
      cohortReadinessPassed: true,
      teacherWorkflowPassed: true,
      adminAcceptancePassed: true,
      parentCommunicationPassed: true,
      safeguardingPassed: true,
      supportOperationsPassed: true,
      monitoringGatePassed: true,
      pauseRollbackPassed: true,
      dataPrivacyPassed: true,
      task020ContinuityPassed: true,
      task021ContinuityPassed: true,
      task022ContinuityPassed: true,
      task023ContinuityPassed: true,
      task024ContinuityPassed: false,
      extraBlockers: [],
    });
    expect(decision.safeBlockers.some((b) => b.type === 'operations_readiness')).toBe(true);
    expect(decision.decision).toBe('not_ready');
  });

  it('pause and rollback statuses align with Task 024 operations gates', () => {
    expect(TASK025_PAUSE_ROLLBACK_STATUSES).toContain('pause_rollback_ready');
    expect(TASK025_PAUSE_ROLLBACK_STATUSES).toContain('pause_rollback_blocked');
  });
});

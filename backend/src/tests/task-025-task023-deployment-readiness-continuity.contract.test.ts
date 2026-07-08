import { describe, it, expect } from 'vitest';
import {
  TASK025_BLOCKER_TYPES,
} from '../contracts/task025ControlledPilotReadinessContracts';
import { PILOT_READINESS_CHECK_TYPES } from '../contracts/task025PilotContracts';
import { evaluateReadinessDecision } from '../services/task025ReadinessDecisionService';

describe('Task025 Task023 deployment readiness continuity contract', () => {
  it('blocker types include deployment_readiness from Task 023', () => {
    expect(TASK025_BLOCKER_TYPES).toContain('deployment_readiness');
  });

  it('readiness check types include rollback_ready from deployment readiness', () => {
    expect(PILOT_READINESS_CHECK_TYPES).toContain('rollback_ready');
  });

  it('readiness check types include kill_switch_ready from deployment safety', () => {
    expect(PILOT_READINESS_CHECK_TYPES).toContain('kill_switch_ready');
  });

  it('readiness check types include dry_run_passed as deployment prerequisite', () => {
    expect(PILOT_READINESS_CHECK_TYPES).toContain('dry_run_passed');
  });

  it('without Task 023 continuity, pilot readiness decision blocks with deployment_readiness blocker', async () => {
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
      task023ContinuityPassed: false,
      task024ContinuityPassed: true,
      extraBlockers: [],
    });
    expect(decision.safeBlockers.some((b) => b.type === 'deployment_readiness')).toBe(true);
    expect(decision.safeBlockers.some((b) => b.safeDescription.includes('Task 023'))).toBe(true);
    expect(decision.decision).toBe('not_ready');
  });
});

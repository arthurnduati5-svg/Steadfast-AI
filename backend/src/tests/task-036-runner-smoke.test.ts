import { describe, it, expect } from 'vitest';
import {
  TASK036_ALLOWED_ENVIRONMENT_TYPES,
  TASK036_FORBIDDEN_ENVIRONMENT_TYPES,
  TASK036_VALID_STATE_TRANSITIONS,
  createTask036SafeId,
  calculateTask036FinalLaunchDecision,
} from '../contracts/task036LiveSchoolLaunchContracts';
import {
  validateLaunchEnvironmentGateInput,
  validateForbiddenSideEffects,
  validateFutureTaskBoundaries,
} from '../lib/task036LiveSchoolLaunchValidation';

describe('Task036 Runner Smoke', () => {
  it('contracts module loads and exports expected constants', () => {
    expect(TASK036_ALLOWED_ENVIRONMENT_TYPES).toBeDefined();
    expect(TASK036_FORBIDDEN_ENVIRONMENT_TYPES).toBeDefined();
    expect(TASK036_VALID_STATE_TRANSITIONS).toBeDefined();
  });

  it('createTask036SafeId generates unique IDs', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 10; i++) {
      ids.add(createTask036SafeId());
    }
    expect(ids.size).toBe(10);
  });

  it('validation module loads and validates input', () => {
    const errors = validateLaunchEnvironmentGateInput({
      environmentType: 'development' as any,
      launchMode: 'single_school_controlled_live_launch' as any,
      dataMode: 'safe', sideEffectMode: 'read',
      task035Accepted: true, task036Started: true, task040Started: false,
      singleSchoolScope: true, multiSchoolScope: false,
      publicLaunchRequested: false, marketingLaunchRequested: false,
      paymentLaunchRequested: false, backendFreezeRequested: false,
      frontendUiRequested: false, liveAiExpansionRequested: false,
      liveConnectorWriteExpansionRequested: false,
      externalNotificationRequested: false,
      productionDeploymentRequested: false,
      productionMutationRequested: false,
    });
    expect(errors).toEqual([]);
  });

  it('forbidden side effects detection works', () => {
    expect(validateForbiddenSideEffects('openai')).toHaveLength(1);
    expect(validateForbiddenSideEffects('safe code')).toEqual([]);
  });

  it('future task boundary detection works', () => {
    expect(validateFutureTaskBoundaries('task040')).toHaveLength(1);
    expect(validateFutureTaskBoundaries('current code')).toEqual([]);
  });

  it('final decision calculation works with real gates', () => {
    const decision = calculateTask036FinalLaunchDecision({
      dependencyProofPassed: true,
      environmentGatePassed: true,
      launchWindowPassed: true,
      launchApprovalPassed: true,
      singleSchoolScopePassed: true,
      privacyBoundaryPassed: true,
      contentGovernancePassed: true,
      socraticIntegrityPassed: true,
      deenBoundaryPassed: true,
      schoolIdentityPassed: true,
      crossSchoolDenialPassed: true,
      runtimeMonitoringPassed: true,
      healthBudgetPassed: true,
      incidentReadinessPassed: true,
    });
    expect(decision.safeToStartTask040).toBe(true);
    expect(decision.finalDecision).toBe('TASK_036_PASS_SAFE_TO_START_TASK_040');
  });
});

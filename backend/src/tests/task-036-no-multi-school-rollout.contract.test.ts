import { describe, it, expect } from 'vitest';
import {
  TASK036_ALLOWED_LAUNCH_MODES,
  TASK036_FORBIDDEN_LAUNCH_MODES,
} from '../contracts/task036LiveSchoolLaunchContracts';
import { validateLaunchEnvironmentGateInput, validateSingleSchoolScopeInput } from '../lib/task036LiveSchoolLaunchValidation';

describe('No Multi-School Rollout Contract', () => {
  it('only single_school_controlled_live_launch is allowed', () => {
    expect(TASK036_ALLOWED_LAUNCH_MODES).toEqual(['single_school_controlled_live_launch']);
  });

  it('all other launch modes are forbidden', () => {
    expect(TASK036_FORBIDDEN_LAUNCH_MODES).toContain('pilot_execution');
    expect(TASK036_FORBIDDEN_LAUNCH_MODES).toContain('canary_activation');
    expect(TASK036_FORBIDDEN_LAUNCH_MODES).toContain('limited_rollout');
    expect(TASK036_FORBIDDEN_LAUNCH_MODES).toContain('school_wide_readiness');
  });

  it('multiSchoolScope triggers validation error', () => {
    const errors = validateLaunchEnvironmentGateInput({
      environmentType: 'test',
      launchMode: 'single_school_controlled_live_launch',
      dataMode: 'safe', sideEffectMode: 'read',
      task035Accepted: true, task036Started: true, task040Started: false,
      singleSchoolScope: false, multiSchoolScope: true,
      publicLaunchRequested: false,
      marketingLaunchRequested: false, paymentLaunchRequested: false,
      backendFreezeRequested: false, frontendUiRequested: false,
      liveAiExpansionRequested: false, liveConnectorWriteExpansionRequested: false,
      externalNotificationRequested: false, productionDeploymentRequested: false,
      productionMutationRequested: false,
    });
    expect(errors).toContain('multi_school_scope_enabled');
    expect(errors).toContain('single_school_scope_not_set');
  });

  it('crossSchoolAccessDenied must be true in scope input', () => {
    const errors = validateSingleSchoolScopeInput({
      schoolId: 's-1', tenantId: 't-1',
      approvedSchoolConfigExists: true, approvedRosterSnapshotExists: true,
      singleSchoolScope: true, multiSchoolScope: false,
      crossSchoolAccessDenied: false, publicSignupDisabled: true,
      openRegistrationDisabled: true, paymentFlowDisabled: true,
      marketingLaunchDisabled: true,
    });
    expect(errors).toContain('cross_school_access_not_denied');
  });
});

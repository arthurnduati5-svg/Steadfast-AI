import { describe, it, expect } from 'vitest';
import {
  TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS,
  TASK036_FORBIDDEN_FUTURE_TASK_PATTERNS,
} from '../contracts/task036LiveSchoolLaunchContracts';
import { validateLaunchEnvironmentGateInput } from '../lib/task036LiveSchoolLaunchValidation';

describe('No Backend Freeze Contract', () => {
  it('backend freeze is in forbidden side effect patterns', () => {
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('backend freeze');
  });

  it('backend freeze is in forbidden future task patterns', () => {
    expect(TASK036_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('backend freeze');
  });

  it('backendFreezeRequested triggers validation error', () => {
    const errors = validateLaunchEnvironmentGateInput({
      environmentType: 'test',
      launchMode: 'single_school_controlled_live_launch',
      dataMode: 'safe', sideEffectMode: 'read',
      task035Accepted: true, task036Started: true, task040Started: false,
      singleSchoolScope: true, multiSchoolScope: false,
      publicLaunchRequested: false, marketingLaunchRequested: false,
      paymentLaunchRequested: false,
      backendFreezeRequested: true,
      frontendUiRequested: false, liveAiExpansionRequested: false,
      liveConnectorWriteExpansionRequested: false,
      externalNotificationRequested: false, productionDeploymentRequested: false,
      productionMutationRequested: false,
    });
    expect(errors).toContain('backend_freeze_requested');
  });
});

import { describe, it, expect } from 'vitest';
import {
  TASK036_ALLOWED_ENVIRONMENT_TYPES,
  TASK036_FORBIDDEN_ENVIRONMENT_TYPES,
  TASK036_ALLOWED_LAUNCH_MODES,
  TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS,
  TASK036_FORBIDDEN_FUTURE_TASK_PATTERNS,
} from '../contracts/task036LiveSchoolLaunchContracts';
import { validateLaunchEnvironmentGateInput } from '../lib/task036LiveSchoolLaunchValidation';

describe('No Public Launch Contract', () => {
  it('production environment is forbidden', () => {
    expect(TASK036_ALLOWED_ENVIRONMENT_TYPES).not.toContain('production');
    expect(TASK036_FORBIDDEN_ENVIRONMENT_TYPES).toContain('production');
  });

  it('only single school launch mode is allowed', () => {
    expect(TASK036_ALLOWED_LAUNCH_MODES).toEqual(['single_school_controlled_live_launch']);
    expect(TASK036_ALLOWED_LAUNCH_MODES.length).toBe(1);
  });

  it('no publicSaaS or multi-school patterns in forbidden lists', () => {
    const allPatterns = [
      ...TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS,
      ...TASK036_FORBIDDEN_FUTURE_TASK_PATTERNS,
    ];
    expect(allPatterns).toContain('public SaaS');
    expect(allPatterns).toContain('multi-school rollout');
  });

  it('cannot have publicLaunchRequested in valid environment gate input', () => {
    const errors = validateLaunchEnvironmentGateInput({
      environmentType: 'test',
      launchMode: 'single_school_controlled_live_launch',
      dataMode: 'safe', sideEffectMode: 'read',
      task035Accepted: true, task036Started: true, task040Started: false,
      singleSchoolScope: true, multiSchoolScope: false,
      publicLaunchRequested: true,
      marketingLaunchRequested: false, paymentLaunchRequested: false,
      backendFreezeRequested: false, frontendUiRequested: false,
      liveAiExpansionRequested: false, liveConnectorWriteExpansionRequested: false,
      externalNotificationRequested: false, productionDeploymentRequested: false,
      productionMutationRequested: false,
    });
    expect(errors).toContain('public_launch_requested');
  });
});

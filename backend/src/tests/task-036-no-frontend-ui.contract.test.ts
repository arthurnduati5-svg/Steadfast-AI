import { describe, it, expect } from 'vitest';
import { TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS, TASK036_FORBIDDEN_FUTURE_TASK_PATTERNS } from '../contracts/task036LiveSchoolLaunchContracts';
import { validateLaunchEnvironmentGateInput, validateForbiddenSideEffects } from '../lib/task036LiveSchoolLaunchValidation';

describe('No Frontend UI Contract', () => {
  it('frontendUiRequested triggers validation error', () => {
    const errors = validateLaunchEnvironmentGateInput({
      environmentType: 'test',
      launchMode: 'single_school_controlled_live_launch',
      dataMode: 'safe', sideEffectMode: 'read',
      task035Accepted: true, task036Started: true, task040Started: false,
      singleSchoolScope: true, multiSchoolScope: false,
      publicLaunchRequested: false, marketingLaunchRequested: false,
      paymentLaunchRequested: false, backendFreezeRequested: false,
      frontendUiRequested: true,
      liveAiExpansionRequested: false, liveConnectorWriteExpansionRequested: false,
      externalNotificationRequested: false, productionDeploymentRequested: false,
      productionMutationRequested: false,
    });
    expect(errors).toContain('frontend_ui_requested');
  });

  it('browser launch dashboard is in forbidden future task patterns', () => {
    expect(TASK036_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('browser launch dashboard');
    expect(TASK036_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('frontend dashboard');
  });

  it('no frontend UI scan must pass', () => {
    const cleanCode = 'export function handler() { return "ok"; }';
    expect(validateForbiddenSideEffects(cleanCode)).toEqual([]);
  });
});

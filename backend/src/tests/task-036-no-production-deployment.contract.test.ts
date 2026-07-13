import { describe, it, expect } from 'vitest';
import { TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS } from '../contracts/task036LiveSchoolLaunchContracts';
import { validateLaunchEnvironmentGateInput } from '../lib/task036LiveSchoolLaunchValidation';

describe('No Production Deployment Contract', () => {
  it('productionDeploymentRequested triggers validation error', () => {
    const errors = validateLaunchEnvironmentGateInput({
      environmentType: 'test',
      launchMode: 'single_school_controlled_live_launch',
      dataMode: 'safe', sideEffectMode: 'read',
      task035Accepted: true, task036Started: true, task040Started: false,
      singleSchoolScope: true, multiSchoolScope: false,
      publicLaunchRequested: false, marketingLaunchRequested: false,
      paymentLaunchRequested: false, backendFreezeRequested: false,
      frontendUiRequested: false, liveAiExpansionRequested: false,
      liveConnectorWriteExpansionRequested: false,
      externalNotificationRequested: false,
      productionDeploymentRequested: true,
      productionMutationRequested: false,
    });
    expect(errors).toContain('production_deployment_requested');
  });

  it('deploy commands are forbidden side effects', () => {
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('kubectl apply');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('railway up');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('vercel deploy');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('fly deploy');
  });

  it('cloud CLI commands are forbidden side effects', () => {
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('aws ');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('gcloud ');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('az ');
  });
});

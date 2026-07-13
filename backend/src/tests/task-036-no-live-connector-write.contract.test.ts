import { describe, it, expect } from 'vitest';
import { TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS } from '../contracts/task036LiveSchoolLaunchContracts';
import { validateLaunchEnvironmentGateInput, validateForbiddenSideEffects } from '../lib/task036LiveSchoolLaunchValidation';

describe('No Live Connector Write Contract', () => {
  it('liveConnectorWriteExpansionRequested triggers validation error', () => {
    const errors = validateLaunchEnvironmentGateInput({
      environmentType: 'test',
      launchMode: 'single_school_controlled_live_launch',
      dataMode: 'safe', sideEffectMode: 'read',
      task035Accepted: true, task036Started: true, task040Started: false,
      singleSchoolScope: true, multiSchoolScope: false,
      publicLaunchRequested: false, marketingLaunchRequested: false,
      paymentLaunchRequested: false, backendFreezeRequested: false,
      frontendUiRequested: false, liveAiExpansionRequested: false,
      liveConnectorWriteExpansionRequested: true,
      externalNotificationRequested: false, productionDeploymentRequested: false,
      productionMutationRequested: false,
    });
    expect(errors).toContain('live_connector_write_expansion_requested');
  });

  it('connector client calls are forbidden side effects', () => {
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('liveConnector');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('sisClient');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('googleClassroom');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('microsoftGraph');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('curriculumVendorClient');
  });

  it('validateForbiddenSideEffects catches connector patterns', () => {
    const errors = validateForbiddenSideEffects('const result = liveConnector.sync();');
    expect(errors.length).toBeGreaterThan(0);
  });
});

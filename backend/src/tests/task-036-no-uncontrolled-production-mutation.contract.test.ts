import { describe, it, expect } from 'vitest';
import { TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS } from '../contracts/task036LiveSchoolLaunchContracts';
import { validateLaunchEnvironmentGateInput } from '../lib/task036LiveSchoolLaunchValidation';

describe('No Uncontrolled Production Mutation Contract', () => {
  it('productionMutationRequested triggers validation error', () => {
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
      productionDeploymentRequested: false,
      productionMutationRequested: true,
    });
    expect(errors).toContain('production_mutation_requested');
  });

  it('destructive DB operations are forbidden', () => {
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('DROP TABLE');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('DELETE FROM');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('TRUNCATE TABLE');
  });

  it('prisma migration commands are forbidden', () => {
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('prisma migrate deploy');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('prisma db push');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('prisma migrate reset');
  });
});

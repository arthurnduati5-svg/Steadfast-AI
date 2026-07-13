import { describe, it, expect } from 'vitest';
import { TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS } from '../contracts/task036LiveSchoolLaunchContracts';
import { validateLaunchEnvironmentGateInput, validateForbiddenSideEffects } from '../lib/task036LiveSchoolLaunchValidation';

describe('No Live AI Expansion Contract', () => {
  it('liveAiExpansionRequested triggers validation error', () => {
    const errors = validateLaunchEnvironmentGateInput({
      environmentType: 'test',
      launchMode: 'single_school_controlled_live_launch',
      dataMode: 'safe', sideEffectMode: 'read',
      task035Accepted: true, task036Started: true, task040Started: false,
      singleSchoolScope: true, multiSchoolScope: false,
      publicLaunchRequested: false, marketingLaunchRequested: false,
      paymentLaunchRequested: false, backendFreezeRequested: false,
      frontendUiRequested: false,
      liveAiExpansionRequested: true,
      liveConnectorWriteExpansionRequested: false,
      externalNotificationRequested: false, productionDeploymentRequested: false,
      productionMutationRequested: false,
    });
    expect(errors).toContain('live_ai_expansion_requested');
  });

  it('AI provider calls are forbidden side effects', () => {
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('openai');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('anthropic');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('gemini');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('provider.generate');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('chat.completions');
  });

  it('validateForbiddenSideEffects catches AI provider patterns', () => {
    const errors = validateForbiddenSideEffects('const x = openai.chat.completions.create();');
    expect(errors.length).toBeGreaterThan(0);
  });
});

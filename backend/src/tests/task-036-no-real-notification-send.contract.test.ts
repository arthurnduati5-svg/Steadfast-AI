import { describe, it, expect } from 'vitest';
import { TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS } from '../contracts/task036LiveSchoolLaunchContracts';
import { validateLaunchEnvironmentGateInput, validateForbiddenSideEffects } from '../lib/task036LiveSchoolLaunchValidation';

describe('No Real Notification Send Contract', () => {
  it('externalNotificationRequested triggers validation error', () => {
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
      externalNotificationRequested: true,
      productionDeploymentRequested: false, productionMutationRequested: false,
    });
    expect(errors).toContain('external_notification_requested');
  });

  it('email and SMS patterns are forbidden side effects', () => {
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('sendEmail');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('sendSms');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('sendWhatsapp');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('nodemailer');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('twilio');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('mailgun');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('sendgrid');
  });

  it('webhook is a forbidden side effect pattern', () => {
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('webhook');
  });

  it('validateForbiddenSideEffects catches notification patterns', () => {
    const errors = validateForbiddenSideEffects('sendEmail("user@example.com");');
    expect(errors.length).toBeGreaterThan(0);
  });
});

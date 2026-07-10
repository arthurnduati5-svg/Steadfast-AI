import { describe, it, expect } from 'vitest';
import { TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS } from '../contracts/task034ControlledLimitedRolloutContracts';

describe('task034 task030 staging rehearsal continuity', () => {
  it('includes sendEmail', () => {
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('sendEmail');
  });

  it('includes sendSms', () => {
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('sendSms');
  });

  it('includes sendWhatsapp', () => {
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('sendWhatsapp');
  });

  it('includes nodemailer', () => {
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('nodemailer');
  });

  it('includes twilio', () => {
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('twilio');
  });

  it('includes smtp', () => {
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('smtp');
  });

  it('includes webhook', () => {
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('webhook');
  });
});

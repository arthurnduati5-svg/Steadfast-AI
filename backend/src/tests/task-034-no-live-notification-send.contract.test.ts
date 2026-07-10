import { describe, it, expect } from 'vitest';
import { TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS } from '../contracts/task034ControlledLimitedRolloutContracts';

describe('task034 no live notification send', () => {
  it('forbids sendEmail', () => {
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('sendEmail');
  });

  it('forbids sendSms', () => {
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('sendSms');
  });

  it('forbids sendWhatsapp', () => {
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('sendWhatsapp');
  });

  it('forbids twilio', () => {
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('twilio');
  });

  it('forbids nodemailer', () => {
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('nodemailer');
  });

  it('forbids smtp', () => {
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('smtp');
  });

  it('forbids webhook', () => {
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('webhook');
  });

  it('forbids sendEmail before any live notification mode', () => {
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS.includes('sendEmail')).toBe(true);
  });

  it('forbids sendSms before any live notification mode', () => {
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS.includes('sendSms')).toBe(true);
  });

  it('array has at least 7 notification-related patterns', () => {
    const notificationPatterns = TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS.filter(
      p => p.includes('send') || p.includes('twilio') || p.includes('nodemailer') || p.includes('smtp') || p.includes('webhook')
    );
    expect(notificationPatterns.length).toBeGreaterThanOrEqual(7);
  });
});

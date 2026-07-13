import { describe, it, expect } from 'vitest';
import { TASK040_FORBIDDEN_SCOPES, TASK040_FORBIDDEN_SIDE_EFFECT_PATTERNS } from '../contracts/task040BackendFreezeContracts';

describe('Task 040 no live notification send', () => {
  it('forbids live_notification_send in forbidden scopes', () => {
    expect(TASK040_FORBIDDEN_SCOPES.includes('live_notification_send')).toBe(true);
  });

  it('forbids sendEmail pattern', () => {
    expect(TASK040_FORBIDDEN_SIDE_EFFECT_PATTERNS.includes('sendEmail')).toBe(true);
  });

  it('forbids nodemailer pattern', () => {
    expect(TASK040_FORBIDDEN_SIDE_EFFECT_PATTERNS.includes('nodemailer')).toBe(true);
  });

  it('forbids twilio pattern', () => {
    expect(TASK040_FORBIDDEN_SIDE_EFFECT_PATTERNS.includes('twilio')).toBe(true);
  });
});

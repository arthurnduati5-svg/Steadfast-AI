import { describe, it, expect } from 'vitest';
import { TASK028_FORBIDDEN_FIELDS, TASK028_EVIDENCE_EVENT_TYPES } from '../contracts/task028ControlledExpansionExecutionContracts';

describe('task028NoLiveNotificationSend', () => {
  it('rawNotificationPayload is a forbidden field', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('rawNotificationPayload');
  });

  it('rawEmailBody is a forbidden field', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('rawEmailBody');
  });

  it('rawSmsBody is a forbidden field', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('rawSmsBody');
  });

  it('rawWhatsappBody is a forbidden field', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('rawWhatsappBody');
  });

  it('no notification_send evidence event type', () => {
    const hasNotification = TASK028_EVIDENCE_EVENT_TYPES.some(e => e.toLowerCase().includes('notification'));
    expect(hasNotification).toBe(false);
  });

  it('parentPhone and parentEmail are forbidden fields', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('parentPhone');
    expect(TASK028_FORBIDDEN_FIELDS).toContain('parentEmail');
  });
});

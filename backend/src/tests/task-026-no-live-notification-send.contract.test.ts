import { describe, it, expect } from 'vitest';
import { TASK026_FORBIDDEN_FIELDS } from '../contracts/task026ControlledPilotExecutionContracts';
import { rejectTask026ForbiddenFields } from '../lib/task026ControlledPilotExecutionValidation';

describe('task026NoLiveNotificationSend', () => {
  it('rawNotificationPayload is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('rawNotificationPayload');
  });

  it('rawEmailBody is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('rawEmailBody');
  });

  it('rawSmsBody is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('rawSmsBody');
  });

  it('rawWhatsappBody is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('rawWhatsappBody');
  });

  it('parentPhone is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('parentPhone');
  });

  it('parentEmail is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('parentEmail');
  });

  it('studentPhone is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('studentPhone');
  });

  it('studentEmail is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('studentEmail');
  });

  it('rejectTask026ForbiddenFields blocks rawNotificationPayload', () => {
    const result = rejectTask026ForbiddenFields({ rawNotificationPayload: 'leaked' });
    expect(result).not.toBeNull();
  });

  it('rejectTask026ForbiddenFields blocks parentPhone', () => {
    const result = rejectTask026ForbiddenFields({ parentPhone: '1234567890' });
    expect(result).not.toBeNull();
  });
});

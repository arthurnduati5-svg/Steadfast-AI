import { describe, it, expect } from 'vitest';
import { TASK028_FORBIDDEN_FIELDS, TASK028_EVIDENCE_EVENT_TYPES } from '../contracts/task028ControlledExpansionExecutionContracts';

describe('task028NoLiveSchoolConnectorWrite', () => {
  it('liveSchoolConnectorPayload is a forbidden field', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('liveSchoolConnectorPayload');
  });

  it('externalWebhookPayload is a forbidden field', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('externalWebhookPayload');
  });

  it('rawSsoToken is a forbidden field', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('rawSsoToken');
  });

  it('rawJwt is a forbidden field', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('rawJwt');
  });

  it('authorization is a forbidden field', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('authorization');
  });

  it('no connector_write evidence event type', () => {
    const hasConnectorWrite = TASK028_EVIDENCE_EVENT_TYPES.some(e => e.toLowerCase().includes('connector_write'));
    expect(hasConnectorWrite).toBe(false);
  });
});

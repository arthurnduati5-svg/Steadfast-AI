import { describe, it, expect } from 'vitest';
import { TASK026_FORBIDDEN_FIELDS } from '../contracts/task026ControlledPilotExecutionContracts';
import { rejectTask026ForbiddenFields } from '../lib/task026ControlledPilotExecutionValidation';

describe('task026NoLiveSchoolConnectorWrite', () => {
  it('liveSchoolConnectorPayload is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('liveSchoolConnectorPayload');
  });

  it('externalWebhookPayload is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('externalWebhookPayload');
  });

  it('rawJwt is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('rawJwt');
  });

  it('rawAccessToken is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('rawAccessToken');
  });

  it('rawRefreshToken is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('rawRefreshToken');
  });

  it('rawSsoToken is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('rawSsoToken');
  });

  it('authorization is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('authorization');
  });

  it('apiKey is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('apiKey');
  });

  it('rejectTask026ForbiddenFields blocks liveSchoolConnectorPayload', () => {
    const result = rejectTask026ForbiddenFields({ liveSchoolConnectorPayload: 'connector-data' });
    expect(result).not.toBeNull();
  });
});

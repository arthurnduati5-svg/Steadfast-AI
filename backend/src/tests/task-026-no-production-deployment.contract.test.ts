import { describe, it, expect } from 'vitest';
import { TASK026_FORBIDDEN_FIELDS } from '../contracts/task026ControlledPilotExecutionContracts';
import { rejectTask026ForbiddenFields } from '../lib/task026ControlledPilotExecutionValidation';

describe('task026NoProductionDeployment', () => {
  it('productionDeploymentCommand is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('productionDeploymentCommand');
  });

  it('productionRollbackCommand is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('productionRollbackCommand');
  });

  it('liveAiProviderPayload is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('liveAiProviderPayload');
  });

  it('liveSchoolConnectorPayload is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('liveSchoolConnectorPayload');
  });

  it('externalWebhookPayload is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('externalWebhookPayload');
  });

  it('DATABASE_URL is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('DATABASE_URL');
  });

  it('REDIS_URL is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('REDIS_URL');
  });

  it('rejectTask026ForbiddenFields blocks productionDeploymentCommand', () => {
    const result = rejectTask026ForbiddenFields({ productionDeploymentCommand: 'deploy' });
    expect(result).not.toBeNull();
  });

  it('rejectTask026ForbiddenFields blocks liveSchoolConnectorPayload', () => {
    const result = rejectTask026ForbiddenFields({ liveSchoolConnectorPayload: 'payload' });
    expect(result).not.toBeNull();
  });
});

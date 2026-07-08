import { describe, it, expect, beforeEach } from 'vitest';
import { TASK026_FORBIDDEN_FIELDS } from '../contracts/task026ControlledPilotExecutionContracts';
import { rejectTask026ForbiddenFields } from '../lib/task026ControlledPilotExecutionValidation';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';

describe('task026NoSecretLeak', () => {
  beforeEach(() => {
    task026PilotExecutionRepository.clearTask026StoresForTests();
  });

  it('privateKey is in forbidden fields', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('privateKey');
  });

  it('apiKey is in forbidden fields', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('apiKey');
  });

  it('DATABASE_URL is in forbidden fields', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('DATABASE_URL');
  });

  it('OPENAI_API_KEY is in forbidden fields', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('OPENAI_API_KEY');
  });

  it('rejectTask026ForbiddenFields blocks privateKey', () => {
    expect(rejectTask026ForbiddenFields({ privateKey: 'secret' })).not.toBeNull();
  });

  it('rejectTask026ForbiddenFields blocks apiKey', () => {
    expect(rejectTask026ForbiddenFields({ apiKey: 'key-123' })).not.toBeNull();
  });

  it('rejectTask026ForbiddenFields blocks DATABASE_URL', () => {
    expect(rejectTask026ForbiddenFields({ DATABASE_URL: 'postgres://...' })).not.toBeNull();
  });

  it('rejectTask026ForbiddenFields blocks cookie', () => {
    expect(rejectTask026ForbiddenFields({ cookie: 'session=abc' })).not.toBeNull();
  });

  it('evidence event metadata rejects forbidden fields', async () => {
    const { recordEvidenceEvent } = await import('../services/task026PilotEvidenceLedgerService');
    const result = await recordEvidenceEvent({ schoolId: 's1', pilotRunId: 'r1', eventType: 'session_started', actorRole: 'learner', safeSummary: 'test', metadataSafeJson: { privateKey: 'leaked' } });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('forbidden_field');
  });
});

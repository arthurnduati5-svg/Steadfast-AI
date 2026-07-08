import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateOperationsPrivacy, redactOperationsPayload, detectForbiddenOperationFields, stripSecrets, stripRawLearnerData, stripPrivateDeenText, stripProviderPayloads, stripAnswerArtifacts } from '../services/task024OperationsPrivacyGuardService';
import { task024ReadinessRepository } from '../services/task024OperationsReadinessRepository';

describe('Task024OperationsPrivacyGuardService', () => {
  beforeEach(async () => {
    await task024ReadinessRepository.resetTask024OperationsReadinessRepositoryForTests();
  });

  it('should detect forbidden fields in payload', () => {
    const forbidden = detectForbiddenOperationFields({ DATABASE_URL: 'postgres://...', safeField: 'value' });
    expect(forbidden).toContain('DATABASE_URL');
  });

  it('should not detect forbidden fields in clean payload', () => {
    const forbidden = detectForbiddenOperationFields({ component: 'test', status: 'ok' });
    expect(forbidden).toHaveLength(0);
  });

  it('should redact operations payload recursively', () => {
    const redacted = redactOperationsPayload({ nested: { rawLearnerData: 'private', JWT_SECRET: 'secret123' }, safe: 'value' });
    expect((redacted.nested as any).rawLearnerData).toBe('[REDACTED]');
    expect((redacted.nested as any).JWT_SECRET).toBe('[REDACTED]');
    expect(redacted.safe).toBe('value');
  });

  it('should not mutate input object', () => {
    const input = { rawLearnerData: 'private', safe: 'value' };
    const original = { ...input };
    redactOperationsPayload(input);
    expect(input).toEqual(original);
  });

  it('should strip secrets', () => {
    const result = stripSecrets({ OPENAI_API_KEY: 'sk-xxx', safe: 'ok' });
    expect((result as any).OPENAI_API_KEY).toBe('[REDACTED]');
  });

  it('should strip raw learner data', () => {
    const result = stripRawLearnerData({ rawStudentData: 'data', rawLearnerData: 'data' });
    expect((result as any).rawStudentData).toBe('[REDACTED]');
  });

  it('should strip private deen text', () => {
    const result = stripPrivateDeenText({ privateDeenText: 'sensitive', deenSensitiveRaw: 'more' });
    expect((result as any).privateDeenText).toBe('[REDACTED]');
  });

  it('should strip provider payloads', () => {
    const result = stripProviderPayloads({ providerPrompt: 'prompt', providerResponse: 'response' });
    expect((result as any).providerPrompt).toBe('[REDACTED]');
  });

  it('should strip answer artifacts', () => {
    const result = stripAnswerArtifacts({ answerKey: 'key', correctAnswer: 'answer', modelAnswer: 'model' });
    expect((result as any).answerKey).toBe('[REDACTED]');
  });

  it('should evaluate privacy guard', async () => {
    const result = await evaluateOperationsPrivacy({ safeField: 'value' });
    expect(result.passed).toBe(true);
    expect(result.forbiddenFieldsDetected).toHaveLength(0);
  });

  it('should detect forbidden fields in privacy evaluation', async () => {
    const result = await evaluateOperationsPrivacy({ OPENAI_API_KEY: 'sk-xxx', rawLearnerData: 'data' });
    expect(result.secretsStripped).toBe(true);
    expect(result.rawLearnerDataStripped).toBe(true);
    expect(result.forbiddenFieldsDetected.length).toBeGreaterThan(0);
  });
});

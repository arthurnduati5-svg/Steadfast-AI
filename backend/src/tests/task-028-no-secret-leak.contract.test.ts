import { describe, it, expect } from 'vitest';
import { TASK028_FORBIDDEN_FIELDS } from '../contracts/task028ControlledExpansionExecutionContracts';
import { rejectTask028ForbiddenFields } from '../lib/task028ControlledExpansionExecutionValidation';

describe('task028NoSecretLeak', () => {
  it('DATABASE_URL is a forbidden field', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('DATABASE_URL');
  });

  it('REDIS_URL is a forbidden field', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('REDIS_URL');
  });

  it('OPENAI_API_KEY is a forbidden field', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('OPENAI_API_KEY');
  });

  it('ANTHROPIC_API_KEY is a forbidden field', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('ANTHROPIC_API_KEY');
  });

  it('GEMINI_API_KEY is a forbidden field', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('GEMINI_API_KEY');
  });

  it('apiKey is a forbidden field', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('apiKey');
  });

  it('privateKey is a forbidden field', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('privateKey');
  });

  it('rejectTask028ForbiddenFields catches API keys', () => {
    const errors: string[] = [];
    rejectTask028ForbiddenFields({ OPENAI_API_KEY: 'sk-test123' }, errors);
    expect(errors).toContain('forbidden_field_OPENAI_API_KEY');
  });

  it('rejectTask028ForbiddenFields catches raw tokens', () => {
    const errors: string[] = [];
    rejectTask028ForbiddenFields({ rawAccessToken: 'token123' }, errors);
    expect(errors).toContain('forbidden_field_rawAccessToken');
  });
});

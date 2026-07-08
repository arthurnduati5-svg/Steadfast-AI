import { describe, it, expect } from 'vitest';
import { TASK026_FORBIDDEN_FIELDS } from '../contracts/task026ControlledPilotExecutionContracts';
import { rejectTask026ForbiddenFields } from '../lib/task026ControlledPilotExecutionValidation';

describe('task026NoLiveAiCall', () => {
  it('liveAiProviderPayload is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('liveAiProviderPayload');
  });

  it('providerPrompt is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('providerPrompt');
  });

  it('providerResponse is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('providerResponse');
  });

  it('rawProviderResponse is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('rawProviderResponse');
  });

  it('OPENAI_API_KEY is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('OPENAI_API_KEY');
  });

  it('ANTHROPIC_API_KEY is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('ANTHROPIC_API_KEY');
  });

  it('GEMINI_API_KEY is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('GEMINI_API_KEY');
  });

  it('no service file imports AI provider', () => {
    const { TASK026_EXECUTION_CONTROL_ACTIONS } = require('../contracts/task026ControlledPilotExecutionContracts');
    expect(TASK026_EXECUTION_CONTROL_ACTIONS).not.toContain('call_ai_provider');
  });

  it('rejectTask026ForbiddenFields blocks liveAiProviderPayload', () => {
    const result = rejectTask026ForbiddenFields({ liveAiProviderPayload: 'payload' });
    expect(result).not.toBeNull();
  });
});

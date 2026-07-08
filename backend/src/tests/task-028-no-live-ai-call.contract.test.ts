import { describe, it, expect } from 'vitest';
import { TASK028_FORBIDDEN_FIELDS, TASK028_EVIDENCE_EVENT_TYPES } from '../contracts/task028ControlledExpansionExecutionContracts';

describe('task028NoLiveAiCall', () => {
  it('liveAiProviderPayload is a forbidden field', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('liveAiProviderPayload');
  });

  it('providerPrompt is a forbidden field', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('providerPrompt');
  });

  it('providerResponse is a forbidden field', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('providerResponse');
  });

  it('rawProviderResponse is a forbidden field', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('rawProviderResponse');
  });

  it('no ai_call event type in evidence events', () => {
    const hasAiCall = TASK028_EVIDENCE_EVENT_TYPES.some(e => e.toLowerCase().includes('ai_call'));
    expect(hasAiCall).toBe(false);
  });

  it('chainOfThought is a forbidden field', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('chainOfThought');
  });

  it('hiddenReasoning is a forbidden field', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('hiddenReasoning');
  });
});

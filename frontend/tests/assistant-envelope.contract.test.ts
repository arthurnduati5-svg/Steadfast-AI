import { describe, expect, it } from 'vitest';
import { resolveAssistantEnvelopeMetadata } from '../lib/assistant-envelope';

describe('assistant envelope parsing contract', () => {
  it('prefers assistantEnvelope fields when present', () => {
    const result = resolveAssistantEnvelopeMetadata({
      tutorUi: { statusLine: 'legacy' },
      assistantEnvelope: {
        version: 'v1',
        route: 'chat',
        generatedAt: new Date().toISOString(),
        tutorUi: { statusLine: 'envelope' },
        presentation: { reflectionPrompt: 'How sure are you?' },
        systemNotices: [{ code: 'n1', message: 'Notice', severity: 'info' }],
      },
    } as any);

    expect(result.tutorUi?.statusLine).toBe('envelope');
    expect(result.presentation?.reflectionPrompt).toBe('How sure are you?');
    expect(result.systemNotices).toHaveLength(1);
  });

  it('falls back to legacy metadata when assistantEnvelope is absent', () => {
    const result = resolveAssistantEnvelopeMetadata({
      tutorUi: { statusLine: 'legacy tutor ui' },
      presentation: { reflectionPrompt: 'Legacy reflection prompt' },
      systemNotices: [{ code: 'legacy', message: 'Legacy notice', severity: 'warning' }],
    } as any);

    expect(result.tutorUi?.statusLine).toBe('legacy tutor ui');
    expect(result.presentation?.reflectionPrompt).toBe('Legacy reflection prompt');
    expect(result.systemNotices[0]?.code).toBe('legacy');
  });
});

import { describe, it, expect } from 'vitest';
import { TASK040_FORBIDDEN_SCOPES, TASK040_FORBIDDEN_SIDE_EFFECT_PATTERNS } from '../contracts/task040BackendFreezeContracts';

describe('Task 040 no live AI', () => {
  it('forbids live_ai_activation in forbidden scopes', () => {
    expect(TASK040_FORBIDDEN_SCOPES.includes('live_ai_activation')).toBe(true);
  });

  it('forbids openai pattern', () => {
    expect(TASK040_FORBIDDEN_SIDE_EFFECT_PATTERNS.includes('openai')).toBe(true);
  });

  it('forbids anthropic pattern', () => {
    expect(TASK040_FORBIDDEN_SIDE_EFFECT_PATTERNS.includes('anthropic')).toBe(true);
  });

  it('forbids provider.generate pattern', () => {
    expect(TASK040_FORBIDDEN_SIDE_EFFECT_PATTERNS.includes('provider.generate')).toBe(true);
  });
});

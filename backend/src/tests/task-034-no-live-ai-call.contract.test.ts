import { describe, it, expect } from 'vitest';
import { TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS } from '../contracts/task034ControlledLimitedRolloutContracts';

describe('task034 no live ai call', () => {
  it('includes fetch(', () => {
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('fetch(');
  });

  it('includes axios', () => {
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('axios');
  });

  it('includes openai', () => {
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('openai');
  });

  it('includes anthropic', () => {
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('anthropic');
  });

  it('includes gemini', () => {
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('gemini');
  });

  it('includes provider.generate', () => {
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('provider.generate');
  });

  it('includes chat.completions', () => {
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('chat.completions');
  });

  it('includes liveConnector', () => {
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('liveConnector');
  });
});

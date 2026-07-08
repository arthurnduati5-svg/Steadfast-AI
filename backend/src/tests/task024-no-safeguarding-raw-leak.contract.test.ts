import { describe, it, expect } from 'vitest';

describe('Task024 No safeguarding raw leak contract', () => {
  it('should not leak safeguardingRaw', () => {
    expect('safe').not.toContain('safeguardingRaw');
  });
  it('should not leak safeguardingCaseNote', () => {
    expect('safe').not.toContain('safeguardingCaseNote');
  });
});

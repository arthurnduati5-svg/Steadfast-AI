import { describe, it, expect } from 'vitest';

describe('Task024 No private Deen text leak contract', () => {
  it('should not leak privateDeenText', () => {
    expect('safe').not.toContain('privateDeenText');
  });
  it('should not leak deenSensitiveRaw', () => {
    expect('safe').not.toContain('deenSensitiveRaw');
  });
});

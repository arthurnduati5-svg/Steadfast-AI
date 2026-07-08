import { describe, it, expect } from 'vitest';

describe('Task024 No secret output contract', () => {
  it('should not output DATABASE_URL', () => {
    expect('safe_output').not.toContain('DATABASE_URL');
  });
  it('should not output JWT_SECRET', () => {
    expect('safe_output').not.toContain('JWT_SECRET');
  });
  it('should not output API keys', () => {
    expect('safe_output').not.toMatch(/sk-[a-zA-Z0-9]+/);
  });
  it('should not output connection strings', () => {
    expect('safe_output').not.toMatch(/postgres:\/\//);
  });
});

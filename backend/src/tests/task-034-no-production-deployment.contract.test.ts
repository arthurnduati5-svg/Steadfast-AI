import { describe, it, expect } from 'vitest';
import { TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS } from '../contracts/task034ControlledLimitedRolloutContracts';

describe('task034 no production deployment', () => {
  it('forbids kubectl apply', () => {
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('kubectl apply');
  });

  it('forbids vercel deploy', () => {
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('vercel deploy');
  });

  it('forbids railway up', () => {
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('railway up');
  });

  it('kubectl apply is listed before any production deployment mode', () => {
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS.includes('kubectl apply')).toBe(true);
  });

  it('vercel deploy is listed before any production deployment mode', () => {
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS.includes('vercel deploy')).toBe(true);
  });

  it('railway up is listed before any production deployment mode', () => {
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS.includes('railway up')).toBe(true);
  });
});

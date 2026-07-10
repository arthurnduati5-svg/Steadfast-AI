import { describe, it, expect } from 'vitest';
import { TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS } from '../contracts/task034ControlledLimitedRolloutContracts';

describe('task034 no live school connector write', () => {
  it('forbids liveConnector', () => {
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('liveConnector');
  });

  it('forbids sisClient', () => {
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('sisClient');
  });

  it('forbids liveConnector before school-wide connector writes', () => {
    const idx = TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS.indexOf('liveConnector');
    expect(idx).toBeGreaterThanOrEqual(0);
  });

  it('forbids sisClient before SIS integration', () => {
    const idx = TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS.indexOf('sisClient');
    expect(idx).toBeGreaterThanOrEqual(0);
  });

  it('array length is sufficient for connector patterns', () => {
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS.length).toBeGreaterThanOrEqual(14);
  });

  it('does not contain writeLiveConnector (task032-specific)', () => {
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS).not.toContain('writeLiveConnector');
  });
});

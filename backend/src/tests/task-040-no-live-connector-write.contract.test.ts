import { describe, it, expect } from 'vitest';
import { TASK040_FORBIDDEN_SCOPES, TASK040_FORBIDDEN_SIDE_EFFECT_PATTERNS } from '../contracts/task040BackendFreezeContracts';

describe('Task 040 no live connector write', () => {
  it('forbids live_connector_write in forbidden scopes', () => {
    expect(TASK040_FORBIDDEN_SCOPES.includes('live_connector_write')).toBe(true);
  });

  it('forbids liveConnector pattern', () => {
    expect(TASK040_FORBIDDEN_SIDE_EFFECT_PATTERNS.includes('liveConnector')).toBe(true);
  });

  it('forbids sisClient pattern', () => {
    expect(TASK040_FORBIDDEN_SIDE_EFFECT_PATTERNS.includes('sisClient')).toBe(true);
  });
});

import { describe, it, expect } from 'vitest';
import {
  ControlledCanaryState, CanaryActivationMode, CanaryVerdict,
} from '../contracts/task032ControlledCanaryActivationContracts';

describe('Continuity: Task 032 Contracts', () => {
  it('ControlledCanaryState type is importable', () => {
    const s: ControlledCanaryState = 'pre_flight';
    expect(s).toBe('pre_flight');
  });

  it('CanaryActivationMode type is importable', () => {
    const m: CanaryActivationMode = 'automated';
    expect(m).toBe('automated');
  });

  it('CanaryVerdict type is importable', () => {
    const v: CanaryVerdict = 'safe';
    expect(v).toBe('safe');
  });
});

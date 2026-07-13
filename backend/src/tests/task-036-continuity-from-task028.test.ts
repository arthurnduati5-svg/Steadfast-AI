import { describe, it, expect } from 'vitest';
import {
  ExpansionExecutionState, RolloutPhase, RolloutStrategy,
} from '../contracts/task028ControlledExpansionExecutionContracts';

describe('Continuity: Task 028 Contracts', () => {
  it('ExpansionExecutionState type is importable', () => {
    const s: ExpansionExecutionState = 'planning';
    expect(s).toBe('planning');
  });

  it('RolloutPhase type is importable', () => {
    const p: RolloutPhase = 'canary';
    expect(p).toBe('canary');
  });

  it('RolloutStrategy type is importable', () => {
    const r: RolloutStrategy = 'percentage_based';
    expect(r).toBe('percentage_based');
  });
});

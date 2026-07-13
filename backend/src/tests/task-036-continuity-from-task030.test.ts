import { describe, it, expect } from 'vitest';
import {
  StagingRehearsalState, RehearsalStep, RehearsalVerdict,
} from '../contracts/task030ControlledStagingRehearsalContracts';

describe('Continuity: Task 030 Contracts', () => {
  it('StagingRehearsalState type is importable', () => {
    const s: StagingRehearsalState = 'preparation';
    expect(s).toBe('preparation');
  });

  it('RehearsalStep type is importable', () => {
    const step: RehearsalStep = 'smoke_test';
    expect(step).toBe('smoke_test');
  });

  it('RehearsalVerdict type is importable', () => {
    const v: RehearsalVerdict = 'pass';
    expect(v).toBe('pass');
  });
});

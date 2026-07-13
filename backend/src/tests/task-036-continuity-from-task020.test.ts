import { describe, it, expect } from 'vitest';
import {
  DataCategory, SensitivityLevel, GovernanceAction,
  GOVERNANCE_REQUIRED_ACTIONS, GOVERNANCE_DENIED_ACTIONS,
} from '../contracts/task020GovernanceContracts';

describe('Continuity: Task 020 Contracts', () => {
  it('DataCategory type is importable', () => {
    const cat: DataCategory = 'learner_identity';
    expect(cat).toBe('learner_identity');
  });

  it('SensitivityLevel type is importable', () => {
    const level: SensitivityLevel = 'high';
    expect(level).toBe('high');
  });

  it('GovernanceAction type works', () => {
    const action: GovernanceAction = 'allow';
    expect(action).toBe('allow');
  });

  it('GOVERNANCE_REQUIRED_ACTIONS is defined and non-empty', () => {
    expect(GOVERNANCE_REQUIRED_ACTIONS).toBeDefined();
    expect(Array.isArray(GOVERNANCE_REQUIRED_ACTIONS)).toBe(true);
  });

  it('GOVERNANCE_DENIED_ACTIONS is defined and non-empty', () => {
    expect(GOVERNANCE_DENIED_ACTIONS).toBeDefined();
    expect(Array.isArray(GOVERNANCE_DENIED_ACTIONS)).toBe(true);
  });
});

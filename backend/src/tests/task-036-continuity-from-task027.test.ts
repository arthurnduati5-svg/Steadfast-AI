import { describe, it, expect } from 'vitest';
import {
  PilotExpansionState, ExpansionApprovalStatus, ExpansionGate,
} from '../contracts/task027PilotExpansionGovernanceContracts';

describe('Continuity: Task 027 Contracts', () => {
  it('PilotExpansionState type is importable', () => {
    const s: PilotExpansionState = 'pending_review';
    expect(s).toBe('pending_review');
  });

  it('ExpansionApprovalStatus type is importable', () => {
    const a: ExpansionApprovalStatus = 'approved';
    expect(a).toBe('approved');
  });

  it('ExpansionGate type is importable', () => {
    const g: ExpansionGate = 'environment_check';
    expect(g).toBe('environment_check');
  });
});

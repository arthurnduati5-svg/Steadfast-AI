import { describe, it, expect } from 'vitest';
import {
  isTask032AdminOperatorRole,
  isTask032DeniedRealRole,
  resolveTask032ActorRole,
  TASK032_DENIED_REAL_ACTOR_ROLES
} from '../contracts/task032ControlledCanaryActivationContracts';

describe('Task 032 - Parent Denied Routes Contract', () => {
  it('should resolve parent role correctly', () => {
    expect(resolveTask032ActorRole('parent')).toBe('parent');
  });

  it('should deny parent from admin/operator functions', () => {
    expect(isTask032AdminOperatorRole('parent')).toBe(false);
  });

  it('should identify parent as denied real role', () => {
    expect(isTask032DeniedRealRole('parent')).toBe(true);
  });

  it('should list parent in denied roles', () => {
    expect(TASK032_DENIED_REAL_ACTOR_ROLES).toContain('parent');
  });

  it('should not list parent in allowed roles', () => {
    expect(isTask032AdminOperatorRole('parent')).toBe(false);
  });

  it('should deny parent from runtime guard', () => {
    expect(isTask032AdminOperatorRole('parent')).toBe(false);
  });

  it('should deny parent from config creation', () => {
    expect(isTask032AdminOperatorRole('parent')).toBe(false);
  });

  it('should deny parent from consent authorization', () => {
    expect(isTask032AdminOperatorRole('parent')).toBe(false);
  });
});

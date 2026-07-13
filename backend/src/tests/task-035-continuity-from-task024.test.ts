import { describe, it, expect } from 'vitest';
import { evaluateHealthCapacityBudget } from '../services/task035HealthCapacityBudgetService';
import { evaluateFullSchoolRollbackReadiness } from '../services/task035FullSchoolRollbackReadinessService';

describe('task035 continuity from task024 (operations readiness)', () => {
  it('health capacity budget service importable', () => {
    expect(typeof evaluateHealthCapacityBudget).toBe('function');
  });

  it('rollback readiness service importable', () => {
    expect(typeof evaluateFullSchoolRollbackReadiness).toBe('function');
  });

  it('health budget validates required budget gates', () => {
    const result = evaluateHealthCapacityBudget();
    expect(result.schoolWideSimulationLatencyBudgetPassed).toBe(true);
    expect(result.schoolWideSimulationErrorBudgetPassed).toBe(true);
    expect(result.authGateBudgetPassed).toBe(true);
    expect(result.ok).toBe(true);
  });

  it('rollback readiness validates pause/kill/rollback availability', () => {
    const result = evaluateFullSchoolRollbackReadiness();
    expect(result.pauseAvailable).toBe(true);
    expect(result.killSwitchAvailable).toBe(true);
    expect(result.rollbackPlanExists).toBe(true);
    expect(result.ok).toBe(true);
  });
});

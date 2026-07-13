import { describe, it, expect, beforeAll } from 'vitest';

describe('Task 035 - Health Capacity Budget', () => {
  let service: any;

  beforeAll(async () => {
    service = await import('../services/task035HealthCapacityBudgetService');
  });

  it('should export evaluateHealthCapacityBudget function', () => {
    expect(typeof service.evaluateHealthCapacityBudget).toBe('function');
  });

  it('should pass all budget checks', () => {
    const result = service.evaluateHealthCapacityBudget();
    expect(result.ok).toBe(true);
    expect(result.budgetMode).toBe('synthetic_school_wide_readiness_budget');
    expect(result.schoolWideSimulationLatencyBudgetPassed).toBe(true);
    expect(result.schoolWideSimulationErrorBudgetPassed).toBe(true);
    expect(result.authGateBudgetPassed).toBe(true);
    expect(result.privacyGateBudgetPassed).toBe(true);
    expect(result.socraticGateBudgetPassed).toBe(true);
    expect(result.deenGateBudgetPassed).toBe(true);
    expect(result.curriculumGateBudgetPassed).toBe(true);
    expect(result.observabilityReady).toBe(true);
  });
});

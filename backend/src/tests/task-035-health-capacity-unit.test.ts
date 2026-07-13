import { describe, it, expect } from 'vitest';
import { evaluateHealthCapacityBudget } from '../services/task035HealthCapacityBudgetService';

describe('task035HealthCapacityBudget', () => {
  it('should pass when all budget gates are green', () => {
    const result = evaluateHealthCapacityBudget();
    expect(result.ok).toBe(true);
    expect(result.blockingIssues).toHaveLength(0);
  });

  it('should have simulation latency and error budgets passed', () => {
    const result = evaluateHealthCapacityBudget();
    expect(result.schoolWideSimulationLatencyBudgetPassed).toBe(true);
    expect(result.schoolWideSimulationErrorBudgetPassed).toBe(true);
  });

  it('should have auth, privacy, socratic, deen, and curriculum gate budgets passed', () => {
    const result = evaluateHealthCapacityBudget();
    expect(result.authGateBudgetPassed).toBe(true);
    expect(result.privacyGateBudgetPassed).toBe(true);
    expect(result.socraticGateBudgetPassed).toBe(true);
    expect(result.deenGateBudgetPassed).toBe(true);
    expect(result.curriculumGateBudgetPassed).toBe(true);
  });

  it('should have memory, ai call, observability, and rollback alerting ready', () => {
    const result = evaluateHealthCapacityBudget();
    expect(result.memoryBudgetPassed).toBe(true);
    expect(result.aiCallBudgetPassed).toBe(true);
    expect(result.observabilityReady).toBe(true);
    expect(result.rollbackAlertingReady).toBe(true);
  });

  it('should have voice readiness classified and correct budget mode', () => {
    const result = evaluateHealthCapacityBudget();
    expect(result.voiceReadinessClassified).toBe(true);
    expect(result.budgetMode).toBe('synthetic_school_wide_readiness_budget');
  });
});

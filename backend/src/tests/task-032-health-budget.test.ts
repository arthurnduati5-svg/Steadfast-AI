import { describe, it, expect } from 'vitest';
import { runTask032CanaryHealthBudget } from '../services/task032CanaryHealthBudgetService';

describe('Task 032 - Health Budget', () => {
  it('should return overallPassed true with deterministic internal metrics', async () => {
    const result = await runTask032CanaryHealthBudget({
      activationId: 'act_001',
      schoolId: 'school_task032_safe',
    });
    expect(result.overallPassed).toBe(true);
    expect(result.ok).toBe(true);
    expect(result.blockingIssues).toHaveLength(0);
  });

  it('should have activationPreflightP95Ms under 2000ms', async () => {
    const result = await runTask032CanaryHealthBudget({
      activationId: 'act_001',
      schoolId: 'school_task032_safe',
    });
    expect(result.activationPreflightP95Ms).toBeLessThanOrEqual(2000);
    expect(result.activationPreflightBudgetPassed).toBe(true);
  });

  it('should have safeViewP95Ms under 1500ms', async () => {
    const result = await runTask032CanaryHealthBudget({
      activationId: 'act_001',
      schoolId: 'school_task032_safe',
    });
    expect(result.safeViewP95Ms).toBeLessThanOrEqual(1500);
    expect(result.safeViewBudgetPassed).toBe(true);
  });

  it('should have controlActionP95Ms under 1500ms', async () => {
    const result = await runTask032CanaryHealthBudget({
      activationId: 'act_001',
      schoolId: 'school_task032_safe',
    });
    expect(result.controlActionP95Ms).toBeLessThanOrEqual(1500);
    expect(result.controlActionBudgetPassed).toBe(true);
  });

  it('should have errorRate <= 0.01', async () => {
    const result = await runTask032CanaryHealthBudget({
      activationId: 'act_001',
      schoolId: 'school_task032_safe',
    });
    expect(result.errorRate).toBeLessThanOrEqual(0.01);
    expect(result.errorRateBudgetPassed).toBe(true);
  });

  it('should have criticalErrorCount = 0', async () => {
    const result = await runTask032CanaryHealthBudget({
      activationId: 'act_001',
      schoolId: 'school_task032_safe',
    });
    expect(result.criticalErrorCount).toBe(0);
    expect(result.criticalErrorBudgetPassed).toBe(true);
  });

  it('should have privacyBoundaryFailures = 0', async () => {
    const result = await runTask032CanaryHealthBudget({
      activationId: 'act_001',
      schoolId: 'school_task032_safe',
    });
    expect(result.privacyBoundaryFailures).toBe(0);
    expect(result.privacyBoundaryBudgetPassed).toBe(true);
  });

  it('should have schoolContextBypassCount = 0', async () => {
    const result = await runTask032CanaryHealthBudget({
      activationId: 'act_001',
      schoolId: 'school_task032_safe',
    });
    expect(result.schoolContextBypassCount).toBe(0);
    expect(result.schoolContextBypassBudgetPassed).toBe(true);
  });

  it('should have crossSchoolAccessCount = 0', async () => {
    const result = await runTask032CanaryHealthBudget({
      activationId: 'act_001',
      schoolId: 'school_task032_safe',
    });
    expect(result.crossSchoolAccessCount).toBe(0);
    expect(result.crossSchoolAccessBudgetPassed).toBe(true);
  });

  it('should return deterministic metric values', async () => {
    const result1 = await runTask032CanaryHealthBudget({ activationId: 'act_001', schoolId: 'school_task032_safe' });
    const result2 = await runTask032CanaryHealthBudget({ activationId: 'act_002', schoolId: 'other_school' });
    expect(result1.activationPreflightP95Ms).toBe(result2.activationPreflightP95Ms);
    expect(result1.safeViewP95Ms).toBe(result2.safeViewP95Ms);
    expect(result1.controlActionP95Ms).toBe(result2.controlActionP95Ms);
    expect(result1.errorRate).toBe(result2.errorRate);
  });

  it('should report ok same as overallPassed', async () => {
    const result = await runTask032CanaryHealthBudget({
      activationId: 'act_001',
      schoolId: 'school_task032_safe',
    });
    expect(result.ok).toBe(result.overallPassed);
  });
});

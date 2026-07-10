import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateTask034RolloutCap } from '../services/task034RolloutCapGateService';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

function validCapInput() {
  return {
    rolloutPercent: 20,
    expandedStudentCount: 50,
    maxRolloutPercent: 25,
    maxExpandedStudentCount: 100,
    schoolWideRequested: false,
    hundredPercentRequested: false,
    openCohortRequested: false,
    unknownCohortRequested: false,
    crossSchoolCohortRequested: false,
  };
}

describe('Task034 Rollout Cap Gate', () => {
  beforeEach(async () => {
    await task034Repository.clearTask034StoresForTests();
  });

  it('Valid 20% rolloutPercent and 50 students passes', () => {
    const result = evaluateTask034RolloutCap(validCapInput());
    expect(result.ok).toBe(true);
    expect(result.percentCapPassed).toBe(true);
    expect(result.studentCapPassed).toBe(true);
  });

  it('rolloutPercent > 25 fails', () => {
    const input = validCapInput();
    input.rolloutPercent = 30;
    const result = evaluateTask034RolloutCap(input);
    expect(result.ok).toBe(false);
    expect(result.percentCapPassed).toBe(false);
    expect(result.blockingIssues.some(i => i.includes('rollout_percent_exceeds_cap'))).toBe(true);
  });

  it('expandedStudentCount > 100 fails', () => {
    const input = validCapInput();
    input.expandedStudentCount = 150;
    const result = evaluateTask034RolloutCap(input);
    expect(result.ok).toBe(false);
    expect(result.studentCapPassed).toBe(false);
    expect(result.blockingIssues.some(i => i.includes('expanded_student_count_exceeds_cap'))).toBe(true);
  });

  it('schoolWideRequested true blocks', () => {
    const input = validCapInput();
    input.schoolWideRequested = true;
    const result = evaluateTask034RolloutCap(input);
    expect(result.ok).toBe(false);
    expect(result.schoolWideBlocked).toBe(true);
    expect(result.blockingIssues).toContain('school_wide_requested');
  });

  it('hundredPercentRequested true blocks', () => {
    const input = validCapInput();
    input.hundredPercentRequested = true;
    const result = evaluateTask034RolloutCap(input);
    expect(result.ok).toBe(false);
    expect(result.hundredPercentBlocked).toBe(true);
    expect(result.blockingIssues).toContain('hundred_percent_requested');
  });

  it('openCohortRequested true blocks', () => {
    const input = validCapInput();
    input.openCohortRequested = true;
    const result = evaluateTask034RolloutCap(input);
    expect(result.ok).toBe(false);
    expect(result.openCohortBlocked).toBe(true);
    expect(result.blockingIssues).toContain('open_cohort_requested');
  });

  it('unknownCohortRequested true blocks', () => {
    const input = validCapInput();
    input.unknownCohortRequested = true;
    const result = evaluateTask034RolloutCap(input);
    expect(result.ok).toBe(false);
    expect(result.unknownCohortBlocked).toBe(true);
  });

  it('crossSchoolCohortRequested true blocks', () => {
    const input = validCapInput();
    input.crossSchoolCohortRequested = true;
    const result = evaluateTask034RolloutCap(input);
    expect(result.ok).toBe(false);
    expect(result.crossSchoolCohortBlocked).toBe(true);
  });

  it('uses provided maxRolloutPercent', () => {
    const input = validCapInput();
    input.maxRolloutPercent = 10;
    const result = evaluateTask034RolloutCap(input);
    expect(result.ok).toBe(false);
    expect(result.maxRolloutPercent).toBe(10);
  });

  it('uses provided maxExpandedStudentCount', () => {
    const input = validCapInput();
    input.maxExpandedStudentCount = 10;
    const result = evaluateTask034RolloutCap(input);
    expect(result.ok).toBe(false);
    expect(result.maxExpandedStudentCount).toBe(10);
  });

  it('stores result in repository', async () => {
    evaluateTask034RolloutCap(validCapInput());
    const stored = await task034Repository.getRolloutCapGate();
    expect(stored).not.toBeNull();
    expect(stored!.rolloutPercent).toBe(20);
  });

  it('exact max rolloutPercent 25 passes', () => {
    const input = validCapInput();
    input.rolloutPercent = 25;
    const result = evaluateTask034RolloutCap(input);
    expect(result.percentCapPassed).toBe(true);
    expect(result.ok).toBe(true);
  });

  it('exact max studentCount 100 passes', () => {
    const input = validCapInput();
    input.expandedStudentCount = 100;
    const result = evaluateTask034RolloutCap(input);
    expect(result.studentCapPassed).toBe(true);
    expect(result.ok).toBe(true);
  });
});

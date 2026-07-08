import { describe, it, expect } from 'vitest';
import { evaluateCandidateCohortReadiness } from '../services/task025CandidateCohortReadinessService';
import type { Task025CandidateCohortInput } from '../contracts/task025ControlledPilotReadinessContracts';

function makeInput(overrides: Partial<Task025CandidateCohortInput> = {}): Task025CandidateCohortInput {
  return {
    schoolId: 'school-001',
    cohortId: 'cohort-001',
    cohortSize: 25,
    teacherOwner: 'teacher-1',
    supportOwner: 'support-1',
    sourceApprovedCurriculumContext: true,
    safeLearningContextAvailable: true,
    ...overrides,
  };
}

describe('evaluateCandidateCohortReadiness', () => {
  it('returns cohort_ready when all conditions pass', async () => {
    const result = await evaluateCandidateCohortReadiness(makeInput());

    expect(result.cohortStatus).toBe('cohort_ready');
    expect(result.riskLevel).toBe('low');
    expect(result.manualReviewRequired).toBe(false);
    expect(result.recommendedCohortType).toBe('standard');
    expect(result.readinessScore).toBe(100);
  });

  it('blocks cohort when teacher owner is missing', async () => {
    const result = await evaluateCandidateCohortReadiness(makeInput({ teacherOwner: '' }));

    expect(result.cohortStatus).toBe('cohort_blocked');
    expect(result.riskLevel).toBe('high');
    expect(result.manualReviewRequired).toBe(true);
    expect(result.recommendedCohortType).toBe('none');
    expect(result.safeBlockers.some((b) => b.severity === 'high')).toBe(true);
  });

  it('blocks cohort when support owner is missing', async () => {
    const result = await evaluateCandidateCohortReadiness(makeInput({ supportOwner: '' }));

    expect(result.cohortStatus).toBe('cohort_blocked');
    expect(result.manualReviewRequired).toBe(true);
    expect(result.safeBlockers.some((b) => b.severity === 'high')).toBe(true);
  });

  it('returns cohort_manual_review when cohort exceeds 50', async () => {
    const result = await evaluateCandidateCohortReadiness(makeInput({ cohortSize: 60 }));

    expect(result.cohortStatus).toBe('cohort_manual_review');
    expect(result.riskLevel).toBe('medium');
    expect(result.readinessScore).toBe(80);
    expect(result.safeBlockers).toHaveLength(1);
  });

  it('returns cohort_manual_review when source-approved curriculum is missing', async () => {
    const result = await evaluateCandidateCohortReadiness(makeInput({ sourceApprovedCurriculumContext: false }));

    expect(result.cohortStatus).toBe('cohort_manual_review');
    expect(result.riskLevel).toBe('medium');
    expect(result.safeBlockers.some((b) => b.type === 'content_governance')).toBe(true);
  });

  it('adds low severity blocker when cohort is very small', async () => {
    const result = await evaluateCandidateCohortReadiness(makeInput({ cohortSize: 3 }));

    expect(result.safeBlockers.some((b) => b.severity === 'low')).toBe(true);
    expect(result.readinessScore).toBe(90);
  });

  it('readiness score is clamped to a minimum of 0', async () => {
    const result = await evaluateCandidateCohortReadiness(makeInput({
      teacherOwner: '',
      supportOwner: '',
      cohortSize: 100,
      sourceApprovedCurriculumContext: false,
      safeLearningContextAvailable: false,
    }));

    expect(result.readinessScore).toBe(5);
    expect(result.safeBlockers.length).toBeGreaterThanOrEqual(5);
  });

  it('blocking a cohort with high severity blocker prevents standard type', async () => {
    const result = await evaluateCandidateCohortReadiness(makeInput({ teacherOwner: '' }));

    expect(result.recommendedCohortType).toBe('none');
    expect(result.cohortStatus).toBe('cohort_blocked');
  });
});

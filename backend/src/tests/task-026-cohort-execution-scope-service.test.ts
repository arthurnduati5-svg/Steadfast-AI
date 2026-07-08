import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateCohortScope } from '../services/task026CohortExecutionScopeService';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';

describe('task026CohortExecutionScopeService', () => {
  beforeEach(() => {
    task026PilotExecutionRepository.clearTask026StoresForTests();
  });

  it('rejects missing schoolId', async () => {
    const result = await evaluateCohortScope({ schoolId: '', cohortId: 'c1', cohortSize: 20, teacherOwnerId: 't1', supportOwnerId: 's1', approvedCurriculumScopeIds: [], approvedSourceScopeIds: [] });
    expect(result.status).toBe('cohort_denied_not_verified');
  });

  it('rejects cohort size out of range', async () => {
    const result = await evaluateCohortScope({ schoolId: 's1', cohortId: 'c1', cohortSize: 0, teacherOwnerId: 't1', supportOwnerId: 's1', approvedCurriculumScopeIds: [], approvedSourceScopeIds: [] });
    expect(result.status).toBe('cohort_denied_not_verified');
    expect(result.reasonCodes).toContain('invalid_cohort_size');
  });

  it('rejects cohort size > 100', async () => {
    const result = await evaluateCohortScope({ schoolId: 's1', cohortId: 'c1', cohortSize: 200, teacherOwnerId: 't1', supportOwnerId: 's1', approvedCurriculumScopeIds: [], approvedSourceScopeIds: [] });
    expect(result.valid === false || result.status === 'cohort_denied_not_verified').toBe(true);
  });

  it('rejects missing teacher owner', async () => {
    const result = await evaluateCohortScope({ schoolId: 's1', cohortId: 'c1', cohortSize: 20, teacherOwnerId: '', supportOwnerId: 's1', approvedCurriculumScopeIds: [], approvedSourceScopeIds: [] });
    expect(result.status).toBe('cohort_denied_not_verified');
    expect(result.reasonCodes).toContain('teacher_owner_not_found');
  });

  it('rejects missing support owner', async () => {
    const result = await evaluateCohortScope({ schoolId: 's1', cohortId: 'c1', cohortSize: 20, teacherOwnerId: 't1', supportOwnerId: '', approvedCurriculumScopeIds: [], approvedSourceScopeIds: [] });
    expect(result.status).toBe('cohort_denied_not_verified');
  });

  it('rejects cohort not found in school runs', async () => {
    const result = await evaluateCohortScope({ schoolId: 's1', cohortId: 'nonexistent', cohortSize: 20, teacherOwnerId: 't1', supportOwnerId: 's1', approvedCurriculumScopeIds: ['cur1'], approvedSourceScopeIds: ['src1'] });
    expect(result.status).toBe('cohort_denied_not_verified');
    expect(result.reasonCodes).toContain('cohort_not_in_school');
  });

  it('approves cohort when found in school runs with scope', async () => {
    await task026PilotExecutionRepository.createPilotRun({
      schoolId: 's1', pilotProgramId: 'pp-1', status: 'ready',
      cohortIds: ['c1'], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
      approvedCurriculumScopeIds: ['cur1'], approvedSourceScopeIds: ['src1'],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const result = await evaluateCohortScope({ schoolId: 's1', cohortId: 'c1', cohortSize: 20, teacherOwnerId: 't1', supportOwnerId: 's1', approvedCurriculumScopeIds: ['cur1'], approvedSourceScopeIds: ['src1'] });
    expect(result.status).toBe('cohort_approved');
  });

  it('returns denied if cohort not in approved scope', async () => {
    await task026PilotExecutionRepository.createPilotRun({
      schoolId: 's1', pilotProgramId: 'pp-1', status: 'ready',
      cohortIds: ['c1'], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
      approvedCurriculumScopeIds: ['cur1'], approvedSourceScopeIds: ['src1'],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const result = await evaluateCohortScope({ schoolId: 's1', cohortId: 'c1', cohortSize: 20, teacherOwnerId: 't1', supportOwnerId: 's1', approvedCurriculumScopeIds: ['cur_other'], approvedSourceScopeIds: ['src_other'] });
    expect(result.status).toBe('cohort_denied_not_verified');
  });
});

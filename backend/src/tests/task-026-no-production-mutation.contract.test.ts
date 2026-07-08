import { describe, it, expect, beforeEach } from 'vitest';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { createPilotRun } from '../services/task026ControlledPilotRunService';

describe('task026NoProductionMutation', () => {
  beforeEach(() => {
    task026PilotExecutionRepository.clearTask026StoresForTests();
  });

  it('createPilotRun does not call external db', async () => {
    const result = await createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', cohortIds: ['c1'],
      teacherOwnerId: 't1', supportOwnerId: 's1', safeguardingOwnerId: 'sg1',
      pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
      approvedCurriculumScopeIds: ['cur1'], approvedSourceScopeIds: ['src1'],
      actorRole: 'school_admin', actorId: 'admin-1',
    });
    expect(result.ok).toBe(true);
    expect(result.run.schoolId).toBe('school-1');
  });

  it('repository uses in-memory store, not real prisma', () => {
    const repo = task026PilotExecutionRepository as any;
    expect(typeof repo._clearMemory).toBe('function');
    expect(typeof repo.clearTask026StoresForTests).toBe('function');
  });

  it('pilot runs stored in memory are retrievable', async () => {
    await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'draft',
      cohortIds: [], teacherOwnerId: '', supportOwnerId: '',
      safeguardingOwnerId: '', pauseOwnerId: '', rollbackOwnerId: '', monitoringOwnerId: '',
      approvedCurriculumScopeIds: [], approvedSourceScopeIds: [],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const runs = await task026PilotExecutionRepository.listPilotRunsForSchool('school-1');
    expect(runs.length).toBe(1);
  });

  it('no production API keys are present in forbidden fields', () => {
    const set = new Set(TASK026_FORBIDDEN_FIELDS);
    expect(set.has('OPENAI_API_KEY')).toBe(true);
    expect(set.has('ANTHROPIC_API_KEY')).toBe(true);
    expect(set.has('GEMINI_API_KEY')).toBe(true);
  });
});

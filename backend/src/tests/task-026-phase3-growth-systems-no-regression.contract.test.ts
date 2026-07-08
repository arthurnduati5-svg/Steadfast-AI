import { describe, it, expect, beforeEach } from 'vitest';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { evaluateGate } from '../services/task026PilotExecutionGateService';
import { checkTask024OperationsDependency } from '../services/task026Task024OperationsDependencyService';

describe('task026Phase3GrowthSystemsNoRegression', () => {
  beforeEach(() => {
    task026PilotExecutionRepository.clearTask026StoresForTests();
  });

  it('gate service still validates school context', async () => {
    const result = await evaluateGate({ runId: 'r1', schoolId: '', actorRole: 'school_admin', action: 'activate_run' });
    expect(result.allowed).toBe(false);
  });

  it('gate service still validates authorized roles', async () => {
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'draft',
      cohortIds: [], teacherOwnerId: '', supportOwnerId: '',
      safeguardingOwnerId: '', pauseOwnerId: '', rollbackOwnerId: '', monitoringOwnerId: '',
      approvedCurriculumScopeIds: [], approvedSourceScopeIds: [],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const result = await evaluateGate({ runId: run.id, schoolId: 'school-1', actorRole: 'learner_in_approved_pilot_cohort', action: 'activate_run' });
    expect(result.allowed).toBe(false);
    expect(result.gateResults.actor_authorized).toBe(false);
  });

  it('task024 dependency still checks pause owner', async () => {
    const result = await checkTask024OperationsDependency({ schoolId: 'school-1', actorId: 'a1', actorRole: 'school_admin' });
    expect(result.status).toBe('blocked');
    expect(result.reasonCodes).toContain('task024_not_ready');
  });

  it('repository still supports clearTask026StoresForTests', () => {
    expect(typeof task026PilotExecutionRepository.clearTask026StoresForTests).toBe('function');
  });

  it('repository still supports createPilotRun', () => {
    expect(typeof task026PilotExecutionRepository.createPilotRun).toBe('function');
  });

  it('forbidden fields still include rawChat', () => {
    const { TASK026_FORBIDDEN_FIELDS } = require('../contracts/task026ControlledPilotExecutionContracts');
    expect(TASK026_FORBIDDEN_FIELDS).toContain('rawChat');
  });

  it('ALLOWED_EXECUTION_TRANSITIONS still enforces rules', () => {
    const { ALLOWED_EXECUTION_TRANSITIONS } = require('../contracts/task026ControlledPilotExecutionContracts');
    expect(ALLOWED_EXECUTION_TRANSITIONS.blocked).toEqual([]);
    expect(ALLOWED_EXECUTION_TRANSITIONS.rolled_back).toEqual(['blocked']);
  });
});

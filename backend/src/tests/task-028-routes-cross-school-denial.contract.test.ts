import { describe, it, expect, beforeEach } from 'vitest';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import { task027PilotExpansionRepository } from '../repositories/task027PilotExpansionRepository';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { checkExpandedSessionGate } from '../services/task028ExpandedRuntimeGuardService';
import { TASK028_DENIED_ROLES } from '../contracts/task028ControlledExpansionExecutionContracts';

describe('task028RoutesCrossSchoolDenial', () => {
  beforeEach(() => {
    task028ExpansionExecutionRepository._clearMemory();
    task027PilotExpansionRepository._clearMemory();
    task026PilotExecutionRepository._clearMemory();
    task025PilotRepository._clearMemory();
    process.env.NODE_ENV = 'test';
    delete process.env.TASK028_REQUIRE_REAL_PRISMA;
  });

  it('denied roles include cross_school_actor', () => {
    expect(TASK028_DENIED_ROLES).toContain('cross_school_actor');
  });

  it('gate blocks when schoolId is empty string', async () => {
    const result = await checkExpandedSessionGate({
      schoolId: '',
      executionRunId: 'run-1',
      actorIdHash: 'hash-1',
      role: 'student',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('no_verified_school_identity');
  });

  it('gate blocks when schoolId is unknown', async () => {
    const result = await checkExpandedSessionGate({
      schoolId: 'unknown',
      executionRunId: 'run-1',
      actorIdHash: 'hash-1',
      role: 'student',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('no_verified_school_identity');
  });

  it('gate blocks when execution run does not exist regardless of school', async () => {
    const result = await checkExpandedSessionGate({
      schoolId: 'school-other',
      executionRunId: 'nonexistent',
      actorIdHash: 'hash-1',
      role: 'student',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('expansion_execution_run_not_found');
  });

  it('cross_school_actor is not in actor roles list', () => {
    const { TASK028_ACTOR_ROLES } = require('../contracts/task028ControlledExpansionExecutionContracts');
    expect(TASK028_ACTOR_ROLES).not.toContain('cross_school_actor');
  });
});

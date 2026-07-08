import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateExpandedLearnerAccess } from '../services/task028ExpandedLearnerAccessGateService';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';

describe('Task 028 Expanded Learner Access Gate Service', () => {
  let runId: string;

  beforeEach(async () => {
    task028ExpansionExecutionRepository._clearMemory();
    process.env.NODE_ENV = 'test';
    delete process.env.TASK028_REQUIRE_REAL_PRISMA;

    const run = await task028ExpansionExecutionRepository.createExecutionRun({
      expansionProposalId: 'prop-1', pilotProgramId: 'pp-1',
      schoolId: 'school-1', status: 'stage_1_active', safeSummary: 'Active run',
    });
    runId = (run as any).id;

    await task028ExpansionExecutionRepository.createExpandedParticipant({
      executionRunId: runId, pilotProgramId: 'pp-1', schoolId: 'school-1',
      actorIdHash: 'learner-1', role: 'student',
      activationStatus: 'active', curriculumScopes: ['Math'],
    });
  });

  it('should allow access for valid learner', async () => {
    const result = await evaluateExpandedLearnerAccess({
      schoolId: 'school-1', learnerId: 'learner-1',
      runId, requestType: 'session_start',
    });
    expect(result.allowed).toBe(true);
    expect(result.status).toBe('allowed');
    expect(result.reasonCodes).toEqual([]);
  });

  it('should deny access for learner not in cohort', async () => {
    const result = await evaluateExpandedLearnerAccess({
      schoolId: 'school-1', learnerId: 'unknown-learner',
      runId, requestType: 'session_start',
    });
    expect(result.allowed).toBe(false);
    expect(result.status).toBe('denied_not_in_cohort');
    expect(result.reasonCodes).toContain('learner_not_in_cohort');
  });

  it('should deny access when run is blocked', async () => {
    await task028ExpansionExecutionRepository.updateExecutionRun(runId, { status: 'blocked' });
    const result = await evaluateExpandedLearnerAccess({
      schoolId: 'school-1', learnerId: 'learner-1',
      runId, requestType: 'session_start',
    });
    expect(result.allowed).toBe(false);
    expect(result.status).toBe('denied_run_not_active');
  });

  it('should deny access when run is paused', async () => {
    await task028ExpansionExecutionRepository.updateExecutionRun(runId, { status: 'paused' });
    const result = await evaluateExpandedLearnerAccess({
      schoolId: 'school-1', learnerId: 'learner-1',
      runId, requestType: 'session_start',
    });
    expect(result.allowed).toBe(false);
    expect(result.status).toBe('denied_run_paused');
  });

  it('should deny access when run is rolled back', async () => {
    await task028ExpansionExecutionRepository.updateExecutionRun(runId, { status: 'rolled_back' });
    const result = await evaluateExpandedLearnerAccess({
      schoolId: 'school-1', learnerId: 'learner-1',
      runId, requestType: 'session_start',
    });
    expect(result.allowed).toBe(false);
    expect(result.status).toBe('denied_run_not_active');
  });

  it('should deny access when school mismatches', async () => {
    const result = await evaluateExpandedLearnerAccess({
      schoolId: 'other-school', learnerId: 'learner-1',
      runId, requestType: 'session_start',
    });
    expect(result.allowed).toBe(false);
    expect(result.status).toBe('denied_school_context');
  });

  it('should deny access for non-active participant status', async () => {
    await task028ExpansionExecutionRepository.createExpandedParticipant({
      executionRunId: runId, pilotProgramId: 'pp-1', schoolId: 'school-1',
      actorIdHash: 'learner-2', role: 'student',
      activationStatus: 'pending',
    });
    const result = await evaluateExpandedLearnerAccess({
      schoolId: 'school-1', learnerId: 'learner-2',
      runId, requestType: 'session_start',
    });
    expect(result.allowed).toBe(false);
  });

  it('should deny answer_key_request type', async () => {
    const result = await evaluateExpandedLearnerAccess({
      schoolId: 'school-1', learnerId: 'learner-1',
      runId, requestType: 'answer_key_request',
    });
    expect(result.allowed).toBe(false);
    expect(result.status).toBe('denied_answer_key_request');
  });

  it('should reject invalid input', async () => {
    const result = await evaluateExpandedLearnerAccess({
      schoolId: '', learnerId: '', runId: '', requestType: '',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes.length).toBeGreaterThan(0);
  });

  it('should deny when run does not exist', async () => {
    const result = await evaluateExpandedLearnerAccess({
      schoolId: 'school-1', learnerId: 'learner-1',
      runId: 'nonexistent', requestType: 'session_start',
    });
    expect(result.allowed).toBe(false);
    expect(result.status).toBe('denied_run_not_active');
    expect(result.reasonCodes).toContain('execution_run_not_found');
  });
});

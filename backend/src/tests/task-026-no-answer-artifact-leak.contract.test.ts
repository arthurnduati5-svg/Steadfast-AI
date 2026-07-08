import { describe, it, expect } from 'vitest';
import { TASK026_FORBIDDEN_FIELDS } from '../contracts/task026ControlledPilotExecutionContracts';
import { rejectTask026ForbiddenFields } from '../lib/task026ControlledPilotExecutionValidation';

describe('task026NoAnswerArtifactLeak', () => {
  it('answerKey is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('answerKey');
  });

  it('correctAnswer is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('correctAnswer');
  });

  it('modelAnswer is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('modelAnswer');
  });

  it('markingScheme is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('markingScheme');
  });

  it('rawStudentAnswer is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('rawStudentAnswer');
  });

  it('rawStudentWork is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('rawStudentWork');
  });

  it('rejectTask026ForbiddenFields blocks answerKey', () => {
    expect(rejectTask026ForbiddenFields({ answerKey: 'secret-answer' })).not.toBeNull();
  });

  it('rejectTask026ForbiddenFields blocks modelAnswer nested', () => {
    expect(rejectTask026ForbiddenFields({ results: [{ modelAnswer: 'the answer' }] })).not.toBeNull();
  });

  it('learner access gate blocks answer_key requests', async () => {
    const { evaluateLearnerAccess } = await import('../services/task026LearnerAccessGateService');
    const { task026PilotExecutionRepository } = await import('../repositories/task026PilotExecutionRepository');
    task026PilotExecutionRepository.clearTask026StoresForTests();
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'active_controlled',
      cohortIds: ['c1'], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
      approvedCurriculumScopeIds: ['cur1'], approvedSourceScopeIds: ['src1'],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const result = await evaluateLearnerAccess({ schoolId: 'school-1', learnerId: 'l1', cohortId: 'c1', pilotRunId: run.id, requestedContentType: 'answer_key' });
    expect(result.allowed).toBe(false);
    expect(result.status).toBe('access_denied_answer_key_request');
  });
});

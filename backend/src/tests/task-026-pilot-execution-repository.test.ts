import { describe, it, expect, beforeEach } from 'vitest';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';

describe('task026PilotExecutionRepository', () => {
  beforeEach(() => {
    task026PilotExecutionRepository.clearTask026StoresForTests();
  });

  it('should create a pilot run with draft status', async () => {
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'draft',
      cohortIds: ['c1'], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1',
      monitoringOwnerId: 'm1', approvedCurriculumScopeIds: ['cur1'], approvedSourceScopeIds: ['src1'],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    expect(run).toBeTruthy();
    expect(run.schoolId).toBe('school-1');
    expect(run.status).toBe('draft');
    expect(run.id).toBeTruthy();
    expect(run.createdAt).toBeTruthy();
  });

  it('should get a pilot run by id', async () => {
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'draft',
      cohortIds: [], teacherOwnerId: '', supportOwnerId: '',
      safeguardingOwnerId: '', pauseOwnerId: '', rollbackOwnerId: '', monitoringOwnerId: '',
      approvedCurriculumScopeIds: [], approvedSourceScopeIds: [],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const found = await task026PilotExecutionRepository.getPilotRun(run.id);
    expect(found).not.toBeNull();
    expect(found!.id).toBe(run.id);
  });

  it('should return null for missing run', async () => {
    const found = await task026PilotExecutionRepository.getPilotRun('nonexistent');
    expect(found).toBeNull();
  });

  it('should update pilot run status', async () => {
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'draft',
      cohortIds: [], teacherOwnerId: '', supportOwnerId: '',
      safeguardingOwnerId: '', pauseOwnerId: '', rollbackOwnerId: '', monitoringOwnerId: '',
      approvedCurriculumScopeIds: [], approvedSourceScopeIds: [],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const updated = await task026PilotExecutionRepository.updatePilotRunStatus(run.id, 'active_controlled', { activatedAt: new Date().toISOString() });
    expect(updated).not.toBeNull();
    expect(updated!.status).toBe('active_controlled');
  });

  it('should list pilot runs for school', async () => {
    await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'draft',
      cohortIds: [], teacherOwnerId: '', supportOwnerId: '',
      safeguardingOwnerId: '', pauseOwnerId: '', rollbackOwnerId: '', monitoringOwnerId: '',
      approvedCurriculumScopeIds: [], approvedSourceScopeIds: [],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-2', status: 'active_controlled',
      cohortIds: [], teacherOwnerId: '', supportOwnerId: '',
      safeguardingOwnerId: '', pauseOwnerId: '', rollbackOwnerId: '', monitoringOwnerId: '',
      approvedCurriculumScopeIds: [], approvedSourceScopeIds: [],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const runs = await task026PilotExecutionRepository.listPilotRunsForSchool('school-1');
    expect(runs.length).toBe(2);
  });

  it('should record and list evidence events', async () => {
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'draft',
      cohortIds: [], teacherOwnerId: '', supportOwnerId: '',
      safeguardingOwnerId: '', pauseOwnerId: '', rollbackOwnerId: '', monitoringOwnerId: '',
      approvedCurriculumScopeIds: [], approvedSourceScopeIds: [],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const event = await task026PilotExecutionRepository.recordEvidenceEvent({
      schoolId: 'school-1', pilotRunId: run.id, eventType: 'session_started', actorRole: 'learner', safeSummary: 'Session started', metadataSafeJson: {},
    });
    expect(event.id).toBeTruthy();
    const events = await task026PilotExecutionRepository.listEvidenceEvents(run.id);
    expect(events.length).toBe(1);
    expect(events[0].eventType).toBe('session_started');
  });

  it('should record and list audit events', async () => {
    const event = await task026PilotExecutionRepository.recordAuditEvent({
      runId: 'r1', schoolId: 'school-1', actorRole: 'admin', action: 'run_created', safeSummary: 'Created', metadataSafeJson: {},
    });
    expect(event.id).toBeTruthy();
    const events = await task026PilotExecutionRepository.listAuditEvents('r1');
    expect(events.length).toBe(1);
  });

  it('should clear all stores via clearTask026StoresForTests', async () => {
    await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'draft',
      cohortIds: [], teacherOwnerId: '', supportOwnerId: '',
      safeguardingOwnerId: '', pauseOwnerId: '', rollbackOwnerId: '', monitoringOwnerId: '',
      approvedCurriculumScopeIds: [], approvedSourceScopeIds: [],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    task026PilotExecutionRepository.clearTask026StoresForTests();
    const runs = await task026PilotExecutionRepository.listPilotRunsForSchool('school-1');
    expect(runs.length).toBe(0);
  });

  it('should record and list incident signals', async () => {
    const signal = await task026PilotExecutionRepository.recordIncidentSignal({
      schoolId: 'school-1', pilotRunId: 'r1', severity: 'high', category: 'test', safeSummary: 'Incident', metadataSafeJson: {}, recommendedAction: 'manual_review',
    });
    expect(signal.id).toBeTruthy();
    const signals = await task026PilotExecutionRepository.listIncidentSignals('r1');
    expect(signals.length).toBe(1);
  });

  it('should record and list safeguarding signals', async () => {
    const signal = await task026PilotExecutionRepository.recordSafeguardingSignal({
      schoolId: 'school-1', pilotRunId: 'r1', signalType: 'concerning_learner_behavior', severity: 'medium', source: 'system', safeSummary: 'Signal', requiresPause: false, requiresHumanReview: true, humanReviewPathExists: true, status: 'pending_review',
    });
    expect(signal.id).toBeTruthy();
    const signals = await task026PilotExecutionRepository.listSafeguardingSignals('r1');
    expect(signals.length).toBe(1);
  });
});

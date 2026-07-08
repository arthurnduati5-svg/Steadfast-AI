import { describe, it, expect, beforeEach } from 'vitest';
import { getSupportQueueMetadata } from '../services/task026SupportQueueMetadataService';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';

describe('task026SupportQueueMetadataService', () => {
  beforeEach(() => {
    task026PilotExecutionRepository.clearTask026StoresForTests();
  });

  it('rejects missing pilotRunId', async () => {
    const result = await getSupportQueueMetadata('', 'school-1');
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('missing_pilot_run_id');
  });

  it('rejects missing schoolId', async () => {
    const result = await getSupportQueueMetadata('r1', '');
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('missing_school_id');
  });

  it('rejects non-existent run', async () => {
    const result = await getSupportQueueMetadata('nonexistent', 'school-1');
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('run_not_found');
  });

  it('rejects school mismatch', async () => {
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'active_controlled',
      cohortIds: [], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
      approvedCurriculumScopeIds: [], approvedSourceScopeIds: [],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const result = await getSupportQueueMetadata(run.id, 'school-2');
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('school_mismatch');
  });

  it('returns metadata for valid run', async () => {
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'active_controlled',
      cohortIds: ['c1'], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
      approvedCurriculumScopeIds: ['cur1'], approvedSourceScopeIds: ['src1'],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const result = await getSupportQueueMetadata(run.id, 'school-1');
    expect(result.ok).toBe(true);
    expect(result.metadata).toBeTruthy();
    expect(result.metadata!.pilotRunId).toBe(run.id);
    expect(result.metadata!.status).toBe('active_controlled');
    expect(result.metadata!.hasSupportOwner).toBe(true);
    expect(result.metadata!.hasSafeguardingOwner).toBe(true);
  });

  it('sets queue priority to normal when no incidents', async () => {
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'active_controlled',
      cohortIds: [], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: '', pauseOwnerId: '', rollbackOwnerId: '', monitoringOwnerId: '',
      approvedCurriculumScopeIds: [], approvedSourceScopeIds: [],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const result = await getSupportQueueMetadata(run.id, 'school-1');
    expect(result.metadata!.queuePriority).toBe('normal');
  });

  it('sets queue priority to high when active incidents exist', async () => {
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'active_controlled',
      cohortIds: [], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: '', pauseOwnerId: '', rollbackOwnerId: '', monitoringOwnerId: '',
      approvedCurriculumScopeIds: [], approvedSourceScopeIds: [],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    await task026PilotExecutionRepository.recordIncidentSignal({ schoolId: 'school-1', pilotRunId: run.id, severity: 'high', category: 'test', safeSummary: 'Incident', metadataSafeJson: {}, recommendedAction: 'pause_pilot' });
    const result = await getSupportQueueMetadata(run.id, 'school-1');
    expect(result.metadata!.queuePriority).toBe('high');
  });

  it('counts support needed events', async () => {
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'active_controlled',
      cohortIds: [], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: '', pauseOwnerId: '', rollbackOwnerId: '', monitoringOwnerId: '',
      approvedCurriculumScopeIds: [], approvedSourceScopeIds: [],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    await task026PilotExecutionRepository.recordEvidenceEvent({ schoolId: 'school-1', pilotRunId: run.id, eventType: 'support_needed', actorRole: 'learner', safeSummary: 'Help', metadataSafeJson: {} });
    await task026PilotExecutionRepository.recordEvidenceEvent({ schoolId: 'school-1', pilotRunId: run.id, eventType: 'support_needed', actorRole: 'learner', safeSummary: 'Help 2', metadataSafeJson: {} });
    const result = await getSupportQueueMetadata(run.id, 'school-1');
    expect(result.metadata!.supportNeededCount).toBe(2);
  });
});

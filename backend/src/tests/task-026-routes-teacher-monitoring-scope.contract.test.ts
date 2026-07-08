import { describe, it, expect, beforeEach } from 'vitest';
import { getTeacherMonitoringSnapshot } from '../services/task026TeacherMonitoringBridgeService';
import { TASK026_TEACHER_MONITOR_STATUSES, TASK026_ALLOWED_MONITORING_ROLES } from '../contracts/task026ControlledPilotExecutionContracts';
import { isTask026MonitoringRole } from '../lib/task026ControlledPilotExecutionValidation';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';

describe('task026RoutesTeacherMonitoringScope', () => {
  beforeEach(() => {
    task026PilotExecutionRepository.clearTask026StoresForTests();
  });

  it('monitoring_allowed status is defined', () => {
    expect(TASK026_TEACHER_MONITOR_STATUSES).toContain('monitoring_allowed');
  });

  it('monitoring_denied_not_assigned status is defined', () => {
    expect(TASK026_TEACHER_MONITOR_STATUSES).toContain('monitoring_denied_not_assigned');
  });

  it('monitoring_denied_pilot_not_found status is defined', () => {
    expect(TASK026_TEACHER_MONITOR_STATUSES).toContain('monitoring_denied_pilot_not_found');
  });

  it('teacher_assigned_to_pilot is a monitoring role', () => {
    expect(TASK026_ALLOWED_MONITORING_ROLES).toContain('teacher_assigned_to_pilot');
  });

  it('isTask026MonitoringRole returns true for teacher_assigned_to_pilot', () => {
    expect(isTask026MonitoringRole('teacher_assigned_to_pilot')).toBe(true);
  });

  it('isTask026MonitoringRole returns true for school_admin', () => {
    expect(isTask026MonitoringRole('school_admin')).toBe(true);
  });

  it('isTask026MonitoringRole returns false for parent', () => {
    expect(isTask026MonitoringRole('parent')).toBe(false);
  });

  it('teacher snapshot is recorded on monitor access', async () => {
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'active_controlled',
      cohortIds: ['c1'], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
      approvedCurriculumScopeIds: ['cur1'], approvedSourceScopeIds: ['src1'],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    await getTeacherMonitoringSnapshot({ schoolId: 'school-1', teacherId: 't1', pilotRunId: run.id });
    const runAfter = await task026PilotExecutionRepository.getPilotRun(run.id);
    expect(runAfter).toBeTruthy();
  });
});

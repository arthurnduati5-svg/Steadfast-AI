import { describe, it, expect, beforeEach } from 'vitest';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';

describe('Task 026 Pilot Execution Routes Admin Scope', () => {
  beforeEach(() => {
    task025PilotRepository._clearMemory();
    task026PilotExecutionRepository._clearMemory();
  });

  it('should create execution run with admin as actor', async () => {
    const run = await task026PilotExecutionRepository.createExecutionRun({
      pilotProgramId: 'pp-test',
      schoolId: 'school-1',
      safeSummary: 'Admin created run',
    });

    expect((run as any).id).toBeTruthy();
    expect((run as any).schoolId).toBe('school-1');
  });

  it('should record events via admin action', async () => {
    const run = await task026PilotExecutionRepository.createExecutionRun({
      pilotProgramId: 'pp-test',
      schoolId: 'school-1',
      safeSummary: 'Event test run',
    });

    const event = await task026PilotExecutionRepository.createExecutionEvent({
      executionRunId: (run as any).id,
      pilotProgramId: 'pp-test',
      schoolId: 'school-1',
      actorRole: 'admin',
      eventType: 'pilot_paused',
      eventStatus: 'completed',
      safeSummary: 'Admin paused execution',
    });

    expect((event as any).eventType).toBe('pilot_paused');
    expect((event as any).actorRole).toBe('admin');
  });

  it('should list audit records by execution run', async () => {
    const run = await task026PilotExecutionRepository.createExecutionRun({
      pilotProgramId: 'pp-test',
      schoolId: 'school-1',
      safeSummary: 'Audit test run',
    });

    await task026PilotExecutionRepository.createAuditRecord({
      executionRunId: (run as any).id,
      pilotProgramId: 'pp-test',
      schoolId: 'school-1',
      actorRole: 'admin',
      action: 'pilot_execution_started',
      safeSummary: 'Execution started',
    });

    await task026PilotExecutionRepository.createAuditRecord({
      executionRunId: (run as any).id,
      pilotProgramId: 'pp-test',
      schoolId: 'school-1',
      actorRole: 'admin',
      action: 'pilot_paused',
      safeSummary: 'Execution paused',
    });

    const audits = await task026PilotExecutionRepository.listAuditRecords((run as any).id);
    expect(audits.length).toBe(2);
  });
});

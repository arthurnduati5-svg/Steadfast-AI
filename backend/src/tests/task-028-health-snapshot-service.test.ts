import { describe, it, expect, beforeEach } from 'vitest';
import { createHealthSnapshot, classifyHealth } from '../services/task028ExpansionHealthSnapshotService';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import type { ExpansionHealthSnapshotInput } from '../contracts/task028ExpansionExecutionContracts';

describe('Task 028 Health Snapshot Service', () => {
  let executionRunId: string;

  beforeEach(async () => {
    task028ExpansionExecutionRepository._clearMemory();
    process.env.NODE_ENV = 'test';
    delete process.env.TASK028_REQUIRE_REAL_PRISMA;

    const run = await task028ExpansionExecutionRepository.createExecutionRun({
      expansionProposalId: 'p1', pilotProgramId: 'pp-1', schoolId: 'school-1', safeSummary: 'Run',
    });
    executionRunId = (run as any).id;
  });

  it('should generate a healthy health snapshot', async () => {
    const input: ExpansionHealthSnapshotInput = {
      executionRunId,
      pilotProgramId: 'pp-1',
      schoolId: 'school-1',
      activeExpandedSessions: 5,
      allowedExpandedSessionStarts: 20,
      blockedExpandedSessionStarts: 0,
      schoolAuthBlocks: 0,
      cohortScopeBlocks: 0,
      curriculumGateBlocks: 0,
      socraticGateBlocks: 0,
      deenGateBlocks: 0,
      privacyGateBlocks: 0,
      aiCallBlocks: 0,
      memoryAccessBlocks: 0,
      evidenceWriteBlocks: 0,
      feedbackCount: 3,
      oversightItemCount: 0,
      interventionCount: 0,
      incidentBridgeCount: 0,
      errorCount: 0,
      safeSummary: 'All systems healthy',
    };
    const result = await createHealthSnapshot(input);
    expect(result.ok).toBe(true);
    expect(result.snapshotId).toBeTruthy();
    expect(result.healthStatus).toBe('healthy');
    expect(result.reasonCodes).toEqual([]);
  });

  it('should classify health as critical when privacy gate blocks exist', async () => {
    const input: ExpansionHealthSnapshotInput = {
      executionRunId,
      pilotProgramId: 'pp-1',
      schoolId: 'school-1',
      activeExpandedSessions: 5,
      allowedExpandedSessionStarts: 10,
      blockedExpandedSessionStarts: 0,
      schoolAuthBlocks: 0,
      cohortScopeBlocks: 0,
      curriculumGateBlocks: 0,
      socraticGateBlocks: 0,
      deenGateBlocks: 0,
      privacyGateBlocks: 3,
      aiCallBlocks: 0,
      memoryAccessBlocks: 0,
      evidenceWriteBlocks: 0,
      feedbackCount: 0,
      oversightItemCount: 0,
      interventionCount: 0,
      incidentBridgeCount: 0,
      errorCount: 0,
      safeSummary: 'Privacy gate blocks detected',
    };
    const result = await createHealthSnapshot(input);
    expect(result.healthStatus).toBe('critical');
    expect(result.reasonCodes).toContain('critical_health');
  });

  it('should classify health as degraded when socratic gate blocks are present but <= 5', async () => {
    const input: ExpansionHealthSnapshotInput = {
      executionRunId,
      pilotProgramId: 'pp-1',
      schoolId: 'school-1',
      activeExpandedSessions: 5,
      allowedExpandedSessionStarts: 10,
      blockedExpandedSessionStarts: 0,
      schoolAuthBlocks: 0,
      cohortScopeBlocks: 0,
      curriculumGateBlocks: 0,
      socraticGateBlocks: 3,
      deenGateBlocks: 0,
      privacyGateBlocks: 0,
      aiCallBlocks: 0,
      memoryAccessBlocks: 0,
      evidenceWriteBlocks: 0,
      feedbackCount: 0,
      oversightItemCount: 0,
      interventionCount: 0,
      incidentBridgeCount: 0,
      errorCount: 0,
      safeSummary: 'Socratic gate blocks detected',
    };
    const result = await createHealthSnapshot(input);
    expect(result.healthStatus).toBe('degraded');
    expect(result.reasonCodes).toContain('degraded_health');
  });

  it('should classify health as critical when socratic gate blocks exceed 5', async () => {
    const input: ExpansionHealthSnapshotInput = {
      executionRunId,
      pilotProgramId: 'pp-1',
      schoolId: 'school-1',
      activeExpandedSessions: 5,
      allowedExpandedSessionStarts: 10,
      blockedExpandedSessionStarts: 0,
      schoolAuthBlocks: 0,
      cohortScopeBlocks: 0,
      curriculumGateBlocks: 0,
      socraticGateBlocks: 6,
      deenGateBlocks: 0,
      privacyGateBlocks: 0,
      aiCallBlocks: 0,
      memoryAccessBlocks: 0,
      evidenceWriteBlocks: 0,
      feedbackCount: 0,
      oversightItemCount: 0,
      interventionCount: 0,
      incidentBridgeCount: 0,
      errorCount: 0,
      safeSummary: 'High socratic gate blocks',
    };
    const result = await createHealthSnapshot(input);
    expect(result.healthStatus).toBe('critical');
  });

  it('should classify health as watch when error count is between 21 and 50', async () => {
    const input: ExpansionHealthSnapshotInput = {
      executionRunId,
      pilotProgramId: 'pp-1',
      schoolId: 'school-1',
      activeExpandedSessions: 5,
      allowedExpandedSessionStarts: 10,
      blockedExpandedSessionStarts: 0,
      schoolAuthBlocks: 0,
      cohortScopeBlocks: 0,
      curriculumGateBlocks: 0,
      socraticGateBlocks: 0,
      deenGateBlocks: 0,
      privacyGateBlocks: 0,
      aiCallBlocks: 0,
      memoryAccessBlocks: 0,
      evidenceWriteBlocks: 0,
      feedbackCount: 0,
      oversightItemCount: 0,
      interventionCount: 0,
      incidentBridgeCount: 0,
      errorCount: 25,
      safeSummary: 'Elevated error count',
    };
    const result = await createHealthSnapshot(input);
    expect(result.healthStatus).toBe('watch');
  });

  it('should return error for missing required fields', async () => {
    const result = await createHealthSnapshot({
      executionRunId: '',
      pilotProgramId: '',
      schoolId: '',
    } as any);
    expect(result.ok).toBe(false);
    expect(result.healthStatus).toBe('critical');
    expect(result.reasonCodes).toContain('missing_required_fields');
  });

  it('should classify health via standalone function', () => {
    const healthy = classifyHealth({ blockedExpandedSessionStarts: 0, errorCount: 0, curriculumGateBlocks: 0, schoolAuthBlocks: 0 } as any);
    expect(healthy).toBe('healthy');
    const critical = classifyHealth({ privacyGateBlocks: 1 } as any);
    expect(critical).toBe('critical');
  });
});

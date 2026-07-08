import { describe, it, expect, beforeEach } from 'vitest';
import { generateDiagnostics } from '../services/task028ExecutionDiagnosticsService';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';

describe('Task 028 Execution Diagnostics Service', () => {
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
  });

  it('should generate diagnostics for a valid run', async () => {
    const result = await generateDiagnostics(runId, 'school-1');
    expect(result.runId).toBe(runId);
    expect(result.schoolId).toBe('school-1');
    expect(result.runStatus).toBe('stage_1_active');
    expect(typeof result.uptimeSeconds).toBe('number');
    expect(result.safeMessage).toContain('Diagnostics generated');
  });

  it('should count active cohorts correctly', async () => {
    await task028ExpansionExecutionRepository.createExpandedParticipant({
      executionRunId: runId, pilotProgramId: 'pp-1', schoolId: 'school-1',
      actorIdHash: 'student-1', role: 'student', activationStatus: 'active',
    });
    await task028ExpansionExecutionRepository.createExpandedParticipant({
      executionRunId: runId, pilotProgramId: 'pp-1', schoolId: 'school-1',
      actorIdHash: 'student-2', role: 'student', activationStatus: 'pending',
    });
    const result = await generateDiagnostics(runId, 'school-1');
    expect(result.activeCohortCount).toBe(1);
  });

  it('should count audit events', async () => {
    await task028ExpansionExecutionRepository.createAuditRecord({
      executionRunId: runId, pilotProgramId: 'pp-1', schoolId: 'school-1',
      actorRole: 'admin', action: 'test_action', safeSummary: 'Test',
    });
    await task028ExpansionExecutionRepository.createAuditRecord({
      executionRunId: runId, pilotProgramId: 'pp-1', schoolId: 'school-1',
      actorRole: 'admin', action: 'test_action_2', safeSummary: 'Test 2',
    });
    const result = await generateDiagnostics(runId, 'school-1');
    expect(result.auditEventCount).toBe(2);
  });

  it('should count interventions', async () => {
    await task028ExpansionExecutionRepository.createInterventionRecord({
      executionRunId: runId, pilotProgramId: 'pp-1', schoolId: 'school-1',
      interventionType: 'pause_execution', actorRole: 'admin', safeSummary: 'Pause',
    });
    const result = await generateDiagnostics(runId, 'school-1');
    expect(result.interventionCount).toBe(1);
  });

  it('should count health snapshots', async () => {
    await task028ExpansionExecutionRepository.createHealthSnapshot({
      executionRunId: runId, pilotProgramId: 'pp-1', schoolId: 'school-1',
      activeExpandedSessions: 5, allowedExpandedSessionStarts: 10, blockedExpandedSessionStarts: 0,
      schoolAuthBlocks: 0, cohortScopeBlocks: 0, curriculumGateBlocks: 0, socraticGateBlocks: 0,
      deenGateBlocks: 0, privacyGateBlocks: 0, aiCallBlocks: 0, memoryAccessBlocks: 0,
      evidenceWriteBlocks: 0, feedbackCount: 0, oversightItemCount: 0, interventionCount: 0,
      incidentBridgeCount: 0, errorCount: 0, safeSummary: 'Healthy',
    });
    const result = await generateDiagnostics(runId, 'school-1');
    expect(result.healthSnapshotCount).toBe(1);
  });

  it('should throw for missing runId', async () => {
    await expect(generateDiagnostics('', 'school-1')).rejects.toThrow();
  });

  it('should throw for missing schoolId', async () => {
    await expect(generateDiagnostics(runId, '')).rejects.toThrow();
  });

  it('should throw for non-existent run', async () => {
    await expect(generateDiagnostics('nonexistent', 'school-1')).rejects.toThrow();
  });

  it('should throw for school ID mismatch', async () => {
    await expect(generateDiagnostics(runId, 'wrong-school')).rejects.toThrow();
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { recordMetricSnapshot, getLatestMetrics } from '../services/task026PilotMetricService';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';

describe('Task 026 Pilot Metric Service', () => {
  let executionRunId: string;

  beforeEach(async () => {
    task026PilotExecutionRepository._clearMemory();
    process.env.NODE_ENV = 'test';

    const run = await task026PilotExecutionRepository.createExecutionRun({
      pilotProgramId: 'pp-test',
      schoolId: 'school-1',
      status: 'active',
      safeSummary: 'Metrics test run',
    });
    executionRunId = (run as any).id;
  });

  it('should record and retrieve metric snapshots', async () => {
    const result = await recordMetricSnapshot({
      executionRunId,
      pilotProgramId: 'pp-test',
      schoolId: 'school-1',
      activeSessions: 5,
      allowedSessionStarts: 10,
      blockedSessionStarts: 2,
      pilotAccessDeniedCount: 1,
      curriculumGateBlockCount: 0,
      schoolAuthGateBlockCount: 0,
      socraticGateBlockCount: 0,
      deenGateBlockCount: 0,
      privacyGateBlockCount: 0,
      aiCallBlockedCount: 0,
      aiCallAllowedCount: 8,
      feedbackCount: 3,
      safetySignalCount: 1,
      incidentBridgeCount: 0,
      errorCount: 1,
    });

    expect(result.ok).toBe(true);
    expect(result.snapshotId).toBeTruthy();
  });

  it('should use aggregate counts only - no raw messages', async () => {
    await recordMetricSnapshot({
      executionRunId,
      pilotProgramId: 'pp-test',
      schoolId: 'school-1',
      activeSessions: 5,
      allowedSessionStarts: 10,
      blockedSessionStarts: 0,
      pilotAccessDeniedCount: 0,
      curriculumGateBlockCount: 0,
      schoolAuthGateBlockCount: 0,
      socraticGateBlockCount: 0,
      deenGateBlockCount: 0,
      privacyGateBlockCount: 0,
      aiCallBlockedCount: 0,
      aiCallAllowedCount: 10,
      feedbackCount: 2,
      safetySignalCount: 0,
      incidentBridgeCount: 0,
      errorCount: 0,
    });

    const metrics = await getLatestMetrics(executionRunId);
    expect(metrics).toBeTruthy();
    expect(metrics!.activeSessions).toBe(5);
    expect(metrics!.allowedSessionStarts).toBe(10);
  });

  it('should reject missing fields', async () => {
    const result = await recordMetricSnapshot({
      executionRunId: '',
      pilotProgramId: '',
      schoolId: '',
      activeSessions: 0,
      allowedSessionStarts: 0,
      blockedSessionStarts: 0,
      pilotAccessDeniedCount: 0,
      curriculumGateBlockCount: 0,
      schoolAuthGateBlockCount: 0,
      socraticGateBlockCount: 0,
      deenGateBlockCount: 0,
      privacyGateBlockCount: 0,
      aiCallBlockedCount: 0,
      aiCallAllowedCount: 0,
      feedbackCount: 0,
      safetySignalCount: 0,
      incidentBridgeCount: 0,
      errorCount: 0,
    });

    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('missing_required_fields');
  });

  it('should return null when no metrics exist', async () => {
    const run = await task026PilotExecutionRepository.createExecutionRun({
      pilotProgramId: 'pp-empty',
      schoolId: 'school-1',
      status: 'active',
      safeSummary: 'Empty metrics run',
    });
    const emptyRunId = (run as any).id;
    const metrics = await getLatestMetrics(emptyRunId);
    expect(metrics).toBeNull();
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { createSafetySignal, listSafetySignals, createSafetySignalFromFeedback } from '../services/task026PilotSafetySignalService';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';

describe('Task 026 Pilot Safety Signal Service', () => {
  let executionRunId: string;

  beforeEach(async () => {
    task026PilotExecutionRepository._clearMemory();
    process.env.NODE_ENV = 'test';

    const run = await task026PilotExecutionRepository.createExecutionRun({
      pilotProgramId: 'pp-test',
      schoolId: 'school-1',
      status: 'active',
      safeSummary: 'Safety test run',
    });
    executionRunId = (run as any).id;
  });

  it('should create a safety signal', async () => {
    const result = await createSafetySignal({
      executionRunId,
      pilotProgramId: 'pp-test',
      schoolId: 'school-1',
      signalType: 'runtime_guard_denial',
      severity: 'high',
      source: 'guard_service',
      safeSummary: 'Multiple access denials detected',
      reasonCodes: ['access_denied'],
      requiresPause: true,
    });

    expect(result.ok).toBe(true);
    expect(result.signalId).toBeTruthy();
  });

  it('should handle critical severity signals with rollback', async () => {
    const result = await createSafetySignal({
      executionRunId,
      pilotProgramId: 'pp-test',
      schoolId: 'school-1',
      signalType: 'privacy_scan',
      severity: 'critical',
      source: 'privacy_scanner',
      safeSummary: 'Privacy leak detected',
      requiresRollback: true,
      requiresPause: true,
    });

    expect(result.ok).toBe(true);

    const signals = await listSafetySignals(executionRunId);
    const signal = signals.find((s: any) => s.severity === 'critical');
    expect(signal).toBeTruthy();
    expect(signal.requiresRollback).toBe(true);
  });

  it('should create signal from feedback with risk flags', async () => {
    await createSafetySignalFromFeedback({
      executionRunId,
      pilotProgramId: 'pp-test',
      schoolId: 'school-1',
      feedbackType: 'deen_concern',
      riskFlags: ['deen', 'teacher_action_requested'],
      safeSummary: 'Deen concern from feedback',
      actorRole: 'teacher',
    });

    const signals = await listSafetySignals(executionRunId);
    expect(signals.length).toBe(1);
    expect(signals[0].signalType).toBe('feedback_risk');
    expect(signals[0].requiresTeacherReview).toBe(true);
    expect(signals[0].requiresDeenReview).toBe(true);
  });

  it('should reject invalid severity', async () => {
    const result = await createSafetySignal({
      executionRunId,
      pilotProgramId: 'pp-test',
      schoolId: 'school-1',
      signalType: 'runtime_guard_denial',
      severity: 'invalid' as any,
      source: 'test',
      safeSummary: 'Test',
    });

    expect(result.ok).toBe(false);
  });

  it('should list safety signals', async () => {
    await createSafetySignal({
      executionRunId,
      pilotProgramId: 'pp-test',
      schoolId: 'school-1',
      signalType: 'feedback_risk',
      severity: 'medium',
      source: 'test',
      safeSummary: 'Signal 1',
    });
    await createSafetySignal({
      executionRunId,
      pilotProgramId: 'pp-test',
      schoolId: 'school-1',
      signalType: 'operations_degradation',
      severity: 'high',
      source: 'test',
      safeSummary: 'Signal 2',
    });

    const signals = await listSafetySignals(executionRunId);
    expect(signals.length).toBe(2);
  });
});

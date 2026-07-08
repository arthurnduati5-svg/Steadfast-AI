import { describe, it, expect, beforeEach } from 'vitest';
import { createPilotIncident } from '../services/task026PilotIncidentBridgeService';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';

describe('Task 026 Pilot Incident Bridge', () => {
  let executionRunId: string;

  beforeEach(async () => {
    task026PilotExecutionRepository._clearMemory();
    process.env.NODE_ENV = 'test';

    const run = await task026PilotExecutionRepository.createExecutionRun({
      pilotProgramId: 'pp-test',
      schoolId: 'school-1',
      status: 'active',
      safeSummary: 'Incident bridge test',
    });
    executionRunId = (run as any).id;
  });

  it('should create incident for critical safety signal', async () => {
    const result = await createPilotIncident({
      executionRunId,
      pilotProgramId: 'pp-test',
      schoolId: 'school-1',
      reason: 'critical_pilot_safety_signal',
      severity: 'critical',
      safeSummary: 'Critical safety signal detected during pilot execution.',
      reasonCodes: ['critical_safety_signal'],
    });

    expect(result.ok).toBe(true);
    expect(result.incidentId).toBeTruthy();
  });

  it('should create incident for privacy leak risk', async () => {
    const result = await createPilotIncident({
      executionRunId,
      pilotProgramId: 'pp-test',
      schoolId: 'school-1',
      reason: 'privacy_leak_risk',
      severity: 'high',
      safeSummary: 'Privacy leak risk detected.',
      reasonCodes: ['privacy_risk'],
    });

    expect(result.ok).toBe(true);
  });

  it('should create incident for school auth bypass attempt', async () => {
    const result = await createPilotIncident({
      executionRunId,
      pilotProgramId: 'pp-test',
      schoolId: 'school-1',
      reason: 'school_auth_bypass_attempt',
      severity: 'critical',
      safeSummary: 'School auth bypass attempt detected.',
      reasonCodes: ['auth_bypass'],
    });

    expect(result.ok).toBe(true);
  });

  it('should create incident for curriculum gate bypass attempt', async () => {
    const result = await createPilotIncident({
      executionRunId,
      pilotProgramId: 'pp-test',
      schoolId: 'school-1',
      reason: 'curriculum_gate_bypass_attempt',
      severity: 'high',
      safeSummary: 'Curriculum gate bypass attempt.',
      reasonCodes: ['curriculum_bypass'],
    });

    expect(result.ok).toBe(true);
  });

  it('should create incident for AI call before gates', async () => {
    const result = await createPilotIncident({
      executionRunId,
      pilotProgramId: 'pp-test',
      schoolId: 'school-1',
      reason: 'ai_call_before_gates',
      severity: 'high',
      safeSummary: 'AI call attempted before runtime gate passed.',
      reasonCodes: ['ai_before_gate'],
    });

    expect(result.ok).toBe(true);
  });

  it('should create safety signal and audit record in incident bridge', async () => {
    // We use a unique execution run to isolate
    const run = await task026PilotExecutionRepository.createExecutionRun({
      pilotProgramId: 'pp-test-iso',
      schoolId: 'school-2',
      status: 'active',
      safeSummary: 'Isolated incident test',
    });
    const isolatedRunId = (run as any).id;

    await createPilotIncident({
      executionRunId: isolatedRunId,
      pilotProgramId: 'pp-test-iso',
      schoolId: 'school-2',
      reason: 'rollback_failure',
      severity: 'critical',
      safeSummary: 'Rollback mechanism failed during pilot.',
      reasonCodes: ['rollback_failure'],
    });

    const signals = await task026PilotExecutionRepository.listSafetySignals(isolatedRunId);
    expect(signals.length).toBe(1);

    const audits = await task026PilotExecutionRepository.listAuditRecords(isolatedRunId);
    const incidentAudits = audits.filter((a: any) => a.action.includes('incident_bridge'));
    expect(incidentAudits.length).toBe(1);
  });
});

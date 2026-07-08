import { describe, it, expect, beforeEach } from 'vitest';
import { bridgeIncident } from '../services/task028ExpansionIncidentBridgeService';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';

describe('Task 028 Expansion Incident Bridge Service', () => {
  let runId: string;

  beforeEach(async () => {
    task028ExpansionExecutionRepository._clearMemory();
    process.env.NODE_ENV = 'test';
    delete process.env.TASK028_REQUIRE_REAL_PRISMA;

    const run = await task028ExpansionExecutionRepository.createExecutionRun({
      expansionProposalId: 'prop-1', pilotProgramId: 'pp-1',
      schoolId: 'school-1', status: 'stage_1_active', safeSummary: 'Active',
    });
    runId = (run as any).id;
  });

  it('should bridge a critical incident with pause recommendation', async () => {
    const result = await bridgeIncident({
      runId, schoolId: 'school-1', severity: 'critical',
      safeSummary: 'Multiple curriculum gate blocks detected',
    });
    expect(result.ok).toBe(true);
    expect(result.incidentId).toBeTruthy();
    expect(result.severity).toBe('critical');
    expect(result.recommendedAction).toBe('immediate_pause_and_review');
    expect(result.reasonCodes).toEqual([]);
  });

  it('should bridge a high severity incident with escalation', async () => {
    const result = await bridgeIncident({
      runId, schoolId: 'school-1', severity: 'high',
      safeSummary: 'Suspicious access pattern',
    });
    expect(result.ok).toBe(true);
    expect(result.recommendedAction).toBe('escalate_to_operator');
  });

  it('should bridge a medium severity incident with log and monitor', async () => {
    const result = await bridgeIncident({
      runId, schoolId: 'school-1', severity: 'medium',
      safeSummary: 'Rate limit approached',
    });
    expect(result.ok).toBe(true);
    expect(result.recommendedAction).toBe('log_and_monitor');
  });

  it('should bridge a low severity incident with log only', async () => {
    const result = await bridgeIncident({
      runId, schoolId: 'school-1', severity: 'low',
      safeSummary: 'Minor anomaly',
    });
    expect(result.ok).toBe(true);
    expect(result.recommendedAction).toBe('log_only');
  });

  it('should create an oversight item for the incident', async () => {
    await bridgeIncident({
      runId, schoolId: 'school-1', severity: 'critical',
      safeSummary: 'Critical safety signal',
    });
    const items = await task028ExpansionExecutionRepository.listOversightItems(runId);
    expect(items.length).toBe(1);
    expect(items[0].itemType).toBe('critical_safety_signal');
    expect(items[0].severity).toBe('critical');
  });

  it('should fail for invalid input', async () => {
    const result = await bridgeIncident({
      runId: '', schoolId: '', severity: 'unknown' as any,
      safeSummary: '',
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes.length).toBeGreaterThan(0);
  });

  it('should fail for non-existent run', async () => {
    const result = await bridgeIncident({
      runId: 'nonexistent', schoolId: 'school-1', severity: 'high',
      safeSummary: 'Incident in unknown run',
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('execution_run_not_found');
  });

  it('should create audit record for the incident', async () => {
    await bridgeIncident({
      runId, schoolId: 'school-1', severity: 'high',
      safeSummary: 'Test incident',
    });
    const audits = await task028ExpansionExecutionRepository.listAuditRecords(runId);
    expect(audits.some((a: any) => a.action === 'incident_bridged_high')).toBe(true);
  });
});

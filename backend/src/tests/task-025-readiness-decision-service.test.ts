import { describe, it, expect, vi, beforeEach } from 'vitest';
import { evaluateReadinessDecision } from '../services/task025ReadinessDecisionService';
import { task025PilotReadinessRepository } from '../services/task025PilotReadinessRepository';

vi.mock('../services/task025PilotReadinessRepository', () => ({
  task025PilotReadinessRepository: {
    writeAuditEvent: vi.fn(() => ({ id: 'audit-mock-001' })),
  },
}));

describe('evaluateReadinessDecision', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const allPassed = {
    scopeGatePassed: true,
    cohortReadinessPassed: true,
    teacherWorkflowPassed: true,
    adminAcceptancePassed: true,
    parentCommunicationPassed: true,
    safeguardingPassed: true,
    supportOperationsPassed: true,
    monitoringGatePassed: true,
    pauseRollbackPassed: true,
    dataPrivacyPassed: true,
    task020ContinuityPassed: true,
    task021ContinuityPassed: true,
    task022ContinuityPassed: true,
    task023ContinuityPassed: true,
    task024ContinuityPassed: true,
    extraBlockers: [],
  };

  it('returns ready_to_start_task026 when all checks pass', async () => {
    const result = await evaluateReadinessDecision('school-1', 'system_admin', 'req-1', allPassed);
    expect(result.decision).toBe('ready_to_start_task026');
    expect(result.riskLevel).toBe('low');
    expect(result.task026SafeToStart).toBe(true);
    expect(result.safeBlockers).toHaveLength(0);
    expect(result.requiredActions).toHaveLength(0);
  });

  it('returns not_ready when scopeGatePassed fails', async () => {
    const result = await evaluateReadinessDecision('school-1', 'system_admin', 'req-1', {
      ...allPassed,
      scopeGatePassed: false,
    });
    expect(result.decision).toBe('not_ready');
    expect(result.riskLevel).toBe('high');
    expect(result.task026SafeToStart).toBe(false);
    expect(result.safeBlockers).toHaveLength(1);
    expect(result.safeBlockers[0].type).toBe('pilot_scope');
  });

  it('returns manual_review_required when only parentCommunicationPassed fails (medium)', async () => {
    const result = await evaluateReadinessDecision('school-1', 'system_admin', 'req-1', {
      ...allPassed,
      parentCommunicationPassed: false,
    });
    expect(result.decision).toBe('manual_review_required');
    expect(result.riskLevel).toBe('medium');
    expect(result.task026SafeToStart).toBe(false);
    expect(result.safeBlockers).toHaveLength(1);
    expect(result.safeBlockers[0].severity).toBe('medium');
  });

  it('returns not_ready when a high-severity continuity check fails alongside a medium one', async () => {
    const result = await evaluateReadinessDecision('school-1', 'system_admin', 'req-1', {
      ...allPassed,
      task020ContinuityPassed: false,
      parentCommunicationPassed: false,
    });
    expect(result.decision).toBe('not_ready');
    expect(result.riskLevel).toBe('high');
    expect(result.safeBlockers).toHaveLength(2);
  });

  it('returns not_ready for task023 continuity failure', async () => {
    const result = await evaluateReadinessDecision('school-1', 'system_admin', 'req-1', {
      ...allPassed,
      task023ContinuityPassed: false,
    });
    expect(result.decision).toBe('not_ready');
    expect(result.safeBlockers[0].type).toBe('deployment_readiness');
  });

  it('returns not_ready for task024 continuity failure', async () => {
    const result = await evaluateReadinessDecision('school-1', 'system_admin', 'req-1', {
      ...allPassed,
      task024ContinuityPassed: false,
    });
    expect(result.decision).toBe('not_ready');
    expect(result.safeBlockers[0].type).toBe('operations_readiness');
  });

  it('returns not_ready and includes extra blockers in the decision', async () => {
    const extraBlockers = [
      { type: 'data_privacy' as const, severity: 'high' as const, safeDescription: 'Custom blocker', requiredAction: 'Fix it' },
    ];
    const result = await evaluateReadinessDecision('school-1', 'system_admin', 'req-1', {
      ...allPassed,
      extraBlockers,
    });
    expect(result.decision).toBe('not_ready');
    expect(result.safeBlockers).toHaveLength(1);
    expect(result.safeBlockers[0].safeDescription).toBe('Custom blocker');
  });

  it('aggregates unique required actions across multiple failures', async () => {
    const result = await evaluateReadinessDecision('school-1', 'system_admin', 'req-1', {
      ...allPassed,
      scopeGatePassed: false,
      safeguardingPassed: false,
      monitoringGatePassed: false,
    });
    expect(result.decision).toBe('not_ready');
    expect(result.requiredActions.length).toBeGreaterThanOrEqual(3);
    expect(result.requiredActions).toContain('Resolve all pilot scope blockers.');
    expect(result.requiredActions).toContain('Resolve all safeguarding escalation blockers.');
    expect(result.requiredActions).toContain('Resolve all monitoring gate blockers.');
  });

  it('returns not_ready when all gates fail', async () => {
    const result = await evaluateReadinessDecision('school-1', 'system_admin', 'req-1', {
      scopeGatePassed: false,
      cohortReadinessPassed: false,
      teacherWorkflowPassed: false,
      adminAcceptancePassed: false,
      parentCommunicationPassed: false,
      safeguardingPassed: false,
      supportOperationsPassed: false,
      monitoringGatePassed: false,
      pauseRollbackPassed: false,
      dataPrivacyPassed: false,
      task020ContinuityPassed: false,
      task021ContinuityPassed: false,
      task022ContinuityPassed: false,
      task023ContinuityPassed: false,
      task024ContinuityPassed: false,
      extraBlockers: [{ type: 'school_identity', severity: 'high', safeDescription: 'Final extra', requiredAction: 'Resolve' }],
    });
    expect(result.decision).toBe('not_ready');
    expect(result.riskLevel).toBe('high');
    expect(result.task026SafeToStart).toBe(false);
    expect(result.safeBlockers).toHaveLength(16);
    expect(result.safeSummary).toContain('15 high-severity blocker(s) and 1 other issue');
  });
});

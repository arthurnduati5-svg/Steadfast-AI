import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';

export type IncidentBridgeReason =
  | 'critical_pilot_safety_signal'
  | 'privacy_leak_risk'
  | 'safeguarding_serious_risk'
  | 'deen_governance_severe_issue'
  | 'school_auth_bypass_attempt'
  | 'curriculum_gate_bypass_attempt'
  | 'ai_call_before_gates'
  | 'kill_switch_failure'
  | 'rollback_failure'
  | 'repeated_technical_failure';

export async function createPilotIncident(params: {
  executionRunId: string;
  pilotProgramId: string;
  schoolId: string;
  reason: IncidentBridgeReason;
  safeSummary: string;
  severity: string;
  reasonCodes: string[];
  metadataSafeJson?: Record<string, unknown>;
}): Promise<{ ok: boolean; incidentId?: string; safeMessage: string }> {
  const safeSummary = (params.safeSummary || '').substring(0, 2000);

  const signal = await task026PilotExecutionRepository.createSafetySignal({
    executionRunId: params.executionRunId,
    pilotProgramId: params.pilotProgramId,
    schoolId: params.schoolId,
    signalType: params.severity === 'critical' ? 'privacy_scan' : 'runtime_guard_denial',
    severity: params.severity === 'critical' ? 'critical' : params.severity === 'high' ? 'high' : 'medium',
    source: `incident_bridge:${params.reason}`,
    safeSummary,
    reasonCodes: params.reasonCodes,
    linkedIncidentId: undefined,
    requiresPause: ['critical', 'high'].includes(params.severity),
    requiresRollback: params.severity === 'critical',
    requiresTeacherReview: true,
    requiresSafeguardingReview: params.reason === 'safeguarding_serious_risk',
    requiresDeenReview: params.reason === 'deen_governance_severe_issue',
    metadataSafeJson: params.metadataSafeJson ?? {},
  });

  const { createPilotAuditRecord } = await import('./task026PilotExecutionControlService');
  await createPilotAuditRecord({
    executionRunId: params.executionRunId,
    pilotProgramId: params.pilotProgramId,
    schoolId: params.schoolId,
    actorRole: 'system',
    action: `incident_bridge_${params.reason}`,
    safeSummary,
    metadataSafeJson: params.metadataSafeJson,
    requestId: (params.metadataSafeJson as any)?.requestId,
  });

  return {
    ok: true,
    incidentId: (signal as any).id,
    safeMessage: `Incident bridge created for ${params.reason}.`,
  };
}

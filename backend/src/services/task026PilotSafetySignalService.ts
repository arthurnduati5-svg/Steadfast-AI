import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import type { PilotSafetySignalType, PilotSafetySeverity } from '../contracts/task026PilotExecutionContracts';
import { PILOT_SAFETY_SEVERITIES } from '../contracts/task026PilotExecutionContracts';

export async function createSafetySignal(data: {
  executionRunId: string;
  pilotProgramId: string;
  schoolId: string;
  signalType: PilotSafetySignalType;
  severity: PilotSafetySeverity;
  source: string;
  safeSummary: string;
  reasonCodes?: string[];
  linkedIncidentId?: string;
  requiresPause?: boolean;
  requiresRollback?: boolean;
  requiresTeacherReview?: boolean;
  requiresSafeguardingReview?: boolean;
  requiresDeenReview?: boolean;
  metadataSafeJson?: Record<string, unknown>;
}): Promise<{ ok: boolean; signalId?: string; safeMessage: string }> {
  if (!PILOT_SAFETY_SEVERITIES.includes(data.severity)) {
    return { ok: false, safeMessage: `Invalid severity: ${data.severity}` };
  }

  const safeSummary = (data.safeSummary || '').substring(0, 2000);

  const signal = await task026PilotExecutionRepository.createSafetySignal({
    executionRunId: data.executionRunId,
    pilotProgramId: data.pilotProgramId,
    schoolId: data.schoolId,
    signalType: data.signalType,
    severity: data.severity,
    source: data.source,
    safeSummary,
    reasonCodes: data.reasonCodes ?? [],
    linkedIncidentId: data.linkedIncidentId,
    requiresPause: data.requiresPause ?? false,
    requiresRollback: data.requiresRollback ?? false,
    requiresTeacherReview: data.requiresTeacherReview ?? false,
    requiresSafeguardingReview: data.requiresSafeguardingReview ?? false,
    requiresDeenReview: data.requiresDeenReview ?? false,
    metadataSafeJson: data.metadataSafeJson ?? {},
  });

  return {
    ok: true,
    signalId: (signal as any).id,
    safeMessage: `Safety signal ${data.signalType} (${data.severity}) created.`,
  };
}

export async function createSafetySignalFromFeedback(params: {
  executionRunId: string;
  pilotProgramId: string;
  schoolId: string;
  feedbackType: string;
  riskFlags: string[];
  safeSummary: string;
  actorRole: string;
}): Promise<void> {
  const severity = (params.riskFlags.includes('safeguarding') ? 'high' : 'medium') as PilotSafetySeverity;
  const requiresPause = severity === 'high' || params.riskFlags.includes('privacy');
  const requiresRollback = false;
  const requiresTeacherReview = params.riskFlags.includes('teacher_action_requested') || params.riskFlags.includes('deen');
  const requiresDeenReview = params.riskFlags.includes('deen');
  const requiresSafeguardingReview = params.riskFlags.includes('safeguarding');

  await task026PilotExecutionRepository.createSafetySignal({
    executionRunId: params.executionRunId,
    pilotProgramId: params.pilotProgramId,
    schoolId: params.schoolId,
    signalType: 'feedback_risk',
    severity,
    source: `feedback:${params.actorRole}`,
    safeSummary: params.safeSummary.substring(0, 2000),
    reasonCodes: params.riskFlags,
    requiresPause,
    requiresRollback,
    requiresTeacherReview,
    requiresSafeguardingReview,
    requiresDeenReview,
  });
}

export async function listSafetySignals(executionRunId: string) {
  const signals = await task026PilotExecutionRepository.listSafetySignals(executionRunId);
  return signals.map((s: any) => ({
    id: s.id,
    signalType: s.signalType,
    severity: s.severity,
    source: s.source,
    status: s.status,
    safeSummary: s.safeSummary,
    reasonCodes: s.reasonCodes,
    linkedIncidentId: s.linkedIncidentId,
    requiresPause: s.requiresPause,
    requiresRollback: s.requiresRollback,
    requiresTeacherReview: s.requiresTeacherReview,
    requiresSafeguardingReview: s.requiresSafeguardingReview,
    requiresDeenReview: s.requiresDeenReview,
    createdAt: s.createdAt,
  }));
}

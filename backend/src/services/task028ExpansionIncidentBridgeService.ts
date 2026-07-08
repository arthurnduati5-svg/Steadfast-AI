import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import type {
  Task028IncidentBridgeResult,
  Task028IncidentBridgeInput,
} from '../contracts/task028ControlledExpansionExecutionContracts';
import { nowISO } from '../contracts/task028ControlledExpansionExecutionContracts';
import {
  validateTask028IncidentBridgeInput,
  createSafeTask028ValidationError,
} from '../lib/task028ControlledExpansionExecutionValidation';

export async function bridgeIncident(
  input: Task028IncidentBridgeInput,
): Promise<Task028IncidentBridgeResult> {
  const errors = validateTask028IncidentBridgeInput(input);
  if (errors.length > 0) {
    return {
      ok: false,
      incidentId: '',
      severity: input.severity,
      recommendedAction: 'review_input',
      reasonCodes: errors,
      safeMessage: 'Invalid incident input.',
    };
  }

  const { runId, schoolId, severity, safeSummary, metadataSafeJson } = input;

  const run = await task028ExpansionExecutionRepository.getExecutionRun(runId);
  if (!run) {
    return {
      ok: false,
      incidentId: '',
      severity,
      recommendedAction: 'noop',
      reasonCodes: ['execution_run_not_found'],
      safeMessage: 'Execution run not found. Incident not recorded.',
    };
  }
  const runAny = run as any;

  const oversightItem = await task028ExpansionExecutionRepository.createOversightItem({
    executionRunId: runId,
    pilotProgramId: runAny.pilotProgramId,
    schoolId,
    itemType: 'critical_safety_signal',
    severity,
    source: 'incident_bridge',
    safeSummary,
    requiresTeacherReview: severity === 'high' || severity === 'critical',
    requiresAdminReview: severity === 'critical',
    requiresPrivacyReview: false,
    requiresDeenReview: false,
    requiresSocraticReview: false,
    requiresCurriculumReview: false,
    requiresPause: severity === 'critical',
    requiresRollback: false,
    metadataSafeJson: { ...(metadataSafeJson ?? {}), severity, timestamp: nowISO() },
  });

  let recommendedAction: string;
  if (severity === 'critical') {
    recommendedAction = 'immediate_pause_and_review';
  } else if (severity === 'high') {
    recommendedAction = 'escalate_to_operator';
  } else if (severity === 'medium') {
    recommendedAction = 'log_and_monitor';
  } else {
    recommendedAction = 'log_only';
  }

  await task028ExpansionExecutionRepository.createAuditRecord({
    executionRunId: runId,
    pilotProgramId: runAny.pilotProgramId,
    schoolId,
    actorRole: 'internal_operator',
    action: `incident_bridged_${severity}`,
    safeSummary: `Incident bridged with severity ${severity}: ${safeSummary}`,
    metadataSafeJson: { severity, recommendedAction, timestamp: nowISO() },
  });

  return {
    ok: true,
    incidentId: (oversightItem as any).id,
    severity,
    recommendedAction,
    reasonCodes: [],
    safeMessage: `Incident bridged with severity ${severity}. Action: ${recommendedAction}. No external systems paged.`,
  };
}

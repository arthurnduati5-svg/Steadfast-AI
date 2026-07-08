import type {
  Task025SafeguardingReadinessStatus,
  Task025ReadinessBlocker,
  Task025RiskLevel,
} from '../contracts/task025ControlledPilotReadinessContracts';

export interface SafeguardingEscalationResult {
  safeguardingStatus: Task025SafeguardingReadinessStatus;
  riskLevel: Task025RiskLevel;
  safeSummary: string;
  safeBlockers: Task025ReadinessBlocker[];
  safeguardingOwnerExists: boolean;
  escalationRouteDefined: boolean;
  seriousRiskDisclosureMinimal: boolean;
  rawNotesNeverExposed: boolean;
  humanReviewPathExists: boolean;
  auditEventCreated: boolean;
}

export async function checkSafeguardingEscalationReadiness(params: {
  safeguardingOwnerExists: boolean;
  escalationRouteDefined: boolean;
  seriousRiskDisclosureMinimal: boolean;
  rawNotesNeverExposed: boolean;
  humanReviewPathExists: boolean;
  auditEventCreated: boolean;
}): Promise<SafeguardingEscalationResult> {
  const blockers: Task025ReadinessBlocker[] = [];

  if (!params.safeguardingOwnerExists) {
    blockers.push({
      type: 'safeguarding_escalation',
      severity: 'high',
      safeDescription: 'No safeguarding escalation owner exists.',
      requiredAction: 'Assign a safeguarding escalation owner.',
    });
  }

  if (!params.escalationRouteDefined) {
    blockers.push({
      type: 'safeguarding_escalation',
      severity: 'high',
      safeDescription: 'No escalation route is defined.',
      requiredAction: 'Define a clear safeguarding escalation route.',
    });
  }

  if (!params.seriousRiskDisclosureMinimal) {
    blockers.push({
      type: 'safeguarding_escalation',
      severity: 'high',
      safeDescription: 'Serious-risk disclosure is not minimized and role-scoped.',
      requiredAction: 'Review and minimize serious-risk disclosure to essential role-scoped information only.',
    });
  }

  if (!params.rawNotesNeverExposed) {
    blockers.push({
      type: 'safeguarding_escalation',
      severity: 'high',
      safeDescription: 'Raw safeguarding notes may be exposed in pilot reports.',
      requiredAction: 'Ensure raw safeguarding notes are never exposed in pilot reports.',
    });
  }

  if (!params.humanReviewPathExists) {
    blockers.push({
      type: 'safeguarding_escalation',
      severity: 'high',
      safeDescription: 'No human review path exists for safeguarding escalation.',
      requiredAction: 'Establish a human review path for safeguarding escalations.',
    });
  }

  if (!params.auditEventCreated) {
    blockers.push({
      type: 'safeguarding_escalation',
      severity: 'medium',
      safeDescription: 'Audit event was not created for this readiness check.',
      requiredAction: 'Ensure audit events are created for all safeguarding readiness checks.',
    });
  }

  const hasHighBlocker = blockers.some((b) => b.severity === 'high');
  const status: Task025SafeguardingReadinessStatus = hasHighBlocker
    ? 'safeguarding_blocked'
    : 'safeguarding_ready';
  const riskLevel: Task025RiskLevel = hasHighBlocker ? 'high' : 'low';

  return {
    safeguardingStatus: status,
    riskLevel,
    safeSummary: status === 'safeguarding_ready'
      ? 'Safeguarding escalation readiness confirmed.'
      : `Safeguarding escalation readiness has ${blockers.length} blocker(s).`,
    safeBlockers: blockers,
    safeguardingOwnerExists: params.safeguardingOwnerExists,
    escalationRouteDefined: params.escalationRouteDefined,
    seriousRiskDisclosureMinimal: params.seriousRiskDisclosureMinimal,
    rawNotesNeverExposed: params.rawNotesNeverExposed,
    humanReviewPathExists: params.humanReviewPathExists,
    auditEventCreated: params.auditEventCreated,
  };
}

import type {
  Task025AdminAcceptanceStatus,
  Task025ReadinessBlocker,
  Task025RiskLevel,
} from '../contracts/task025ControlledPilotReadinessContracts';

export interface AdminAcceptanceResult {
  adminAcceptanceStatus: Task025AdminAcceptanceStatus;
  riskLevel: Task025RiskLevel;
  safeSummary: string;
  safeBlockers: Task025ReadinessBlocker[];
  adminOwner: string;
  pilotOwnerAssigned: boolean;
  pilotPurposeDefined: boolean;
  pilotScopeDefined: boolean;
  pilotDatesDefined: boolean;
  escalationOwnerAssigned: boolean;
  pauseOwnerAssigned: boolean;
  rollbackOwnerAssigned: boolean;
  supportOwnerAssigned: boolean;
  privacyOwnerAssigned: boolean;
  incidentOwnerAssigned: boolean;
}

export async function checkAdminAcceptance(params: {
  adminOwner: string;
  pilotOwnerAssigned: boolean;
  pilotPurposeDefined: boolean;
  pilotScopeDefined: boolean;
  pilotDatesDefined: boolean;
  escalationOwnerAssigned: boolean;
  pauseOwnerAssigned: boolean;
  rollbackOwnerAssigned: boolean;
  supportOwnerAssigned: boolean;
  privacyOwnerAssigned: boolean;
  incidentOwnerAssigned: boolean;
}): Promise<AdminAcceptanceResult> {
  const blockers: Task025ReadinessBlocker[] = [];

  if (!params.adminOwner || params.adminOwner.trim() === '') {
    blockers.push({
      type: 'admin_acceptance',
      severity: 'high',
      safeDescription: 'No admin acceptance owner identified.',
      requiredAction: 'Identify the admin responsible for acceptance.',
    });
  }

  if (!params.pilotOwnerAssigned) {
    blockers.push({
      type: 'admin_acceptance',
      severity: 'high',
      safeDescription: 'No pilot owner assigned.',
      requiredAction: 'Assign a pilot owner.',
    });
  }

  if (!params.pilotPurposeDefined) {
    blockers.push({
      type: 'admin_acceptance',
      severity: 'high',
      safeDescription: 'Pilot purpose is not defined.',
      requiredAction: 'Define the pilot purpose.',
    });
  }

  if (!params.pilotScopeDefined) {
    blockers.push({
      type: 'admin_acceptance',
      severity: 'high',
      safeDescription: 'Pilot scope is not defined.',
      requiredAction: 'Define the pilot scope.',
    });
  }

  if (!params.pilotDatesDefined) {
    blockers.push({
      type: 'admin_acceptance',
      severity: 'medium',
      safeDescription: 'Pilot dates or dry-run window not defined.',
      requiredAction: 'Define pilot dates or dry-run window.',
    });
  }

  if (!params.escalationOwnerAssigned) {
    blockers.push({
      type: 'safeguarding_escalation',
      severity: 'high',
      safeDescription: 'No escalation owner assigned.',
      requiredAction: 'Assign an escalation owner.',
    });
  }

  if (!params.pauseOwnerAssigned) {
    blockers.push({
      type: 'pause_rollback',
      severity: 'high',
      safeDescription: 'No pause owner assigned.',
      requiredAction: 'Assign a pause owner.',
    });
  }

  if (!params.rollbackOwnerAssigned) {
    blockers.push({
      type: 'pause_rollback',
      severity: 'high',
      safeDescription: 'No rollback owner assigned.',
      requiredAction: 'Assign a rollback owner.',
    });
  }

  if (!params.supportOwnerAssigned) {
    blockers.push({
      type: 'support_operations',
      severity: 'high',
      safeDescription: 'No support owner assigned.',
      requiredAction: 'Assign a support owner.',
    });
  }

  if (!params.privacyOwnerAssigned) {
    blockers.push({
      type: 'data_privacy',
      severity: 'high',
      safeDescription: 'No privacy owner assigned.',
      requiredAction: 'Assign a privacy owner.',
    });
  }

  if (!params.incidentOwnerAssigned) {
    blockers.push({
      type: 'operations_readiness',
      severity: 'high',
      safeDescription: 'No incident owner assigned.',
      requiredAction: 'Assign an incident owner.',
    });
  }

  const hasHighBlocker = blockers.some((b) => b.severity === 'high');
  const status: Task025AdminAcceptanceStatus = hasHighBlocker ? 'admin_acceptance_blocked' : 'admin_acceptance_confirmed';
  const riskLevel: Task025RiskLevel = hasHighBlocker ? 'high' : 'low';

  return {
    adminAcceptanceStatus: status,
    riskLevel,
    safeSummary: status === 'admin_acceptance_confirmed'
      ? 'Admin acceptance readiness confirmed. All required roles assigned.'
      : `Admin acceptance readiness has ${blockers.length} blocker(s).`,
    safeBlockers: blockers,
    adminOwner: params.adminOwner,
    pilotOwnerAssigned: params.pilotOwnerAssigned,
    pilotPurposeDefined: params.pilotPurposeDefined,
    pilotScopeDefined: params.pilotScopeDefined,
    pilotDatesDefined: params.pilotDatesDefined,
    escalationOwnerAssigned: params.escalationOwnerAssigned,
    pauseOwnerAssigned: params.pauseOwnerAssigned,
    rollbackOwnerAssigned: params.rollbackOwnerAssigned,
    supportOwnerAssigned: params.supportOwnerAssigned,
    privacyOwnerAssigned: params.privacyOwnerAssigned,
    incidentOwnerAssigned: params.incidentOwnerAssigned,
  };
}

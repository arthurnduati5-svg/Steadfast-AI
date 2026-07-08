import type {
  Task025StakeholderReadinessStatus,
  Task025ReadinessBlocker,
  Task025RiskLevel,
} from '../contracts/task025ControlledPilotReadinessContracts';

export interface SupportOperationsResult {
  supportStatus: Task025StakeholderReadinessStatus;
  riskLevel: Task025RiskLevel;
  safeSummary: string;
  safeBlockers: Task025ReadinessBlocker[];
  supportOwnerAssigned: boolean;
  incidentOwnerAssigned: boolean;
  supportScheduleDefined: boolean;
  incidentResponseTimeDefined: boolean;
  communicationChainDefined: boolean;
}

export async function checkSupportOperationsReadiness(params: {
  supportOwnerAssigned: boolean;
  incidentOwnerAssigned: boolean;
  supportScheduleDefined: boolean;
  incidentResponseTimeDefined: boolean;
  communicationChainDefined: boolean;
}): Promise<SupportOperationsResult> {
  const blockers: Task025ReadinessBlocker[] = [];

  if (!params.supportOwnerAssigned) {
    blockers.push({
      type: 'support_operations',
      severity: 'high',
      safeDescription: 'No support owner assigned for pilot operations.',
      requiredAction: 'Assign a support owner.',
    });
  }

  if (!params.incidentOwnerAssigned) {
    blockers.push({
      type: 'support_operations',
      severity: 'high',
      safeDescription: 'No incident owner assigned.',
      requiredAction: 'Assign an incident response owner.',
    });
  }

  if (!params.supportScheduleDefined) {
    blockers.push({
      type: 'support_operations',
      severity: 'medium',
      safeDescription: 'Support schedule not defined.',
      requiredAction: 'Define support availability schedule.',
    });
  }

  if (!params.incidentResponseTimeDefined) {
    blockers.push({
      type: 'support_operations',
      severity: 'medium',
      safeDescription: 'Incident response time not defined.',
      requiredAction: 'Define expected incident response times.',
    });
  }

  if (!params.communicationChainDefined) {
    blockers.push({
      type: 'support_operations',
      severity: 'medium',
      safeDescription: 'Communication chain not defined.',
      requiredAction: 'Define the communication chain for incident notification.',
    });
  }

  const hasHighBlocker = blockers.some((b) => b.severity === 'high');
  const status: Task025StakeholderReadinessStatus = hasHighBlocker ? 'stakeholder_blocked' : 'stakeholder_ready';
  const riskLevel: Task025RiskLevel = hasHighBlocker ? 'high' : blockers.length > 0 ? 'medium' : 'low';

  return {
    supportStatus: status,
    riskLevel,
    safeSummary: status === 'stakeholder_ready'
      ? 'Support and operations readiness confirmed.'
      : `Support operations readiness has ${blockers.length} issue(s).`,
    safeBlockers: blockers,
    supportOwnerAssigned: params.supportOwnerAssigned,
    incidentOwnerAssigned: params.incidentOwnerAssigned,
    supportScheduleDefined: params.supportScheduleDefined,
    incidentResponseTimeDefined: params.incidentResponseTimeDefined,
    communicationChainDefined: params.communicationChainDefined,
  };
}

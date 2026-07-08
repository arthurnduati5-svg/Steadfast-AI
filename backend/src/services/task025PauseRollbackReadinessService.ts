import type {
  Task025PauseRollbackStatus,
  Task025ReadinessBlocker,
  Task025RiskLevel,
} from '../contracts/task025ControlledPilotReadinessContracts';

export interface PauseRollbackResult {
  pauseRollbackStatus: Task025PauseRollbackStatus;
  riskLevel: Task025RiskLevel;
  safeSummary: string;
  safeBlockers: Task025ReadinessBlocker[];
  pauseOwnerExists: boolean;
  rollbackOwnerExists: boolean;
  pauseCriteriaDefined: boolean;
  rollbackCriteriaDefined: boolean;
  incidentSeverityMappingExists: boolean;
  communicationChainExistsAsMetadata: boolean;
  noActualRollbackExecuted: boolean;
  noDeploymentCommandExists: boolean;
}

export async function checkPauseRollbackReadiness(params: {
  pauseOwnerExists: boolean;
  rollbackOwnerExists: boolean;
  pauseCriteriaDefined: boolean;
  rollbackCriteriaDefined: boolean;
  incidentSeverityMappingExists: boolean;
  communicationChainExistsAsMetadata: boolean;
  noActualRollbackExecuted: boolean;
  noDeploymentCommandExists: boolean;
}): Promise<PauseRollbackResult> {
  const blockers: Task025ReadinessBlocker[] = [];

  if (!params.pauseOwnerExists) {
    blockers.push({
      type: 'pause_rollback',
      severity: 'high',
      safeDescription: 'No pause owner identified.',
      requiredAction: 'Assign a pause owner.',
    });
  }

  if (!params.rollbackOwnerExists) {
    blockers.push({
      type: 'pause_rollback',
      severity: 'high',
      safeDescription: 'No rollback owner identified.',
      requiredAction: 'Assign a rollback owner.',
    });
  }

  if (!params.pauseCriteriaDefined) {
    blockers.push({
      type: 'pause_rollback',
      severity: 'high',
      safeDescription: 'No pause criteria defined.',
      requiredAction: 'Define clear criteria for pausing the pilot.',
    });
  }

  if (!params.rollbackCriteriaDefined) {
    blockers.push({
      type: 'pause_rollback',
      severity: 'high',
      safeDescription: 'No rollback criteria defined.',
      requiredAction: 'Define clear criteria for rolling back the pilot.',
    });
  }

  if (!params.incidentSeverityMappingExists) {
    blockers.push({
      type: 'pause_rollback',
      severity: 'medium',
      safeDescription: 'No incident severity mapping exists.',
      requiredAction: 'Map incident severity levels to pause/rollback actions.',
    });
  }

  if (!params.communicationChainExistsAsMetadata) {
    blockers.push({
      type: 'pause_rollback',
      severity: 'medium',
      safeDescription: 'No communication chain defined as metadata.',
      requiredAction: 'Define communication chain for escalation notifications.',
    });
  }

  if (!params.noActualRollbackExecuted) {
    blockers.push({
      type: 'pause_rollback',
      severity: 'high',
      safeDescription: 'An actual rollback was executed during readiness check.',
      requiredAction: 'Ensure no actual rollback is executed during readiness evaluation.',
    });
  }

  if (!params.noDeploymentCommandExists) {
    blockers.push({
      type: 'pause_rollback',
      severity: 'high',
      safeDescription: 'A deployment command was detected in readiness context.',
      requiredAction: 'Remove deployment commands from readiness context.',
    });
  }

  const hasHighBlocker = blockers.some((b) => b.severity === 'high');
  const status: Task025PauseRollbackStatus = hasHighBlocker
    ? 'pause_rollback_blocked'
    : blockers.length > 0
      ? 'pause_rollback_pending'
      : 'pause_rollback_ready';
  const riskLevel: Task025RiskLevel = hasHighBlocker ? 'high' : blockers.length > 0 ? 'medium' : 'low';

  return {
    pauseRollbackStatus: status,
    riskLevel,
    safeSummary: status === 'pause_rollback_ready'
      ? 'Pause and rollback readiness confirmed.'
      : `Pause and rollback readiness has ${blockers.length} issue(s).`,
    safeBlockers: blockers,
    pauseOwnerExists: params.pauseOwnerExists,
    rollbackOwnerExists: params.rollbackOwnerExists,
    pauseCriteriaDefined: params.pauseCriteriaDefined,
    rollbackCriteriaDefined: params.rollbackCriteriaDefined,
    incidentSeverityMappingExists: params.incidentSeverityMappingExists,
    communicationChainExistsAsMetadata: params.communicationChainExistsAsMetadata,
    noActualRollbackExecuted: params.noActualRollbackExecuted,
    noDeploymentCommandExists: params.noDeploymentCommandExists,
  };
}
